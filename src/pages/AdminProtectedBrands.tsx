import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Plus, Edit2, Trash2, Save, X, Crown, CheckCircle, XCircle } from 'lucide-react';
import { AdminPageHeader } from '../components/AdminPageHeader';
import PageLayout from '../components/PageLayout';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface ProtectedBrand {
  id: string;
  domain_name: string;
  brand_display_name: string;
  description: string | null;
  access_password: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminProtectedBrands() {
  useScrollToTop();
  const [brands, setBrands] = useState<ProtectedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    domain_name: '',
    brand_display_name: '',
    description: '',
    access_password: 'Leif1975..',
    is_active: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('protected_brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
      showMessage('error', 'Erro ao carregar marcas protegidas');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEdit = (brand: ProtectedBrand) => {
    setEditingId(brand.id);
    setFormData({
      domain_name: brand.domain_name,
      brand_display_name: brand.brand_display_name,
      description: brand.description || '',
      access_password: brand.access_password,
      is_active: brand.is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({
      domain_name: '',
      brand_display_name: '',
      description: '',
      access_password: 'Leif1975..',
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Update existing brand
        const { error } = await supabase
          .from('protected_brands')
          .update({
            brand_display_name: formData.brand_display_name,
            description: formData.description || null,
            access_password: formData.access_password,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        showMessage('success', 'Marca atualizada com sucesso');
      } else {
        // Create new brand
        const { error } = await supabase
          .from('protected_brands')
          .insert([formData]);

        if (error) throw error;
        showMessage('success', 'Marca adicionada com sucesso');

        // Also mark in premium_domains if exists
        await supabase
          .from('premium_domains')
          .update({ is_protected_brand: true })
          .eq('fqdn', `${formData.domain_name}.com.rich`);
      }

      handleCancelEdit();
      loadBrands();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      showMessage('error', error.message || 'Erro ao salvar marca');
    }
  };

  const handleDelete = async (id: string, domainName: string) => {
    if (!confirm('Tem certeza que deseja excluir esta marca protegida?')) return;

    try {
      const { error } = await supabase
        .from('protected_brands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Also unmark in premium_domains
      await supabase
        .from('premium_domains')
        .update({ is_protected_brand: false })
        .eq('fqdn', `${domainName}.com.rich`);

      showMessage('success', 'Marca removida com sucesso');
      loadBrands();
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      showMessage('error', error.message || 'Erro ao excluir marca');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('protected_brands')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      showMessage('success', `Marca ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`);
      loadBrands();
    } catch (error: any) {
      console.error('Error toggling brand status:', error);
      showMessage('error', error.message || 'Erro ao alterar status');
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-[#F5F5F5] py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Marcas Protegidas"
            description="Gerencie marcas de alto valor e reconhecimento mundial"
            onRefresh={loadBrands}
            refreshing={loading}
          />

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#6B7280]">
          <Shield className="w-5 h-5" />
          <span className="font-medium">{brands.length} marcas protegidas</span>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Adicionar Marca
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Nova Marca Protegida</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nome do Domínio *
              </label>
              <input
                type="text"
                value={formData.domain_name}
                onChange={(e) => setFormData({ ...formData, domain_name: e.target.value.toLowerCase() })}
                placeholder="ex: tesla"
                className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">Sem .com.rich - apenas o nome</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nome de Exibição *
              </label>
              <input
                type="text"
                value={formData.brand_display_name}
                onChange={(e) => setFormData({ ...formData, brand_display_name: e.target.value })}
                placeholder="ex: Tesla"
                className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da marca"
                rows={2}
                className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Senha de Acesso *
              </label>
              <input
                type="text"
                value={formData.access_password}
                onChange={(e) => setFormData({ ...formData, access_password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-yellow-600"
                />
                <span className="text-sm font-semibold text-gray-700">Marca Ativa</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-black">Marca</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-black">Domínio</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-black">Descrição</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-black">Status</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-black">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-slate-50">
                {editingId === brand.id ? (
                  <>
                    <td className="py-4 px-6" colSpan={5}>
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Nome de Exibição *
                            </label>
                            <input
                              type="text"
                              value={formData.brand_display_name}
                              onChange={(e) => setFormData({ ...formData, brand_display_name: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Senha de Acesso *
                            </label>
                            <input
                              type="text"
                              value={formData.access_password}
                              onChange={(e) => setFormData({ ...formData, access_password: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Descrição
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-5 h-5 text-yellow-600"
                              />
                              <span className="text-sm font-semibold text-gray-700">Marca Ativa</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Save className="w-4 h-4" />
                            Salvar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-black">{brand.brand_display_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">{brand.domain_name}.com.rich</code>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#6B7280]">
                      {brand.description || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(brand.id, brand.is_active)}
                        className="inline-flex items-center gap-1"
                      >
                        {brand.is_active ? (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Ativa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            <XCircle className="w-3 h-3" />
                            Inativa
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id, brand.domain_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#6B7280]">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">Nenhuma marca protegida cadastrada</p>
                  <p className="text-sm mt-1">Adicione marcas de alto valor para proteção especial</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </div>
      </div>
    </PageLayout>
  );
}
