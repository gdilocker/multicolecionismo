import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Globe,
  Mail,
  Settings,
  Calendar,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Server,
  CreditCard,
  Send
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DNSRecordModal from '../components/DNSRecordModal';
import DomainTransferModal from '../components/DomainTransferModal';

interface DNSRecord {
  id: string;
  domain_id: string;
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  is_system: boolean;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

interface Domain {
  id: string;
  fqdn: string;
  registrar_status: string;
  expires_at: string;
  nameserver_mode: string;
  custom_nameservers: string[] | null;
  created_at: string;
}


type TabType = 'overview' | 'dns' | 'settings';

const DomainDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [domain, setDomain] = useState<Domain | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [nameserverMode, setNameserverMode] = useState<'managed' | 'external'>('managed');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    loadDomainDetails();
  }, [id, user]);

  const loadDomainDetails = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (domainError || !domainData) {
        navigate('/panel/domains');
        return;
      }

      setDomain(domainData);
      setNameserverMode((domainData.nameserver_mode || 'managed') as 'managed' | 'external');

      await loadDNSRecords(id);
    } catch (error) {
      console.error('Failed to load domain details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDNSRecords = async (domainId: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dns`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${apiUrl}?domain_id=${domainId}`, { headers });
      const data = await response.json();

      if (data.records) {
        setDnsRecords(data.records);
      }
    } catch (error) {
      console.error('Error fetching DNS records:', error);
    }
  };


  const handleAddRecord = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: DNSRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (recordData: Partial<DNSRecord>) => {
    if (!domain) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dns`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      if (editingRecord) {
        await fetch(`${apiUrl}/${editingRecord.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(recordData),
        });
      } else {
        await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...recordData,
            domain_id: domain.id,
          }),
        });
      }

      await loadDNSRecords(domain.id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving DNS record:', error);
      throw error;
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!domain || !confirm('Tem certeza que deseja deletar este registro DNS?')) return;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dns`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      await fetch(`${apiUrl}/${recordId}`, {
        method: 'DELETE',
        headers,
      });

      await loadDNSRecords(domain.id);
    } catch (error) {
      console.error('Error deleting DNS record:', error);
    }
  };

  const handleCopyRecord = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedRecord(id);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const handleNameserverModeChange = async (mode: 'managed' | 'external') => {
    if (!domain) return;

    try {
      const { error } = await supabase
        .from('domains')
        .update({ nameserver_mode: mode })
        .eq('id', domain.id);

      if (!error) {
        setNameserverMode(mode);
        setDomain({ ...domain, nameserver_mode: mode });
      }
    } catch (error) {
      console.error('Error updating nameserver mode:', error);
    }
  };

  const systemRecords = dnsRecords.filter(r => r.is_system);
  const customRecords = dnsRecords.filter(r => !r.is_system);
  const daysUntilExpiry = domain ? Math.ceil((new Date(domain.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Globe },
    { id: 'dns', label: 'DNS', icon: Server },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  if (!domain) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Domínio não encontrado</h3>
            <p className="text-slate-600 mb-4">Este domínio não existe ou você não tem permissão para acessá-lo</p>
            <button
              onClick={() => navigate('/panel/domains')}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
            >
              Voltar para Meus Domínios
            </button>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/panel/domains')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Voltar para Meus Domínios</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{domain.fqdn}</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {domain.registrar_status === 'active' ? 'Ativo' : domain.registrar_status}
                </span>
                <span className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  Expira em {daysUntilExpiry} dias ({new Date(domain.expires_at).toLocaleDateString('pt-BR')})
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadDomainDetails}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </motion.button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
          <div className="border-b border-slate-200">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'text-slate-900 border-b-2 border-slate-600 bg-slate-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-8 h-8 text-slate-900" />
                      <h3 className="text-lg font-bold text-slate-800">Caixas de E-mail</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{mailboxes.length}</p>
                    <p className="text-sm text-slate-600 mt-1">Total de caixas ativas</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Server className="w-8 h-8 text-emerald-600" />
                      <h3 className="text-lg font-bold text-slate-800">Registros DNS</h3>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">{dnsRecords.length}</p>
                    <p className="text-sm text-slate-600 mt-1">Total de registros</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-8 h-8 text-amber-600" />
                      <h3 className="text-lg font-bold text-slate-800">Renovação</h3>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{daysUntilExpiry}</p>
                    <p className="text-sm text-slate-600 mt-1">Dias até expirar</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Ações Rápidas</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('mailboxes')}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-500 hover:shadow-lg transition-all text-left"
                    >
                      <Mail className="w-6 h-6 text-slate-900 mb-2" />
                      <h4 className="font-semibold text-slate-800">Gerenciar E-mails</h4>
                      <p className="text-sm text-slate-600 mt-1">Criar e gerenciar caixas de e-mail</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('dns')}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-500 hover:shadow-lg transition-all text-left"
                    >
                      <Server className="w-6 h-6 text-emerald-600 mb-2" />
                      <h4 className="font-semibold text-slate-800">Configurar DNS</h4>
                      <p className="text-sm text-slate-600 mt-1">Adicionar e editar registros DNS</p>
                    </button>

                    <button
                      onClick={() => navigate('/panel/billing')}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-500 hover:shadow-lg transition-all text-left"
                    >
                      <CreditCard className="w-6 h-6 text-slate-600 mb-2" />
                      <h4 className="font-semibold text-slate-800">Renovar Domínio</h4>
                      <p className="text-sm text-slate-600 mt-1">Renovar ou configurar renovação automática</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-500 hover:shadow-lg transition-all text-left"
                    >
                      <Settings className="w-6 h-6 text-slate-600 mb-2" />
                      <h4 className="font-semibold text-slate-800">Configurações</h4>
                      <p className="text-sm text-slate-600 mt-1">Gerenciar configurações do domínio</p>
                    </button>

                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="p-4 bg-white border border-slate-200 rounded-lg hover:border-amber-300 hover:shadow-lg transition-all text-left"
                    >
                      <Send className="w-6 h-6 text-amber-600 mb-2" />
                      <h4 className="font-semibold text-slate-800">Transferir Domínio</h4>
                      <p className="text-sm text-slate-600 mt-1">Transferir para outro titular</p>
                    </button>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'dns' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Modo de Gerenciamento DNS</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleNameserverModeChange('managed')}
                      className={`p-6 border-2 rounded-xl text-left transition-all ${
                        nameserverMode === 'managed'
                          ? 'border-slate-500 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          nameserverMode === 'managed' ? 'border-slate-500' : 'border-slate-300'
                        }`}>
                          {nameserverMode === 'managed' && (
                            <div className="w-2 h-2 bg-slate-500 rounded-full" />
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800">Hospedado Conosco</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                        Gerenciamos o DNS do seu domínio. Você pode adicionar e editar registros aqui.
                      </p>
                    </button>

                    <button
                      onClick={() => handleNameserverModeChange('external')}
                      className={`p-6 border-2 rounded-xl text-left transition-all ${
                        nameserverMode === 'external'
                          ? 'border-slate-500 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          nameserverMode === 'external' ? 'border-slate-500' : 'border-slate-300'
                        }`}>
                          {nameserverMode === 'external' && (
                            <div className="w-2 h-2 bg-slate-500 rounded-full" />
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800">Nameservers Externos</h3>
                      </div>
                      <p className="text-sm text-slate-600">
                        Use Cloudflare ou outro provedor. Configure os registros lá.
                      </p>
                    </button>
                  </div>
                </div>

                {nameserverMode === 'managed' ? (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Registros do Sistema</h3>
                      </div>
                      {systemRecords.length === 0 ? (
                        <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                          <p className="text-slate-600">Nenhum registro de sistema configurado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {systemRecords.map((record) => (
                            <div key={record.id} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                  <span className="font-bold text-slate-800">{record.type}</span>
                                  <span className="text-sm text-slate-600">{record.name}</span>
                                </div>
                                <button
                                  onClick={() => handleCopyRecord(record.value, record.id)}
                                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                                >
                                  <Copy className={`w-4 h-4 ${
                                    copiedRecord === record.id ? 'text-emerald-600' : 'text-slate-400'
                                  }`} />
                                </button>
                              </div>
                              <code className="text-xs text-slate-700 font-mono break-all block">
                                {record.value}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Registros Personalizados</h3>
                        <button
                          onClick={handleAddRecord}
                          className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Adicionar
                        </button>
                      </div>
                      {customRecords.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                          <Server className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-600">Nenhum registro personalizado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {customRecords.map((record) => (
                            <div key={record.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-lg transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Globe className="w-5 h-5 text-slate-900" />
                                  <span className="font-bold text-slate-800">{record.type}</span>
                                  <span className="text-sm text-slate-600">{record.name}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditRecord(record)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4 text-slate-400" />
                                  </button>
                                  {record.is_editable && (
                                    <button
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCopyRecord(record.value, record.id)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <Copy className={`w-4 h-4 ${
                                      copiedRecord === record.id ? 'text-emerald-500' : 'text-slate-400'
                                    }`} />
                                  </button>
                                </div>
                              </div>
                              <code className="text-xs text-slate-700 font-mono break-all block">
                                {record.value}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-amber-600 mb-3" />
                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                      Domínio usando nameservers externos
                    </h3>
                    <p className="text-amber-700">
                      Configure os registros DNS diretamente no seu provedor (Cloudflare, etc).
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-slate-200 rounded-xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Informações do Domínio</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600">FQDN</label>
                      <p className="text-slate-800 font-mono">{domain.fqdn}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Status</label>
                      <p className="text-slate-800">{domain.registrar_status}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Data de Criação</label>
                      <p className="text-slate-800">{new Date(domain.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Data de Expiração</label>
                      <p className="text-slate-800">{new Date(domain.expires_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                  <h3 className="text-lg font-bold text-red-900 mb-2">Zona de Perigo</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Ações irreversíveis que afetam permanentemente este domínio.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
                    Transferir Domínio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DNSRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        record={editingRecord}
        mode={editingRecord ? 'edit' : 'add'}
      />

      {domain && (
        <DomainTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          domain={{
            id: domain.id,
            fqdn: domain.fqdn
          }}
          onTransferInitiated={() => {
            setIsTransferModalOpen(false);
            loadDomainDetails();
          }}
        />
      )}
    </PanelLayout>
  );
};

export default DomainDetails;
