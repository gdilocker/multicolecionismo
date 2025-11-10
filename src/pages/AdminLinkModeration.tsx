import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PanelLayout } from '../components/PanelLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { Shield, Search, Filter, RefreshCw, Download, ExternalLink, CheckCircle, Ban, AlertTriangle, Clock, Eye, FileText } from 'lucide-react';
import LinkSecurityStatus from '../components/LinkSecurityStatus';

interface LinkModerationItem {
  id: string;
  url: string;
  title: string;
  security_status: 'safe' | 'suspicious' | 'malicious' | 'pending' | 'under_review';
  is_blocked: boolean;
  block_reason?: string;
  last_security_check?: string;
  security_check_count: number;
  profile_id: string;
  user_email?: string;
  user_name?: string;
  domain?: string;
  created_at: string;
}

interface SecurityCheck {
  id: string;
  checked_at: string;
  status: string;
  check_type: string;
  threat_types: string[];
  provider: string;
  notes?: string;
}

interface ModerationAction {
  id: string;
  action_type: string;
  reason?: string;
  performed_at: string;
  performed_by_email?: string;
}

export default function AdminLinkModeration() {
  const [links, setLinks] = useState<LinkModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<LinkModerationItem | null>(null);
  const [securityHistory, setSecurityHistory] = useState<SecurityCheck[]>([]);
  const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    blocked: 'all'
  });
  const [actionModal, setActionModal] = useState<{
    show: boolean;
    type: 'approve' | 'block' | 'recheck' | 'restore' | null;
    linkId: string | null;
  }>({ show: false, type: null, linkId: null });
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLinks();
  }, [filters]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profile_links')
        .select(`
          id,
          url,
          title,
          security_status,
          is_blocked,
          block_reason,
          last_security_check,
          security_check_count,
          profile_id,
          created_at,
          user_profiles!inner(
            user_id,
            slug,
            customers!inner(email, name)
          )
        `)
        .order('last_security_check', { ascending: false, nullsFirst: true });

      if (filters.status !== 'all') {
        query = query.eq('security_status', filters.status);
      }

      if (filters.blocked !== 'all') {
        query = query.eq('is_blocked', filters.blocked === 'blocked');
      }

      if (filters.search) {
        query = query.or(`url.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        url: item.url,
        title: item.title,
        security_status: item.security_status,
        is_blocked: item.is_blocked,
        block_reason: item.block_reason,
        last_security_check: item.last_security_check,
        security_check_count: item.security_check_count,
        profile_id: item.profile_id,
        user_email: item.user_profiles?.customers?.email,
        user_name: item.user_profiles?.customers?.name,
        domain: item.user_profiles?.slug,
        created_at: item.created_at
      }));

      setLinks(mapped);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinkDetails = async (linkId: string) => {
    try {
      const { data: checks, error: checksError } = await supabase
        .from('link_security_checks')
        .select('*')
        .eq('link_id', linkId)
        .order('checked_at', { ascending: false });

      if (checksError) throw checksError;
      setSecurityHistory(checks || []);

      const { data: actions, error: actionsError } = await supabase
        .from('link_moderation_actions')
        .select(`
          *,
          customers!inner(email)
        `)
        .eq('link_id', linkId)
        .order('performed_at', { ascending: false });

      if (actionsError) throw actionsError;

      const mapped = (actions || []).map((action: any) => ({
        ...action,
        performed_by_email: action.customers?.email
      }));

      setModerationHistory(mapped);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleViewDetails = (link: LinkModerationItem) => {
    setSelectedLink(link);
    loadLinkDetails(link.id);
  };

  const handleAction = (type: 'approve' | 'block' | 'recheck' | 'restore', linkId: string) => {
    setActionModal({ show: true, type, linkId });
    setActionReason('');
  };

  const executeAction = async () => {
    if (!actionModal.linkId || !actionModal.type) return;

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (actionModal.type === 'recheck') {
        const link = links.find(l => l.id === actionModal.linkId);
        if (!link) throw new Error('Link não encontrado');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/verify-link-security`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkId: actionModal.linkId,
            url: link.url,
            checkType: 'manual'
          })
        });

        if (!response.ok) throw new Error('Falha ao reverificar link');

        await supabase.from('link_moderation_actions').insert({
          link_id: actionModal.linkId,
          action_type: 'recheck',
          reason: actionReason || 'Reverificação manual solicitada',
          performed_by: user.id
        });

      } else {
        let newStatus: 'safe' | 'malicious' | 'under_review' | null = null;
        let isBlocked = false;

        switch (actionModal.type) {
          case 'approve':
            newStatus = 'safe';
            isBlocked = false;
            break;
          case 'block':
            newStatus = 'malicious';
            isBlocked = true;
            break;
          case 'restore':
            newStatus = 'safe';
            isBlocked = false;
            break;
        }

        if (newStatus) {
          const updates: any = {
            security_status: newStatus,
            is_blocked: isBlocked
          };

          if (isBlocked && actionReason) {
            updates.block_reason = actionReason;
          } else if (!isBlocked) {
            updates.block_reason = null;
          }

          await supabase
            .from('profile_links')
            .update(updates)
            .eq('id', actionModal.linkId);

          await supabase.from('link_moderation_actions').insert({
            link_id: actionModal.linkId,
            action_type: actionModal.type === 'approve' ? 'force_safe' : actionModal.type,
            reason: actionReason || `Ação executada por administrador`,
            performed_by: user.id
          });
        }
      }

      setActionModal({ show: false, type: null, linkId: null });
      setActionReason('');
      await loadLinks();
      if (selectedLink?.id === actionModal.linkId) {
        loadLinkDetails(actionModal.linkId);
      }

    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRecheck = async () => {
    if (selectedLinks.size === 0) return;

    setIsProcessing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      for (const linkId of Array.from(selectedLinks)) {
        const link = links.find(l => l.id === linkId);
        if (!link) continue;

        await fetch(`${supabaseUrl}/functions/v1/verify-link-security`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkId,
            url: link.url,
            checkType: 'manual'
          })
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSelectedLinks(new Set());
      await loadLinks();
      alert(`${selectedLinks.size} links reverificados com sucesso!`);
    } catch (error) {
      console.error('Erro ao reverificar em lote:', error);
      alert('Erro ao reverificar links. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['URL', 'Título', 'Status', 'Bloqueado', 'Usuário', 'Email', 'Domínio', 'Verificações', 'Última Verificação'];
    const rows = links.map(link => [
      link.url,
      link.title,
      link.security_status,
      link.is_blocked ? 'Sim' : 'Não',
      link.user_name || '',
      link.user_email || '',
      link.domain || '',
      link.security_check_count,
      link.last_security_check || 'Nunca'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `moderacao-links-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const stats = {
    total: links.length,
    safe: links.filter(l => l.security_status === 'safe').length,
    suspicious: links.filter(l => l.security_status === 'suspicious').length,
    malicious: links.filter(l => l.security_status === 'malicious').length,
    pending: links.filter(l => l.security_status === 'pending').length,
    blocked: links.filter(l => l.is_blocked).length
  };

  return (
    <PanelLayout>
      <AdminPageHeader
        title="Moderação de Links"
        description="Sistema de verificação e moderação de segurança de links"
        icon={Shield}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600">Total de Links</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-sm text-emerald-600">Seguros</div>
          <div className="text-2xl font-bold text-emerald-900">{stats.safe}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-sm text-amber-600">Suspeitos</div>
          <div className="text-2xl font-bold text-amber-900">{stats.suspicious}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Maliciosos</div>
          <div className="text-2xl font-bold text-red-900">{stats.malicious}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-slate-600">Pendentes</div>
          <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Bloqueados</div>
          <div className="text-2xl font-bold text-red-900">{stats.blocked}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por URL ou título..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendentes</option>
            <option value="safe">Seguros</option>
            <option value="suspicious">Suspeitos</option>
            <option value="malicious">Maliciosos</option>
            <option value="under_review">Em revisão</option>
          </select>
          <select
            value={filters.blocked}
            onChange={(e) => setFilters({ ...filters, blocked: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="blocked">Apenas bloqueados</option>
            <option value="active">Apenas ativos</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={loadLinks}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedLinks.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedLinks.size} link(s) selecionado(s)
            </span>
            <button
              onClick={handleBulkRecheck}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Reverificar selecionados
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-600">Carregando...</div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-slate-600">Nenhum link encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLinks.size === links.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLinks(new Set(links.map(l => l.id)));
                        } else {
                          setSelectedLinks(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Link</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Verificações</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedLinks.has(link.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedLinks);
                          if (e.target.checked) {
                            newSet.add(link.id);
                          } else {
                            newSet.delete(link.id);
                          }
                          setSelectedLinks(newSet);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <LinkSecurityStatus
                        linkId={link.id}
                        status={link.security_status}
                        isBlocked={link.is_blocked}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-md">
                        <div className="font-medium text-slate-900 truncate">{link.title}</div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
                        >
                          {link.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {link.block_reason && (
                          <div className="text-xs text-red-600 mt-1">{link.block_reason}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">{link.user_name || 'Sem nome'}</div>
                        <div className="text-slate-600">{link.user_email}</div>
                        <div className="text-slate-500">{link.domain}.com.rich</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div>{link.security_check_count}x</div>
                      <div className="text-xs text-slate-500">
                        {link.last_security_check
                          ? new Date(link.last_security_check).toLocaleDateString()
                          : 'Nunca'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(link)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction('recheck', link.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Reverificar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {link.is_blocked ? (
                          <button
                            onClick={() => handleAction('restore', link.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Restaurar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAction('approve', link.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Aprovar como seguro"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction('block', link.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Bloquear"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedLink.title}</h3>
                  <a
                    href={selectedLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {selectedLink.url}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <div className="mt-3">
                    <LinkSecurityStatus
                      linkId={selectedLink.id}
                      status={selectedLink.security_status}
                      isBlocked={selectedLink.is_blocked}
                      blockReason={selectedLink.block_reason}
                      showDetails
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLink(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <span className="text-2xl text-slate-400">×</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-3">Informações do Usuário</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Nome:</span>
                    <span className="ml-2 font-medium">{selectedLink.user_name || 'Sem nome'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedLink.user_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Domínio:</span>
                    <span className="ml-2 font-medium">{selectedLink.domain}.com.rich</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Verificações:</span>
                    <span className="ml-2 font-medium">{selectedLink.security_check_count}x</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Histórico de Verificações ({securityHistory.length})
                </h4>
                {securityHistory.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma verificação realizada</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {securityHistory.map((check) => (
                      <div key={check.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">
                            {new Date(check.checked_at).toLocaleString()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            check.status === 'safe' ? 'bg-emerald-100 text-emerald-700' :
                            check.status === 'malicious' ? 'bg-red-100 text-red-700' :
                            check.status === 'suspicious' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {check.status}
                          </span>
                        </div>
                        <div className="text-slate-600 space-y-1">
                          <div>Tipo: {check.check_type}</div>
                          <div>Provider: {check.provider}</div>
                          {check.threat_types.length > 0 && (
                            <div className="text-red-600">
                              Ameaças: {check.threat_types.join(', ')}
                            </div>
                          )}
                          {check.notes && (
                            <div className="mt-2 p-2 bg-slate-50 rounded">{check.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Histórico de Moderação ({moderationHistory.length})
                </h4>
                {moderationHistory.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma ação de moderação registrada</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {moderationHistory.map((action) => (
                      <div key={action.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">
                            {new Date(action.performed_at).toLocaleString()}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {action.action_type}
                          </span>
                        </div>
                        <div className="text-slate-600 space-y-1">
                          <div>Por: {action.performed_by_email || 'Sistema'}</div>
                          {action.reason && (
                            <div className="mt-2 p-2 bg-slate-50 rounded">{action.reason}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {actionModal.type === 'recheck' && 'Reverificar Link'}
              {actionModal.type === 'approve' && 'Aprovar Link como Seguro'}
              {actionModal.type === 'block' && 'Bloquear Link'}
              {actionModal.type === 'restore' && 'Restaurar Link'}
            </h3>

            {(actionModal.type === 'block' || actionModal.type === 'approve' || actionModal.type === 'restore') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {actionModal.type === 'block' ? 'Motivo do bloqueio (obrigatório)' : 'Justificativa (opcional)'}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    actionModal.type === 'block'
                      ? 'Ex: Phishing detectado, site de malware, etc.'
                      : 'Ex: Verificação manual confirmou segurança'
                  }
                />
              </div>
            )}

            {actionModal.type === 'recheck' && (
              <p className="text-sm text-slate-600 mb-4">
                Uma nova verificação de segurança será executada imediatamente para este link.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setActionModal({ show: false, type: null, linkId: null })}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                onClick={executeAction}
                disabled={isProcessing || (actionModal.type === 'block' && !actionReason)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
