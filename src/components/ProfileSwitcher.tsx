import React, { useState, useEffect } from 'react';
import { User, Check, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  id: string;
  subdomain: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

export const ProfileSwitcher: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  async function loadProfiles() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, subdomain, display_name, avatar_url, is_active')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (err: any) {
      console.error('Error loading profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function switchProfile(profileId: string) {
    try {
      setSwitching(profileId);
      setError('');

      // Activate the selected profile
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: true })
        .eq('id', profileId);

      if (error) throw error;

      // Reload profiles to reflect changes
      await loadProfiles();
    } catch (err: any) {
      console.error('Error switching profile:', err);
      setError(err.message);
    } finally {
      setSwitching(null);
    }
  }

  if (!user) return null;

  // Don't show if user only has one profile
  if (profiles.length <= 1) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        Perfil Ativo
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => switchProfile(profile.id)}
                disabled={profile.is_active || switching !== null}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  profile.is_active
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                } ${switching === profile.id ? 'opacity-50' : ''}`}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                )}

                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-800">{profile.display_name}</p>
                  <p className="text-sm text-slate-500">@{profile.subdomain}</p>
                </div>

                {switching === profile.id ? (
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                ) : profile.is_active ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Ativo</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Clique para ativar</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> O perfil ativo é usado para seus posts e stories na Rede Social.
              Você pode trocar a qualquer momento.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
