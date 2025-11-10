import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  CheckCircle,
  AlertCircle,
  XCircle,
  Copy,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Server,
  Info
} from 'lucide-react';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DNSRecordModal from '../components/DNSRecordModal';

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
  nameserver_mode: string;
  custom_nameservers: string[] | null;
}

const DNSManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nameserverMode, setNameserverMode] = useState<'managed' | 'external'>('managed');

  useEffect(() => {
    if (user?.id) {
      fetchDomains();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedDomain) {
      fetchDNSRecords(selectedDomain.id);
      setNameserverMode((selectedDomain.nameserver_mode || 'managed') as 'managed' | 'external');
    }
  }, [selectedDomain]);

  const fetchDomains = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerData) {
        const { data: domainsData } = await supabase
          .from('domains')
          .select('*')
          .eq('customer_id', customerData.id)
          .eq('registrar_status', 'active')
          .order('created_at', { ascending: false });

        setDomains(domainsData || []);
        if (domainsData && domainsData.length > 0) {
          setSelectedDomain(domainsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDNSRecords = async (domainId: string) => {
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
    if (!selectedDomain) return;

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
            domain_id: selectedDomain.id,
          }),
        });
      }

      await fetchDNSRecords(selectedDomain.id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving DNS record:', error);
      throw error;
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedDomain || !confirm('Tem certeza que deseja deletar este registro DNS?')) return;

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

      await fetchDNSRecords(selectedDomain.id);
    } catch (error) {
      console.error('Error deleting DNS record:', error);
    }
  };

  const handleCopyRecord = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedRecord(id);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const handleVerifyDNS = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVerifying(false);
  };

  const handleNameserverModeChange = async (mode: 'managed' | 'external') => {
    if (!selectedDomain) return;

    try {
      const { error } = await supabase
        .from('domains')
        .update({ nameserver_mode: mode })
        .eq('id', selectedDomain.id);

      if (!error) {
        setNameserverMode(mode);
        setSelectedDomain({ ...selectedDomain, nameserver_mode: mode });
      }
    } catch (error) {
      console.error('Error updating nameserver mode:', error);
    }
  };

  const getRecordStatusIcon = (record: DNSRecord) => {
    if (record.is_system) {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
    return <Globe className="w-5 h-5 text-slate-900" />;
  };

  const systemRecords = dnsRecords.filter(r => r.is_system);
  const customRecords = dnsRecords.filter(r => !r.is_system);
  const allSystemRecordsOk = systemRecords.length >= 3;

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

  if (domains.length === 0) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhum domínio ativo</h3>
            <p className="text-slate-600">Registre um domínio para gerenciar DNS</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="DNS & Autenticações"
          subtitle={
            <select
              value={selectedDomain?.id || ''}
              onChange={(e) => {
                const domain = domains.find(d => d.id === e.target.value);
                setSelectedDomain(domain || null);
              }}
              className="mt-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  {domain.fqdn}
                </option>
              ))}
            </select>
          }
          primaryAction={
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVerifyDNS}
              disabled={isVerifying}
              className="btn-fluid inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verificando...' : 'Verificar DNS'}
            </motion.button>
          }
        />

        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-800">Modo de Gerenciamento DNS</h2>
          </div>

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
                Gerenciamos o DNS do seu domínio. Você pode adicionar e editar registros neste painel.
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
                Use Cloudflare ou outro provedor. Você deve configurar os registros manualmente lá.
              </p>
            </button>
          </div>
        </div>

        {nameserverMode === 'managed' ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-6 rounded-2xl border ${
                allSystemRecordsOk
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  allSystemRecordsOk ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {allSystemRecordsOk ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    allSystemRecordsOk ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {allSystemRecordsOk
                      ? 'Registros DNS configurados corretamente!'
                      : 'Configure os registros DNS de email'}
                  </h3>
                  <p className={`text-sm ${
                    allSystemRecordsOk ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {allSystemRecordsOk
                      ? 'Seu domínio está pronto para enviar e receber emails.'
                      : 'Adicione os registros MX, SPF, DKIM e DMARC para o email funcionar.'}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Registros DNS do Sistema</h2>
            </div>

            <div className="space-y-4 mb-8">
              {systemRecords.length === 0 ? (
                <div className="p-8 text-center bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhum registro de sistema configurado</p>
                  <p className="text-sm text-slate-500 mt-1">Os registros MX, SPF, DKIM e DMARC devem ser configurados automaticamente</p>
                </div>
              ) : (
                systemRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {getRecordStatusIcon(record)}
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-slate-800">{record.type}</h3>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg">
                              Configurado
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{record.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <code className="text-sm text-slate-700 font-mono break-all">
                            {record.value}
                          </code>
                          {record.priority && (
                            <p className="text-xs text-slate-500 mt-2">Prioridade: {record.priority}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyRecord(record.value, record.id)}
                          className="p-2 hover:bg-white rounded-lg transition-all flex-shrink-0"
                        >
                          <Copy className={`w-4 h-4 ${
                            copiedRecord === record.id ? 'text-emerald-500' : 'text-slate-400'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Registros Personalizados</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddRecord}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Adicionar Registro
              </motion.button>
            </div>

            <div className="space-y-4">
              {customRecords.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Nenhum registro personalizado</p>
                  <p className="text-sm text-slate-500 mt-1">Adicione registros A, CNAME, TXT, etc.</p>
                </div>
              ) : (
                customRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {getRecordStatusIcon(record)}
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{record.type}</h3>
                          <p className="text-sm text-slate-500 mt-1">{record.name}</p>
                        </div>
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
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <code className="text-sm text-slate-700 font-mono break-all">
                            {record.value}
                          </code>
                          <p className="text-xs text-slate-500 mt-2">TTL: {record.ttl}s</p>
                        </div>
                        <button
                          onClick={() => handleCopyRecord(record.value, record.id)}
                          className="p-2 hover:bg-white rounded-lg transition-all flex-shrink-0"
                        >
                          <Copy className={`w-4 h-4 ${
                            copiedRecord === record.id ? 'text-emerald-500' : 'text-slate-400'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Domínio usando nameservers externos
                </h3>
                <p className="text-amber-700 mb-4">
                  Seu domínio está configurado para usar nameservers externos (como Cloudflare).
                  Você deve configurar os registros DNS diretamente no seu provedor.
                </p>
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-6">
              <h4 className="font-bold text-slate-800 mb-4">Registros necessários para email funcionar:</h4>
              <div className="space-y-4">
                {systemRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-800">{record.type}</span>
                      <button
                        onClick={() => handleCopyRecord(record.value, record.id)}
                        className="px-3 py-1 text-sm bg-slate-500 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        {copiedRecord === record.id ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Nome: {record.name}</p>
                    <code className="text-xs text-slate-700 font-mono break-all block">
                      {record.value}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <DNSRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        record={editingRecord}
        mode={editingRecord ? 'edit' : 'add'}
      />
    </PanelLayout>
  );
};

export default DNSManagement;
