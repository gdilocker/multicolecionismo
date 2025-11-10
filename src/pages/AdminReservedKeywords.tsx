import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Loader2, AlertTriangle, CheckCircle, Lock, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface ReservedKeyword {
  id: string;
  keyword: string;
  reason: string;
  category: 'brand' | 'legal' | 'trademark' | 'generic' | 'sensitive';
  severity: 'critical' | 'high' | 'medium';
  allow_with_suffix: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'brand', label: '🏢 Marca', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { value: 'legal', label: '⚖️ Legal/Sistema', color: 'bg-slate-100 text-slate-900 border-slate-300' },
  { value: 'trademark', label: '™️ Marca Registrada', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'generic', label: '📦 Genérico', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'sensitive', label: '🚫 Sensível', color: 'bg-red-100 text-red-700 border-red-300' }
];

const SEVERITIES = [
  { value: 'critical', label: 'Crítica', color: 'bg-red-500', icon: AlertTriangle },
  { value: 'high', label: 'Alta', color: 'bg-orange-500', icon: Shield },
  { value: 'medium', label: 'Média', color: 'bg-yellow-500', icon: Tag }
];

export default function AdminReservedKeywords() {
  useScrollToTop();
  const [keywords, setKeywords] = useState<ReservedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testKeyword, setTestKeyword] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    keyword: '',
    reason: '',
    category: 'brand' as const,
    severity: 'high' as const,
    allow_with_suffix: false
  });

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reserved_keywords')
        .select('*')
        .order('severity', { ascending: true })
        .order('category', { ascending: true })
        .order('keyword', { ascending: true });

      if (error) throw error;
      setKeywords(data || []);
    } catch (error) {
      console.error('Error fetching keywords:', error);
      alert('Erro ao carregar palavras reservadas');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const { error } = await supabase
        .from('reserved_keywords')
        .insert([{
          keyword: formData.keyword.toLowerCase().trim(),
          reason: formData.reason.trim(),
          category: formData.category,
          severity: formData.severity,
          allow_with_suffix: formData.allow_with_suffix
        }]);

      if (error) throw error;

      alert('Palavra reservada adicionada com sucesso!');
      setFormData({
        keyword: '',
        reason: '',
        category: 'brand',
        severity: 'high',
        allow_with_suffix: false
      });
      setShowAddForm(false);
      fetchKeywords();
    } catch (error: any) {
      console.error('Error adding keyword:', error);
      alert(error.message || 'Erro ao adicionar palavra reservada');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, keyword: string) => {
    if (!confirm(`Tem certeza que deseja remover "${keyword}" da lista de palavras reservadas?`)) return;

    try {
      const { error } = await supabase
        .from('reserved_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Palavra reservada removida com sucesso!');
      fetchKeywords();
    } catch (error) {
      console.error('Error deleting keyword:', error);
      alert('Erro ao remover palavra reservada');
    }
  };

  const handleTest = async () => {
    if (!testKeyword.trim()) return;

    try {
      const { data, error } = await supabase
        .rpc('check_reserved_keyword', { domain_text: testKeyword });

      if (error) throw error;
      setTestResult(data[0] || { is_reserved: false });
    } catch (error) {
      console.error('Error testing keyword:', error);
      alert('Erro ao testar palavra-chave');
    }
  };

  const stats = {
    total: keywords.length,
    critical: keywords.filter(k => k.severity === 'critical').length,
    high: keywords.filter(k => k.severity === 'high').length,
    medium: keywords.filter(k => k.severity === 'medium').length,
    byCategory: CATEGORIES.map(cat => ({
      ...cat,
      count: keywords.filter(k => k.category === cat.value).length
    }))
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Palavras Reservadas"
            description="Gerenciar palavras que não podem ser usadas em domínios premium"
            onRefresh={fetchKeywords}
            refreshing={loading}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Protegidas</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Críticas</p>
              <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Alta Prioridade</p>
              <p className="text-3xl font-bold text-orange-600">{stats.high}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Média Prioridade</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.medium}</p>
            </div>
          </div>

          {/* Test Tool */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-slate-900" />
              <h3 className="text-lg font-bold text-gray-800">Testar Domínio</h3>
            </div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={testKeyword}
                onChange={(e) => setTestKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                placeholder="Digite um domínio para testar (ex: premium.com.rich)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleTest}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
              >
                Testar
              </button>
            </div>
            {testResult && (
              <div className={`p-4 rounded-lg border-2 ${
                testResult.is_reserved
                  ? 'bg-red-50 border-red-300'
                  : 'bg-green-50 border-green-300'
              }`}>
                {testResult.is_reserved ? (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-red-800 mb-1">❌ DOMÍNIO BLOQUEADO</p>
                      <p className="text-sm text-red-700 mb-2">
                        Contém palavra reservada: <span className="font-bold">"{testResult.keyword}"</span>
                      </p>
                      <p className="text-sm text-red-600 mb-1">
                        <strong>Motivo:</strong> {testResult.reason}
                      </p>
                      <p className="text-sm text-red-600">
                        <strong>Gravidade:</strong> {testResult.severity === 'critical' ? 'Crítica' : testResult.severity === 'high' ? 'Alta' : 'Média'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <p className="font-bold text-green-800">✅ Domínio permitido - não contém palavras reservadas</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Palavra Reservada
            </button>
          </div>

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-red-200"
              >
                <h3 className="text-lg font-bold text-black mb-4">
                  Adicionar Nova Palavra Reservada
                </h3>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Palavra-Chave *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.keyword}
                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        placeholder="premium"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gravidade *
                      </label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        {SEVERITIES.map(sev => (
                          <option key={sev.value} value={sev.value}>{sev.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allow_with_suffix}
                          onChange={(e) => setFormData({ ...formData, allow_with_suffix: e.target.checked })}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Permitir com sufixo</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo da Reserva *
                    </label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Ex: Marca registrada da empresa"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keywords by Category */}
          {CATEGORIES.map(category => {
            const categoryKeywords = keywords.filter(k => k.category === category.value);
            if (categoryKeywords.length === 0) return null;

            return (
              <div key={category.value} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden mb-6">
                <div className={`px-6 py-4 border-b-2 ${category.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{category.label}</h3>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-bold">
                      {categoryKeywords.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Palavra</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gravidade</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sufixo OK</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
                          </td>
                        </tr>
                      ) : (
                        categoryKeywords.map((keyword) => {
                          const severity = SEVERITIES.find(s => s.value === keyword.severity);
                          const SeverityIcon = severity?.icon || Tag;

                          return (
                            <tr key={keyword.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Lock className="w-4 h-4 text-red-500" />
                                  <span className="font-bold text-gray-800">{keyword.keyword}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{keyword.reason}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${severity?.color}`}></div>
                                  <span className="text-sm font-medium text-gray-700">{severity?.label}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {keyword.allow_with_suffix ? (
                                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDelete(keyword.id, keyword.keyword)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
