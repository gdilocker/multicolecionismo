import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { Search, Eye, Trash2, Edit, ExternalLink, CheckCircle, XCircle, Crown, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EliteBadge } from '../components/EliteBadge';
import AdminFeatureControl from '../components/AdminFeatureControl';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface Profile {
  id: string;
  subdomain: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  user_id: string;
  user_email?: string;
  is_elite?: boolean;
}

export default function AdminProfiles() {
  useScrollToTop();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profileIds = profilesData?.map(p => p.user_id) || [];

      // Get customer emails
      const { data: customersData } = await supabase
        .from('customers')
        .select('user_id, email')
        .in('user_id', profileIds);

      const emailMap = new Map(
        customersData?.map(c => [c.user_id, c.email]) || []
      );

      // Get subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('user_id, subscription_plans(plan_type)')
        .in('user_id', profileIds)
        .eq('status', 'active');

      const eliteUsers = new Set(
        subscriptionsData
          ?.filter(s => (s.subscription_plans as any)?.plan_type === 'elite')
          .map(s => s.user_id) || []
      );

      const formattedProfiles = profilesData?.map(p => ({
        ...p,
        user_email: emailMap.get(p.user_id) || 'N/A',
        is_elite: eliteUsers.has(p.user_id)
      })) || [];

      setProfiles(formattedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.filter(p => p.id !== profileId));
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Erro ao excluir perfil');
    }
  };

  const handleTogglePublic = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_public: !currentStatus })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === profileId ? { ...p, is_public: !currentStatus } : p
      ));
    } catch (error) {
      console.error('Error toggling profile status:', error);
      alert('Erro ao alterar status do perfil');
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch =
      profile.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && profile.is_public) ||
      (filter === 'private' && !profile.is_public);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-[#F5F5F5] py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Gerenciar Perfis"
            description={`Total de ${profiles.length} perfis cadastrados`}
            onRefresh={loadProfiles}
            refreshing={loading}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por username, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-slate-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('public')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'public'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Públicos
              </button>
              <button
                onClick={() => setFilter('private')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'private'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Privados
              </button>
            </div>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhum perfil encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Username</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Visualizações</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <React.Fragment key={profile.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {profile.avatar_url && (
                            <img
                              src={profile.avatar_url}
                              alt={profile.subdomain}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium text-slate-900">@{profile.subdomain}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          {profile.display_name || '-'}
                          {profile.is_elite && <EliteBadge size="sm" showLabel={false} />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {profile.user_email}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePublic(profile.id, profile.is_public)}
                          className={`flex items-center gap-1 mx-auto px-3 py-1 rounded-full text-xs font-medium ${
                            profile.is_public
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          {profile.is_public ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Público
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Privado
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700">
                        {profile.view_count || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setExpandedProfile(expandedProfile === profile.id ? null : profile.id)}
                            className="p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Controlar funcionalidades"
                          >
                            {expandedProfile === profile.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <Settings className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={`/${profile.subdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Ver perfil"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(profile.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProfile === profile.id && (
                      <tr>
                        <td colSpan={6} className="py-4 px-4 bg-gray-50">
                          <div className="max-w-3xl mx-auto">
                            <div className="mb-3 flex items-center gap-2">
                              <Settings className="w-5 h-5 text-slate-700" />
                              <h3 className="font-semibold text-slate-900">Controle de Funcionalidades</h3>
                            </div>
                            <AdminFeatureControl
                              profileId={profile.id}
                              profileName={profile.display_name || profile.subdomain}
                              onUpdate={() => loadProfiles()}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
