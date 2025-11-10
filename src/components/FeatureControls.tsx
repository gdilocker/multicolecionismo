import React, { useState, useEffect } from 'react';
import { Store, MessageSquare, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeatureControlsProps {
  profileId: string;
  onUpdate?: () => void;
}

interface FeatureStatus {
  store_enabled: boolean;
  social_enabled: boolean;
  store_allowed_by_admin: boolean;
  social_allowed_by_admin: boolean;
}

const FeatureControls: React.FC<FeatureControlsProps> = ({ profileId, onUpdate }) => {
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
        .maybeSingle();

      if (error) {
        console.error('Error loading feature status:', error);
        throw error;
      }

      if (data) {
        setFeatures({
          store_enabled: data.store_enabled ?? true,
          social_enabled: data.social_enabled ?? true,
          store_allowed_by_admin: data.store_allowed_by_admin ?? true,
          social_allowed_by_admin: data.social_allowed_by_admin ?? true
        });
      }
    } catch (error) {
      console.error('Error loading feature status:', error);
      // Set defaults on error
      setFeatures({
        store_enabled: true,
        social_enabled: true,
        store_allowed_by_admin: true,
        social_allowed_by_admin: true
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (feature: 'store' | 'social', currentValue: boolean) => {
    const columnName = `${feature}_enabled`;
    const allowedByAdmin = feature === 'store' ? features.store_allowed_by_admin : features.social_allowed_by_admin;

    if (!allowedByAdmin) {
      alert(`A funcionalidade ${feature === 'store' ? 'Loja' : 'Rede Social'} foi bloqueada pelo administrador.`);
      return;
    }

    setUpdating(feature);
    try {
      const newValue = !currentValue;
      console.log(`Toggling ${feature} from ${currentValue} to ${newValue}`);

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ [columnName]: newValue })
        .eq('id', profileId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      setFeatures(prev => ({
        ...prev,
        [columnName]: newValue
      }));

      const featureName = feature === 'store' ? 'Loja' : 'Rede Social';
      const status = newValue ? 'ativada' : 'desativada';

      if (onUpdate) {
        setTimeout(() => onUpdate(), 500);
      }

      // Toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
      toast.textContent = `Função ${featureName} ${status} com sucesso`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error: any) {
      console.error('Error toggling feature:', error);
      const errorMessage = error?.message || 'Erro ao atualizar funcionalidade. Tente novamente.';
      alert(errorMessage);
      // Reload to get current state
      await loadFeatureStatus();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  const isStoreActive = features.store_enabled && features.store_allowed_by_admin;
  const isSocialActive = features.social_enabled && features.social_allowed_by_admin;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-black mb-2">Funcionalidades da Página</h3>
        <p className="text-sm text-[#6B7280]">
          Ative ou desative funcionalidades na sua página pública
        </p>
      </div>

      {/* Store Control */}
      <div className={`relative group transition-all duration-300 ${!features.store_allowed_by_admin ? 'opacity-60' : ''}`}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
        <div className="relative bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isStoreActive
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gray-200'
              }`}>
                {!features.store_allowed_by_admin ? (
                  <Lock className="w-6 h-6 text-gray-500" />
                ) : (
                  <Store className={`w-6 h-6 ${isStoreActive ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-black">Loja</h4>
                  {!features.store_allowed_by_admin && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Bloqueado pelo admin
                    </span>
                  )}
                  {isStoreActive && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Ativa
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6B7280] mb-3">
                  Adiciona uma loja virtual à sua página com produtos, carrinho e checkout.
                </p>
                {!features.store_allowed_by_admin && (
                  <p className="text-xs text-red-600">
                    Esta funcionalidade foi desativada pelo administrador.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleFeature('store', features.store_enabled)}
              disabled={!features.store_allowed_by_admin || updating === 'store'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                !features.store_allowed_by_admin
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isStoreActive
                    ? 'bg-amber-600'
                    : 'bg-gray-300'
              } ${updating === 'store' ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isStoreActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Social Control */}
      <div className={`relative group transition-all duration-300 ${!features.social_allowed_by_admin ? 'opacity-60' : ''}`}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
        <div className="relative bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isSocialActive
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  : 'bg-gray-200'
              }`}>
                {!features.social_allowed_by_admin ? (
                  <Lock className="w-6 h-6 text-gray-500" />
                ) : (
                  <MessageSquare className={`w-6 h-6 ${isSocialActive ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-black">Rede Social</h4>
                  {!features.social_allowed_by_admin && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      Bloqueado pelo admin
                    </span>
                  )}
                  {isSocialActive && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Ativa
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6B7280] mb-3">
                  Habilita posts, comentários, curtidas e interações sociais na sua página.
                </p>
                {!features.social_allowed_by_admin && (
                  <p className="text-xs text-red-600">
                    Esta funcionalidade foi desativada pelo administrador.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => toggleFeature('social', features.social_enabled)}
              disabled={!features.social_allowed_by_admin || updating === 'social'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                !features.social_allowed_by_admin
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isSocialActive
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
              } ${updating === 'social' ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSocialActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureControls;
