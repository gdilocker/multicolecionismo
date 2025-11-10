import React, { useState, useEffect } from 'react';
import { Store, MessageSquare, Check, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminFeatureControlProps {
  profileId: string;
  profileName: string;
  onUpdate?: () => void;
}

interface FeatureStatus {
  store_enabled: boolean;
  social_enabled: boolean;
  store_allowed_by_admin: boolean;
  social_allowed_by_admin: boolean;
}

const AdminFeatureControl: React.FC<AdminFeatureControlProps> = ({
  profileId,
  profileName,
  onUpdate
}) => {
  const [features, setFeatures] = useState<FeatureStatus>({
    store_enabled: true,
    social_enabled: true,
    store_allowed_by_admin: true,
    social_allowed_by_admin: true
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadFeatureStatus();
  }, [profileId]);

  const loadFeatureStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('store_enabled, social_enabled, store_allowed_by_admin, social_allowed_by_admin')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      if (data) setFeatures(data);
    } catch (error) {
      console.error('Error loading feature status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminPermission = async (feature: 'store' | 'social', currentValue: boolean) => {
    const columnName = `${feature}_allowed_by_admin`;
    setUpdating(feature);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ [columnName]: !currentValue })
        .eq('id', profileId);

      if (error) throw error;

      setFeatures(prev => ({
        ...prev,
        [columnName]: !currentValue
      }));

      const featureName = feature === 'store' ? 'Loja' : 'Rede Social';
      const status = !currentValue ? 'permitida' : 'bloqueada';

      if (onUpdate) onUpdate();

      // Toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
      toast.textContent = `Função ${featureName} ${status} para ${profileName}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      console.error('Error toggling admin permission:', error);
      alert('Erro ao atualizar permissão. Tente novamente.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const storeStatus = features.store_allowed_by_admin
    ? (features.store_enabled ? 'Ativa' : 'Desativada pelo usuário')
    : 'Bloqueada pelo admin';

  const socialStatus = features.social_allowed_by_admin
    ? (features.social_enabled ? 'Ativa' : 'Desativada pelo usuário')
    : 'Bloqueada pelo admin';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-sm font-semibold text-black">{profileName}</div>
      </div>

      <div className="space-y-3">
        {/* Store Control */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              features.store_allowed_by_admin && features.store_enabled
                ? 'bg-amber-100'
                : 'bg-gray-200'
            }`}>
              <Store className={`w-4 h-4 ${
                features.store_allowed_by_admin && features.store_enabled
                  ? 'text-amber-600'
                  : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black flex items-center gap-2">
                Loja
                {features.store_allowed_by_admin && features.store_enabled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ativa
                  </span>
                )}
                {!features.store_allowed_by_admin && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <X className="w-3 h-3" /> Bloqueada
                  </span>
                )}
                {features.store_allowed_by_admin && !features.store_enabled && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Desativada
                  </span>
                )}
              </div>
              <div className="text-xs text-[#6B7280]">{storeStatus}</div>
            </div>
          </div>
          <button
            onClick={() => toggleAdminPermission('store', features.store_allowed_by_admin)}
            disabled={updating === 'store'}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              features.store_allowed_by_admin ? 'bg-amber-600' : 'bg-gray-300'
            } ${updating === 'store' ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                features.store_allowed_by_admin ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Social Control */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${
              features.social_allowed_by_admin && features.social_enabled
                ? 'bg-blue-100'
                : 'bg-gray-200'
            }`}>
              <MessageSquare className={`w-4 h-4 ${
                features.social_allowed_by_admin && features.social_enabled
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-black flex items-center gap-2">
                Rede Social
                {features.social_allowed_by_admin && features.social_enabled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ativa
                  </span>
                )}
                {!features.social_allowed_by_admin && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <X className="w-3 h-3" /> Bloqueada
                  </span>
                )}
                {features.social_allowed_by_admin && !features.social_enabled && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Desativada
                  </span>
                )}
              </div>
              <div className="text-xs text-[#6B7280]">{socialStatus}</div>
            </div>
          </div>
          <button
            onClick={() => toggleAdminPermission('social', features.social_allowed_by_admin)}
            disabled={updating === 'social'}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              features.social_allowed_by_admin ? 'bg-blue-600' : 'bg-gray-300'
            } ${updating === 'social' ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                features.social_allowed_by_admin ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureControl;
