import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PanelLayout } from '../components/PanelLayout';
import { PanelSidebar } from '../components/PanelSidebar';
import { PageHeader } from '../components/PageHeader';
import {
  ExternalLink,
  Eye,
  BarChart3,
  Loader,
  TrendingUp,
  Users,
  MousePointerClick,
  Share2,
  Monitor,
  CheckCircle2,
  Copy,
  ChevronRight,
  ArrowLeft,
  Settings,
  MessageCircle,
  Link2
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Toast from '../components/Toast';
import { VerticalFeed } from '../components/social/VerticalFeed';
import { PublicProfileView } from '../components/PublicProfileView';

interface UserProfile {
  id: string;
  subdomain: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  is_public: boolean;
  view_count: number;
  display_mode: 'social' | 'links' | 'both';
  background_type?: string;
  background_color?: string;
  background_gradient_start?: string;
  background_gradient_end?: string;
  background_media_url?: string;
  background_overlay_color?: string;
  background_overlay_opacity?: number;
  custom_font?: string;
  custom_css?: string;
  button_color?: string;
  button_text_color?: string;
  button_opacity?: number;
}

interface ProfileLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  position: number;
  is_visible: boolean;
  click_count?: number;
  button_color?: string;
  button_text_color?: string;
  button_opacity?: number;
}

interface ProfileStats {
  total_views: number;
  total_clicks: number;
  total_followers: number;
  total_posts: number;
}

export default function ProfilePreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'analytics'>('preview');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentTab, setContentTab] = useState<'links' | 'community'>('links');
  const [isEliteMember, setIsEliteMember] = useState(false);

  // Determinar de onde o usuário veio
  const fromRoute = (location.state as any)?.from || '/panel/dashboard';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadLinks();
      loadStats();
      loadSubscription();

      const interval = setInterval(() => {
        loadProfile();
        loadLinks();
        loadStats();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Load profile by user_id first to get subdomain
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (userError) throw userError;

      // Now load the profile as if it were public (by subdomain)
      // This ensures we see exactly what visitors will see
      if (userProfile.subdomain) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('subdomain', userProfile.subdomain)
          .single();

        if (error) throw error;
        setProfile(data);
      } else {
        setProfile(userProfile);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLinks = async () => {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        const { data, error } = await supabase
          .from('profile_links')
          .select('*')
          .eq('profile_id', profileData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        // Converter para o formato esperado pelo PublicProfileView
        const convertedLinks = (data || []).map((link: any) => ({
          id: link.id,
          title: link.title,
          url: link.url,
          icon: link.icon,
          position: link.sort_order,
          is_visible: link.is_active,
          is_system_link: false,
          button_color: link.style?.bgColor || '#3B82F6',
          button_text_color: link.style?.textColor || '#FFFFFF',
          button_opacity: (link.style?.opacity || 1.0) * 100, // Converter 0-1 para 0-100
          button_animation: 'none',
        }));

        setLinks(convertedLinks);
      }
    } catch (error: any) {
      console.error('Error loading links:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('view_count, id')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        const { data: postsData } = await supabase
          .from('social_posts')
          .select('id', { count: 'exact' })
          .eq('user_id', user?.id);

        const { data: followersData } = await supabase
          .from('social_followers')
          .select('id', { count: 'exact' })
          .eq('following_id', profileData.id);

        const totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);

        setStats({
          total_views: profileData.view_count || 0,
          total_clicks: totalClicks,
          total_followers: followersData?.length || 0,
          total_posts: postsData?.length || 0
        });
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSubscription = async () => {
    try {
      if (!user?.id) return;

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('plan_id, subscription_plans(plan_type)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionData && subscriptionData.subscription_plans) {
        const planType = (subscriptionData.subscription_plans as any).plan_type;
        setIsEliteMember(planType === 'elite' || planType === 'supreme');
      }
    } catch (error: any) {
      console.error('Error loading subscription:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Link;
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (profile?.background_type === 'solid' && profile.background_color) {
      return { backgroundColor: profile.background_color };
    } else if (profile?.background_type === 'gradient' && profile.background_gradient_start && profile.background_gradient_end) {
      return {
        backgroundImage: `linear-gradient(135deg, ${profile.background_gradient_start}, ${profile.background_gradient_end})`
      };
    } else if (profile?.background_type === 'image' && profile.background_media_url) {
      return {
        backgroundImage: `url(${profile.background_media_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return { backgroundColor: '#1a1a1a' };
  };

  const copyProfileLink = async () => {
    if (profile) {
      const url = `${window.location.origin}/${profile.subdomain}`;
      await navigator.clipboard.writeText(url);
      setMessage('Link copiado!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <Loader className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      );
    }
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      </PanelLayout>
    );
  }

  if (!profile) {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-400">Perfil não encontrado</p>
        </div>
      );
    }
    return (
      <PanelLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Perfil não encontrado</p>
        </div>
      </PanelLayout>
    );
  }

  // Mobile View - Direct Profile Display
  if (isMobile) {
    // Full screen community mode for mobile
    if (contentTab === 'community') {
      return (
        <div className="fixed inset-0 bg-black z-50">
          <VerticalFeed mode="my_posts" userId={profile.id} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-950">
        {message && (
          <Toast
            message={message}
            type={messageType}
            onClose={() => setMessage('')}
          />
        )}

        {/* Sidebar for mobile */}
        <PanelSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} backRoute={fromRoute} />

        {/* Mobile Profile Content */}
        <div
          className="min-h-screen relative"
          style={{
            ...getBackgroundStyle(),
            fontFamily: profile.custom_font ? `'${profile.custom_font}', sans-serif` : 'inherit'
          }}
        >
          {/* Background Video */}
          {profile.background_type === 'video' && profile.background_media_url && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={profile.background_media_url} type="video/mp4" />
            </video>
          )}

          {/* Overlay */}
          {profile.background_overlay_color && profile.background_overlay_opacity && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: profile.background_overlay_color,
                opacity: profile.background_overlay_opacity / 100
              }}
            />
          )}

          {/* Back Button - Floating */}
          <button
            onClick={() => navigate(-1)}
            className="fixed top-4 left-4 z-50 bg-black/30 backdrop-blur-md hover:bg-black/40 text-white p-3 rounded-full shadow-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Menu Button - Floating */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 right-4 z-50 bg-black/30 backdrop-blur-md hover:bg-black/40 text-white p-4 rounded-full shadow-xl transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Gerenciar Página Button - Floating Bottom */}
          <button
            onClick={() => navigate('/panel/profile')}
            className="fixed bottom-6 right-6 z-50 bg-[#D4AF37]/90 backdrop-blur-md hover:bg-[#C6941E] text-black p-4 rounded-full shadow-2xl transition-all flex items-center gap-2 font-medium"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">Gerenciar</span>
          </button>

          <div className="relative flex flex-col items-center py-16 px-6 z-10">
            {/* Avatar */}
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-28 h-28 rounded-full border-4 border-white/20 mb-4 object-cover shadow-xl"
              />
            )}

            {/* Name & Bio */}
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              {profile.display_name}
            </h1>
            {profile.bio && (
              <p className="text-gray-300 text-center mb-6 max-w-sm text-lg">
                {profile.bio}
              </p>
            )}

            {/* Tab Navigation */}
            <div className="w-full max-w-md mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setContentTab('links')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    contentTab === 'links'
                      ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black shadow-lg'
                      : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                  }`}
                >
                  <Link2 className="w-5 h-5" />
                  <span>Inicial</span>
                </button>
                <button
                  onClick={() => setContentTab('community')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    contentTab === 'community'
                      ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black shadow-lg'
                      : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Comunidade</span>
                </button>
              </div>
            </div>

            {/* Links */}
            {contentTab === 'links' && profile.display_mode !== 'social' && (
              <div className="w-full max-w-md space-y-4 mb-8">
                {links.filter(l => l.is_visible).map((link) => {
                  const Icon = getIconComponent(link.icon);
                  const buttonStyle: React.CSSProperties = {
                    backgroundColor: link.button_color
                      ? `${link.button_color}${Math.round((link.button_opacity || 100) * 2.55).toString(16).padStart(2, '0')}`
                      : 'rgba(255, 255, 255, 0.1)',
                    color: link.button_text_color || '#ffffff',
                  };

                  return (
                    <div
                      key={link.id}
                      className="backdrop-blur-sm hover:scale-105 transition-all rounded-xl p-5 flex items-center gap-4 cursor-pointer shadow-lg"
                      style={buttonStyle}
                    >
                      <Icon className="w-6 h-6 shrink-0" style={{ color: link.button_text_color || '#ffffff' }} />
                      <span className="font-medium flex-1 text-lg" style={{ color: link.button_text_color || '#ffffff' }}>
                        {link.title}
                      </span>
                      <ExternalLink className="w-5 h-5 opacity-60" style={{ color: link.button_text_color || '#ffffff' }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Social Indicator */}
            {profile.display_mode !== 'links' && contentTab === 'links' && (
              <div className="mt-8 text-center">
                <p className="text-white/70 text-base flex items-center gap-2 justify-center">
                  <TrendingUp className="w-5 h-5" />
                  {stats?.total_posts || 0} posts publicados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop View - Panel Layout
  return (
    <PanelLayout>
      {message && (
        <Toast
          message={message}
          type={messageType}
          onClose={() => setMessage('')}
        />
      )}

      {activeTab === 'preview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Preview - Live Public Profile View */}
          <div className="lg:col-span-2 flex items-start justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Frame */}
              <div className="bg-gray-950 rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
                {/* Phone Notch */}
                <div className="bg-black h-8 flex items-center justify-center">
                  <div className="w-24 h-4 bg-gray-900 rounded-full"></div>
                </div>

                {/* Preview Content with Fixed Height */}
                <div className="h-[700px] overflow-y-auto overflow-x-hidden">
                  <PublicProfileView
                    profile={profile as any}
                    links={links}
                    isEliteMember={isEliteMember}
                    activeTab={contentTab}
                    onTabChange={setContentTab}
                    isProfileOwner={true}
                    profileStats={{
                      views: stats?.total_views || 0,
                      followers: stats?.total_followers || 0,
                      posts: stats?.total_posts || 0
                    }}
                    showControls={true}
                  />
                </div>

                {/* Phone Bottom Bar */}
                <div className="bg-black h-6"></div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Stats & Share */}
          <div className="lg:col-span-1 space-y-4">
            {/* Ver Página Pública Button */}
            <button
              onClick={() => navigate(`/${profile.subdomain}`)}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              <Eye className="w-5 h-5" />
              Ver Página Pública
            </button>

            {/* Gerenciar Página Button */}
            <button
              onClick={() => navigate('/panel/profile')}
              className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C6941E] text-black py-3 px-4 rounded-lg transition-colors font-semibold"
            >
              <Settings className="w-5 h-5" />
              Gerenciar Página
            </button>

            {/* Analytics Button */}
            <button
              onClick={() => setActiveTab('analytics')}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>

            {/* Share Card */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 text-sm">Compartilhe sua página</h3>
              <div className="bg-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700/50">
                <span className="text-gray-400 text-xs block truncate">
                  {window.location.origin}/{profile.subdomain}
                </span>
              </div>
              <button
                onClick={copyProfileLink}
                className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C6941E] text-black font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </button>
            </div>

            {/* Stats Card */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="text-white font-semibold mb-4 text-sm">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-gray-300 text-sm">Visualizações</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.total_views || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-gray-300 text-sm">Cliques em links</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.total_clicks || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-gray-300 text-sm">Seguidores</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.total_followers || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-gray-300 text-sm">Posts</span>
                  </div>
                  <span className="text-white font-semibold">{stats?.total_posts || 0}</span>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="text-white font-semibold mb-4 text-sm">Configurações</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 py-1">
                  {profile.is_public ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-400 text-sm font-medium">Público</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400 text-sm font-medium">Privado</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 py-1">
                  Modo de exibição: <span className="text-gray-300 font-medium">
                    {profile.display_mode === 'social' ? 'Rede Social' : profile.display_mode === 'links' ? 'Links' : 'Ambos'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Analytics Detalhado</h3>

          {/* Links Performance */}
          <div className="mb-8">
            <h4 className="text-white font-medium mb-4">Performance dos Links</h4>
            <div className="space-y-3">
              {links.length > 0 ? (
                links.map((link) => {
                  const Icon = getIconComponent(link.icon);
                  return (
                    <div key={link.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                          <span className="text-white font-medium block">{link.title}</span>
                          <span className="text-gray-400 text-sm">{link.url}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[#D4AF37] font-bold text-lg">{link.click_count || 0}</span>
                        <span className="text-gray-400 text-sm block">cliques</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-8">Nenhum link criado ainda</p>
              )}
            </div>
          </div>

          {/* Overall Stats */}
          <div>
            <h4 className="text-white font-medium mb-4">Resumo Geral</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <Eye className="w-6 h-6 text-[#D4AF37] mb-2" />
                <div className="text-2xl font-bold text-white">{stats?.total_views || 0}</div>
                <div className="text-sm text-gray-400">Visualizações</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <MousePointerClick className="w-6 h-6 text-[#D4AF37] mb-2" />
                <div className="text-2xl font-bold text-white">{stats?.total_clicks || 0}</div>
                <div className="text-sm text-gray-400">Cliques</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <Users className="w-6 h-6 text-[#D4AF37] mb-2" />
                <div className="text-2xl font-bold text-white">{stats?.total_followers || 0}</div>
                <div className="text-sm text-gray-400">Seguidores</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-[#D4AF37] mb-2" />
                <div className="text-2xl font-bold text-white">{stats?.total_posts || 0}</div>
                <div className="text-sm text-gray-400">Posts</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
