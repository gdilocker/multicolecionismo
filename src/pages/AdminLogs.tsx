import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  diff_json: any;
  created_at: string;
  actor_email?: string;
}

const ACTION_ICONS = {
  create: CheckCircle,
  update: Info,
  delete: XCircle,
  login: User,
  logout: User,
  default: Activity
};

const ACTION_COLORS = {
  create: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
  update: { bg: 'bg-slate-50', text: 'text-slate-900', icon: 'text-slate-900' },
  delete: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
  login: { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600' },
  logout: { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-600' },
  default: { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600' }
};

export default function AdminLogs() {
  useScrollToTop();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      const enrichedLogs = await Promise.all(
        (logsData || []).map(async (log) => {
          if (log.actor_id) {
            const { data: userData } = await supabase
              .from('customers')
              .select('email')
              .eq('user_id', log.actor_id)
              .single();

            return {
              ...log,
              actor_email: userData?.email || 'Sistema'
            };
          }
          return {
            ...log,
            actor_email: 'Sistema'
          };
        })
      );

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return ACTION_COLORS.create;
    if (actionLower.includes('update')) return ACTION_COLORS.update;
    if (actionLower.includes('delete')) return ACTION_COLORS.delete;
    if (actionLower.includes('login')) return ACTION_COLORS.login;
    if (actionLower.includes('logout')) return ACTION_COLORS.logout;
    return ACTION_COLORS.default;
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return ACTION_ICONS.create;
    if (actionLower.includes('update')) return ACTION_ICONS.update;
    if (actionLower.includes('delete')) return ACTION_ICONS.delete;
    if (actionLower.includes('login') || actionLower.includes('logout')) return ACTION_ICONS.login;
    return ACTION_ICONS.default;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesType = filterType === 'all' || log.target_type === filterType;

    return matchesSearch && matchesAction && matchesType;
  });

  const uniqueTypes = Array.from(new Set(logs.map(log => log.target_type)));
  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const today = new Date();
      const logDate = new Date(log.created_at);
      return logDate.toDateString() === today.toDateString();
    }).length,
    creates: logs.filter(log => log.action.toLowerCase().includes('create')).length,
    updates: logs.filter(log => log.action.toLowerCase().includes('update')).length
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Logs e Auditoria"
            description="Acompanhe todas as ações realizadas no sistema"
            onRefresh={fetchLogs}
            refreshing={loading}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total de Logs</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Hoje</p>
              <p className="text-3xl font-bold text-black">{stats.today}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Criações</p>
              <p className="text-3xl font-bold text-green-600">{stats.creates}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Atualizações</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.updates}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar em logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="all">Todas as Ações</option>
                  <option value="create">Criações</option>
                  <option value="update">Atualizações</option>
                  <option value="delete">Exclusões</option>
                  <option value="login">Login</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                >
                  <option value="all">Todos os Tipos</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum log encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const colors = getActionColor(log.action);
                  const Icon = getActionIcon(log.action);

                  return (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-black">
                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Tipo: <span className="font-medium">{log.target_type}</span>
                                {log.target_id && (
                                  <span className="ml-2">ID: {log.target_id.slice(0, 8)}...</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Por: {log.actor_email || 'Sistema'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {new Date(log.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          {log.diff_json && Object.keys(log.diff_json).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                              <p className="text-xs text-gray-600 font-mono">
                                {JSON.stringify(log.diff_json, null, 2).slice(0, 200)}
                                {JSON.stringify(log.diff_json).length > 200 && '...'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
