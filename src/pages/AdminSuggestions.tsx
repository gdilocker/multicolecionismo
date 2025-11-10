import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Upload, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface DomainSuggestion {
  id: string;
  domain_name: string;
  category: string;
  price_override: number | null;
  status: 'available' | 'sold' | 'reserved';
  is_premium: boolean;
  popularity_score: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'names', label: 'Nomes' },
  { value: 'business', label: 'Negócios' },
  { value: 'professional', label: 'Profissional' },
  { value: 'tech', label: 'Tecnologia' },
  { value: 'creative', label: 'Criativo' },
  { value: 'general', label: 'Geral' }
];

export default function AdminSuggestions() {
  useScrollToTop();
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Single domain form
  const [formData, setFormData] = useState({
    domain_name: '',
    category: 'general',
    price_override: '',
    is_premium: false,
    popularity_score: 0
  });

  // Bulk import
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('general');
  const [bulkIsPremium, setBulkIsPremium] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('domain_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      alert('Erro ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const { error } = await supabase
        .from('domain_suggestions')
        .insert([{
          domain_name: formData.domain_name.toLowerCase().trim(),
          category: formData.category,
          price_override: formData.price_override ? parseFloat(formData.price_override) : null,
          is_premium: formData.is_premium,
          popularity_score: formData.popularity_score,
          status: 'available'
        }]);

      if (error) throw error;

      alert('Domínio adicionado com sucesso!');
      setFormData({
        domain_name: '',
        category: 'general',
        price_override: '',
        is_premium: false,
        popularity_score: 0
      });
      setShowAddForm(false);
      fetchSuggestions();
    } catch (error: any) {
      console.error('Error adding suggestion:', error);
      alert(error.message || 'Erro ao adicionar domínio');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const domains = bulkText
        .split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0);

      if (domains.length === 0) {
        alert('Nenhum domínio para importar');
        return;
      }

      const suggestions = domains.map(domain => ({
        domain_name: domain,
        category: bulkCategory,
        is_premium: bulkIsPremium,
        status: 'available',
        popularity_score: 0
      }));

      const { error } = await supabase
        .from('domain_suggestions')
        .insert(suggestions);

      if (error) throw error;

      alert(`${domains.length} domínios importados com sucesso!`);
      setBulkText('');
      setShowBulkForm(false);
      fetchSuggestions();
    } catch (error: any) {
      console.error('Error bulk importing:', error);
      alert(error.message || 'Erro ao importar domínios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, domainName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${domainName}.com.rich"?`)) return;

    try {
      const { error } = await supabase
        .from('domain_suggestions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Domínio excluído com sucesso!');
      fetchSuggestions();
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      alert('Erro ao excluir domínio');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('domain_suggestions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      fetchSuggestions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const stats = {
    total: suggestions.length,
    available: suggestions.filter(s => s.status === 'available').length,
    sold: suggestions.filter(s => s.status === 'sold').length,
    premium: suggestions.filter(s => s.is_premium).length
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Gerenciar Sugestões de Domínios"
            description="Adicione e gerencie sugestões de domínios premium"
            onRefresh={fetchSuggestions}
            refreshing={loading}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total</p>
              <p className="text-3xl font-bold text-black">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Disponíveis</p>
              <p className="text-3xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Vendidos</p>
              <p className="text-3xl font-bold text-red-600">{stats.sold}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Premium</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.premium}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowBulkForm(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Individual
            </button>
            <button
              onClick={() => {
                setShowBulkForm(!showBulkForm);
                setShowAddForm(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              <Upload className="w-5 h-5" />
              Importar em Massa
            </button>
          </div>

          {/* Add Single Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200"
              >
                <h3 className="text-lg font-bold text-black mb-4">
                  Adicionar Domínio Individual
                </h3>
                <form onSubmit={handleAddSingle} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Domínio (sem .com.rich)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.domain_name}
                        onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                        placeholder="exemplo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preço Customizado em USD (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price_override}
                        onChange={(e) => setFormData({ ...formData, price_override: e.target.value })}
                        placeholder="15.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score de Popularidade
                      </label>
                      <input
                        type="number"
                        value={formData.popularity_score}
                        onChange={(e) => setFormData({ ...formData, popularity_score: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_premium}
                      onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                      className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                    />
                    <span className="text-sm font-medium text-gray-700">Marcar como Premium</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
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

          {/* Bulk Import Form */}
          <AnimatePresence>
            {showBulkForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200"
              >
                <h3 className="text-lg font-bold text-black mb-4">
                  Importar Domínios em Massa
                </h3>
                <form onSubmit={handleBulkImport} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lista de Domínios (um por linha, sem .com.rich)
                    </label>
                    <textarea
                      required
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="exemplo1&#10;exemplo2&#10;exemplo3"
                      rows={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria para todos
                      </label>
                      <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-6">
                      <input
                        type="checkbox"
                        checked={bulkIsPremium}
                        onChange={(e) => setBulkIsPremium(e.target.checked)}
                        className="w-4 h-4 text-[#3B82F6] rounded focus:ring-[#3B82F6]"
                      />
                      <span className="text-sm font-medium text-gray-700">Marcar todos como Premium</span>
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Importar
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domínio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto" />
                      </td>
                    </tr>
                  ) : suggestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nenhuma sugestão cadastrada
                      </td>
                    </tr>
                  ) : (
                    suggestions.map((suggestion) => (
                      <tr key={suggestion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-black">
                            {suggestion.domain_name}.com.rich
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {CATEGORIES.find(c => c.value === suggestion.category)?.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={suggestion.status}
                            onChange={(e) => handleStatusChange(suggestion.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                          >
                            <option value="available">Disponível</option>
                            <option value="sold">Vendido</option>
                            <option value="reserved">Reservado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {suggestion.is_premium ? (
                            <Check className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {suggestion.popularity_score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(suggestion.id, suggestion.domain_name)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
