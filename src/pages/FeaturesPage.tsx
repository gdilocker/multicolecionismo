import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import FeatureControls from '../components/FeatureControls';
import { ToggleLeft, ArrowLeft } from 'lucide-react';

export default function FeaturesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<{ id: string; subdomain: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const domainIdFromUrl = searchParams.get('domainId');

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, domainIdFromUrl]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('user_profiles')
        .select('id, subdomain')
        .eq('user_id', user!.id);

      if (domainIdFromUrl) {
        const { data: domain } = await supabase
          .from('domains')
          .select('id')
          .eq('id', domainIdFromUrl)
          .eq('user_id', user!.id)
          .maybeSingle();

        if (domain) {
          query = query.eq('domain_id', domain.id);
        }
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        console.error('No profile found for user');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  if (!profile) {
    return (
      <PanelLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-4">
              Você precisa criar uma página primeiro para gerenciar as funcionalidades.
            </p>
            <button
              onClick={() => navigate('/panel/domains')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Página
            </button>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          icon={ToggleLeft}
          title="Funcionalidades da Página"
          subtitle={`Ative ou desative funcionalidades para ${profile.subdomain}`}
        />

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <FeatureControls
            profileId={profile.id}
            onUpdate={() => {
              loadProfile();
            }}
          />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/panel/domains')}
            className="flex items-center gap-2 px-6 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gerenciar
          </button>
        </div>
      </div>
    </PanelLayout>
  );
}
