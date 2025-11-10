import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ExternalLink, Mail, Twitter, Instagram, Linkedin, Github, Youtube, Facebook, Globe, Palette, BarChart3, Lock, Sparkles, MessageCircle, Link2, Menu, Plus, Users, Home, User, Settings, Eye, Heart, UserPlus, LogOut, ShoppingBag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { EliteBadge } from '../components/EliteBadge';
import PasswordProtectionModal from '../components/PasswordProtectionModal';
import ProtectedBrandAccess from '../components/ProtectedBrandAccess';
import { VerticalFeed } from '../components/social/VerticalFeed';
import { CreatePostModal } from '../components/social/CreatePostModal';
import { ProfileOwnerMenu } from '../components/ProfileOwnerMenu';
import { useAuth } from '../contexts/AuthContext';
import { DashboardDrawer } from '../components/DashboardDrawer';
import { LoginModalSimple } from '../components/LoginModalSimple';
import { SettingsButton } from '../components/SettingsButton';
import { ProfileFooterCTA } from '../components/ProfileFooterCTA';
import { profileLinksService, ProfileLink } from '../lib/services/profileLinks';

import BackgroundImage from '../assets/Fundo-Imagem-Perfil-Geral.png';

interface UserProfile {
  id: string;
  subdomain: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: 'dark' | 'light' | 'auto';
  is_public: boolean;
  password_protected: boolean;
  view_count: number;
  background_type?: string;
  background_color?: string;
  background_gradient_start?: string;
  background_gradient_end?: string;
  background_media_url?: string;
  background_overlay_opacity?: number;
  background_overlay_color?: string;
  custom_font?: string;
  custom_css?: string;
  domain?: string;
  show_store_button_on_profile?: boolean;
  store_enabled?: boolean;
  social_enabled?: boolean;
  store_allowed_by_admin?: boolean;
  social_allowed_by_admin?: boolean;
}


const iconMap: Record<string, any> = {
  Mail,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  Facebook,
  ExternalLink,
};

interface PublicProfileProps {
  subdomain?: string;
}

export default function PublicProfile({ subdomain: subdomainProp }: PublicProfileProps = {}) {
  const { username, slug } = useParams<{ username?: string; slug?: string }>();
  const actualSubdomain = subdomainProp || username || slug;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEliteMember, setIsEliteMember] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [isProtectedBrand, setIsProtectedBrand] = useState(false);
  const [protectedBrandData, setProtectedBrandData] = useState<{
    domain_name: string;
    brand_display_name: string;
    description?: string;
    access_password: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'community'>('links');
  const [isProfileOwner, setIsProfileOwner] = useState(false);
  const [profileStats, setProfileStats] = useState({ views: 0, followers: 0, posts: 0 });
  const [feedMode, setFeedMode] = useState<'all' | 'following' | 'my_posts'>('my_posts');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettingsLogin, setShowSettingsLogin] = useState(false);
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);

  // Scroll to top on mount and when loading finishes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [loading]);

  // Load profile links
  useEffect(() => {
    if (profile?.id) {
      loadProfileLinks();
    }
  }, [profile?.id]);

  const loadProfileLinks = async () => {
    if (!profile?.id) return;
    try {
      const links = await profileLinksService.getPublicLinks(profile.id);
      setProfileLinks(links);
    } catch (error) {
      console.error('Failed to load profile links:', error);
    }
  };

  // Load custom font when profile is loaded
  useEffect(() => {
    const fontFamily = profile?.custom_font || 'Cinzel';

    if (fontFamily && fontFamily !== 'Cinzel' && fontFamily !== 'Inter') {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Apply font globally to body and all elements
    const originalBodyFont = document.body.style.fontFamily;
    const fontFallback = fontFamily ? 'sans-serif' : 'serif';
    document.body.style.fontFamily = `'${fontFamily}', ${fontFallback}, system-ui, -apple-system`;

    // Create global style to ensure font is applied everywhere
    const styleId = 'global-custom-font';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      * {
        font-family: ${fontFamily}, system-ui, -apple-system, sans-serif !important;
      }
    `;

    // Cleanup on unmount
    return () => {
      document.body.style.fontFamily = originalBodyFont;
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [profile?.custom_font]);

  // Apply custom CSS when profile is loaded
  useEffect(() => {
    if (profile?.custom_css) {
      const styleId = 'custom-profile-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = profile.custom_css;

      return () => {
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [profile?.custom_css]);

  useEffect(() => {
    if (!actualSubdomain) {
      console.log('❌ No subdomain provided');
      setNotFound(true);
      setLoading(false);
      return;
    }

    console.log('🔍 PublicProfile: Loading profile for subdomain:', actualSubdomain);

    // Safety timeout - if loading takes more than 15 seconds, force error state
    const timeout = setTimeout(() => {
      console.error('⏰ Loading timeout after 15s - forcing error state');
      setLoading(false);
      setNotFound(true);
    }, 15000);

    // Load profile and always clear timeout
    loadProfile()
      .catch((err) => {
        console.error('💥 Fatal error loading profile:', err);
        setNotFound(true);
      })
      .finally(() => {
        clearTimeout(timeout);
        console.log('🏁 Loading finished, state:', { loading, notFound });
      });

    // Cleanup
    return () => {
      clearTimeout(timeout);
    };
  }, [actualSubdomain]);

  const loadProfile = async () => {
    try {
      console.log('🔍 Starting loadProfile for:', actualSubdomain);

      // First check if this is a protected brand
      console.log('📋 Checking protected brands...');
      const { data: brandData, error: brandError } = await supabase
        .from('protected_brands')
        .select('*')
        .eq('domain_name', actualSubdomain)
        .eq('is_active', true)
        .maybeSingle();

      console.log('📋 Brand check result:', { brandData, brandError });

      if (brandData && !brandError) {
        // This is a protected brand
        console.log('🔒 Protected brand detected');
        setIsProtectedBrand(true);
        setProtectedBrandData(brandData);
        setLoading(false);
        return;
      }

      console.log('👤 Loading user profile...');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('subdomain', actualSubdomain)
        .maybeSingle();

      console.log('👤 Profile result:', { profileData, profileError });

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }

      if (!profileData) {
        console.log('❌ Profile not found');
        setNotFound(true);
        setLoading(false);
        return;
      }

      console.log('✅ Profile loaded successfully');

      // Buscar domínio vinculado ao perfil através do customer
      const { data: domainData } = await supabase
        .from('domains')
        .select('fqdn, customers!inner(user_id)')
        .eq('customers.user_id', profileData.user_id)
        .eq('domain_type', 'own')
        .maybeSingle();

      // If profile is not public and not password protected, show empty profile page
      // This allows users to see the institutional page even if profile is private

      setProfile({ ...profileData, domain: domainData?.fqdn || null });

      // Check if profile is password protected
      if (profileData.password_protected && !isAuthenticated) {
        setShowPasswordModal(true);
        setLoading(false);
        return;
      }

      const { data: subscriptionData} = await supabase
        .from('subscriptions')
        .select('plan_id, subscription_plans(plan_type)')
        .eq('user_id', profileData.user_id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionData && subscriptionData.subscription_plans) {
        const planType = (subscriptionData.subscription_plans as any).plan_type;
        setIsEliteMember(planType === 'elite' || planType === 'supreme');
      }

      // Check if user is an affiliate
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('referral_code, status')
        .eq('user_id', profileData.user_id)
        .eq('status', 'active')
        .maybeSingle();

      if (affiliateData) {
        setAffiliateCode(affiliateData.referral_code);
      }

      // Check if current user is the profile owner
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setIsProfileOwner(currentUser?.id === profileData.user_id);

      // Load profile stats
      const { data: followersData } = await supabase
        .from('social_follows')
        .select('id', { count: 'exact' })
        .eq('following_id', profileData.user_id);

      const { data: postsData } = await supabase
        .from('social_posts')
        .select('id', { count: 'exact' })
        .eq('user_id', profileData.user_id)
        .eq('is_active', true);

      setProfileStats({
        views: profileData.view_count || 0,
        followers: followersData?.length || 0,
        posts: postsData?.length || 0
      });

      // Set initial feed mode based on display_mode
      if (profileData.display_mode === 'community') {
        setFeedMode('all');
      } else if (profileData.display_mode === 'both') {
        setFeedMode('my_posts');
      } else {
        setFeedMode('my_posts');
      }

      await supabase
        .from('user_profiles')
        .update({ view_count: (profileData.view_count || 0) + 1 })
        .eq('id', profileData.id);

    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setNotFound(true);
      setLoading(false);
    } finally {
      console.log('🎯 FINALLY: Setting loading to FALSE');
      setLoading(false);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!profile) return false;

    try {
      const { data, error } = await supabase.rpc('verify_profile_password', {
        profile_uuid: profile.id,
        password_text: password
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  const verifyBrandPassword = async (password: string): Promise<boolean> => {
    if (!protectedBrandData) return false;

    // Simple password comparison (stored as plain text)
    // In production, this should use proper hashing
    if (password === protectedBrandData.access_password) {
      setIsProtectedBrand(false);
      setIsAuthenticated(true);

      // Load the actual profile without triggering infinite loop
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('subdomain', actualSubdomain)
          .maybeSingle();

        if (!profileError && profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading profile after brand authentication:', error);
      }

      return true;
    }
    return false;
  };

  const handlePasswordSuccess = async () => {
    setIsAuthenticated(true);
    setShowPasswordModal(false);
  };


  // Show protected brand access screen
  if (isProtectedBrand && protectedBrandData) {
    return (
      <ProtectedBrandAccess
        brandName={protectedBrandData.domain_name}
        brandDisplayName={protectedBrandData.brand_display_name}
        description={protectedBrandData.description}
        onPasswordSubmit={verifyBrandPassword}
      />
    );
  }

  console.log('🎬 RENDER - Loading state:', { loading, notFound, hasProfile: !!profile });

  if (loading) {
    console.log('🔄 Renderizando tela de loading...');
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37] mb-4"></div>
        <p className="text-gray-400 text-sm">Verificando domínio...</p>
        <p className="text-gray-600 text-xs mt-2">Subdomain: {actualSubdomain}</p>
        <p className="text-gray-500 text-xs mt-1">Verifique o console (F12)</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-[#D4AF37] mb-4">404</h1>
          <p className="text-xl text-[#9CA3AF] mb-8">Perfil não encontrado</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8941F] transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const getFontFamily = () => {
    return profile?.custom_font || 'Inter, system-ui, sans-serif';
  };

  const getButtonStyle = () => {
    return {
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      borderRadius: '0.75rem',
    };
  };

  const getBackgroundStyle = () => {
    const bgType = profile?.background_type || 'solid';
    const baseStyle: React.CSSProperties = {
      minHeight: '100vh',
      position: 'relative',
      fontFamily: getFontFamily(),
    };

    switch (bgType) {
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: profile?.background_color || '#000000',
        };

      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom right, ${profile?.background_gradient_start || '#3B82F6'}, ${profile?.background_gradient_end || '#8B5CF6'})`,
        };

      case 'image':
      case 'video':
        return baseStyle;

      default:
        return {
          ...baseStyle,
          backgroundColor: '#000000',
        };
    }
  };

  // Check if profile is empty (no customization)
  // Consider profile empty if:
  // 1. No avatar OR avatar is default/placeholder
  // 2. No bio OR bio is default text
  // 3. No links (excluding system links)
  const defaultBio = "A plataforma premium para criar sua identidade digital profissional. Domínios personalizados, perfis elegantes e cartões exclusivos.";
  const userLinks = profileLinks.filter(link => !link.is_system_link);
  const hasCustomAvatar = profile?.avatar_url && !profile.avatar_url.includes('placeholder') && !profile.avatar_url.includes('default');
  const hasCustomBio = profile?.bio && profile.bio !== defaultBio && profile.bio.trim() !== '';
  const hasCustomLinks = userLinks.length > 0;

  // Profile is only considered "empty" if it has no customization
  // This is the "under construction" page - show the luxurious institutional page
  const isEmptyProfile = !hasCustomAvatar && !hasCustomBio && !hasCustomLinks;

  // Check if user can post - assume they can if logged in (will be validated server-side)
  const canPost = !!user;

  // Handle interactions
  const handleCreatePost = () => {
    console.log('🔵 handleCreatePost called');
    console.log('👤 User:', user);
    console.log('📊 Subscription Plan:', user?.subscriptionPlan);
    console.log('✅ Can Post:', canPost);

    if (!user) {
      console.log('❌ No user - showing login modal');
      setShowLoginModal(true);
      return;
    }

    // Allow all logged users to try creating a post
    // Server-side validation will handle permissions
    console.log('✅ Opening create modal');
    setShowCreateModal(true);
  };

  const handleFeedModeChange = (mode: 'all' | 'following' | 'my_posts') => {
    if (mode === 'following' && !user) {
      setShowLoginModal(true);
      return;
    }
    setFeedMode(mode);
  };

  const handleMyPageClick = () => {
    setActiveTab('links');
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // If profile is empty, show the beautiful institutional "under construction" page
  // This creates a premium experience even before the user customizes their profile
  if (isEmptyProfile && profile) {
    return (
      <div className="min-h-screen relative py-12 px-4 overflow-hidden">
        {/* Premium Background with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${BackgroundImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/80 to-black/85 backdrop-blur-[2px]" />

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            {/* Decorative top accent */}
            <div className="flex justify-center mb-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
            </div>

            <div className="inline-block mb-8 p-4 bg-gradient-to-br from-[#1F1F1F] via-[#252525] to-[#1F1F1F] border-2 border-[#D4AF37] rounded-2xl shadow-2xl shadow-[#D4AF37]/30">
              <img
                src="/logo.png"
                alt="com.rich"
                className="h-24 w-24"
              />
            </div>

            <h1 className={`font-black mb-4 tracking-tight whitespace-nowrap ${
              profile.subdomain.length <= 8
                ? 'text-5xl sm:text-6xl md:text-7xl'
                : profile.subdomain.length <= 12
                ? 'text-4xl sm:text-5xl md:text-6xl'
                : profile.subdomain.length <= 16
                ? 'text-3xl sm:text-4xl md:text-5xl'
                : 'text-2xl sm:text-3xl md:text-4xl'
            }`}>
              <span className="text-white">
                {profile.subdomain}
              </span>
              <span className="bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] bg-clip-text text-transparent animate-shine bg-[length:200%_auto]">
                .com.rich
              </span>
            </h1>

            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1F1F1F] via-[#252525] to-[#1F1F1F] border border-[#D4AF37]/40 rounded-full shadow-lg shadow-[#D4AF37]/20">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
              <p className="text-sm text-[#D4AF37] font-semibold tracking-wide">
                Perfil em construção
              </p>
            </div>

            {/* Decorative bottom accent */}
            <div className="flex justify-center mt-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <>
      <PasswordProtectionModal
        isOpen={showPasswordModal}
        onClose={() => window.history.back()}
        onSuccess={handlePasswordSuccess}
        onVerify={verifyPassword}
        profileName={profile.display_name || profile.subdomain}
      />

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] rounded-2xl p-8 max-w-md w-full border border-[#D4AF37]/20">
            <h2 className="text-2xl font-bold text-white mb-4">Login Necessário</h2>
            <p className="text-gray-400 mb-6">
              Para interagir com a comunidade, você precisa estar logado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/login', { state: { returnTo: window.location.pathname } });
                }}
                className="flex-1 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-bold py-3 rounded-lg"
              >
                Fazer Login
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] rounded-2xl p-8 max-w-md w-full border border-[#D4AF37]/20">
            <h2 className="text-2xl font-bold text-white mb-4">Upgrade Necessário</h2>
            <p className="text-gray-400 mb-6">
              Para criar posts, você precisa de um plano Prime ou superior.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/valores');
                }}
                className="flex-1 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black font-bold py-3 rounded-lg"
              >
                Ver Planos
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-white/10 text-white font-semibold py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Full Screen Mode */}
      {activeTab === 'community' ? (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Feed */}
          <div className="flex-1 overflow-hidden">
            <VerticalFeed
              key={refreshKey}
              mode={feedMode}
              userId={feedMode === 'my_posts' ? profile.user_id : undefined}
            />
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 pb-safe">
            <div className="grid grid-cols-5 items-end px-2 py-2">
              <button
                onClick={() => handleFeedModeChange('all')}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  feedMode === 'all' ? 'text-[#D4AF37]' : 'text-gray-400'
                }`}
              >
                <Globe className="w-6 h-6" />
                <span className="text-xs font-medium">Todos</span>
              </button>
              <button
                onClick={() => handleFeedModeChange('following')}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  feedMode === 'following' ? 'text-[#D4AF37]' : 'text-gray-400'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-xs font-medium">Seguindo</span>
              </button>
              <button
                onClick={handleCreatePost}
                className="flex justify-center -mt-4"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <Plus className="w-7 h-7 text-black" />
                </div>
              </button>
              <button
                onClick={() => handleFeedModeChange('my_posts')}
                className={`flex flex-col items-center gap-1 py-2 transition-colors ${
                  feedMode === 'my_posts' ? 'text-[#D4AF37]' : 'text-gray-400'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-xs font-medium">{user && isProfileOwner ? 'Meu Feed' : 'Feed'}</span>
              </button>
              <button
                onClick={handleMyPageClick}
                className="flex flex-col items-center gap-1 py-2 transition-colors"
              >
                <div className="flex flex-col items-center gap-1">
                  <Home className="w-6 h-6 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-[#D4AF37]">Inicial</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div style={getBackgroundStyle()} className="min-h-screen">
          {/* Background Media */}
          {(profile?.background_type === 'image' || profile?.background_type === 'video') && profile?.background_media_url && (
            <>
              {profile.background_type === 'image' ? (
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${profile.background_media_url})` }}
                />
              ) : (
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
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{
                  backgroundColor: profile.background_overlay_color || '#000000',
                  opacity: (profile.background_overlay_opacity ?? 60) / 100,
                }}
              />
            </>
          )}

          {/* Content */}
          <div className="relative z-10 min-h-screen flex flex-col" style={{ fontFamily: profile.custom_font ? `'${profile.custom_font}', sans-serif` : 'Cinzel, serif' }}>
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 sm:py-8">
          {/* Settings Button - Universal for all users */}
          <div className="flex justify-end mb-2 sm:mb-4">
            <SettingsButton
              isProfileOwner={isProfileOwner}
              onOpenDashboard={() => setShowDashboard(true)}
              onOpenLogin={() => setShowSettingsLogin(true)}
            />
          </div>

          {/* Header with Avatar, Name and Bio */}
          <div className="text-center mb-6 sm:mb-8 profile-header">
            {/* Avatar with Golden Border */}
            {profile.avatar_url ? (
              <div className="relative inline-block mb-3 sm:mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] overflow-hidden shadow-2xl">
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-3 sm:mb-4 border-4 border-[#D4AF37] bg-[#1F1F1F] flex items-center justify-center shadow-2xl">
                <img
                  src="/logo.png"
                  alt="com.rich"
                  className="w-20 h-20 object-contain"
                />
              </div>
            )}

            {/* Name and Elite Badge */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 sm:mb-2">
              {profile.display_name || profile.subdomain}
            </h1>
            {isEliteMember && (
              <div className="flex justify-center mb-2 sm:mb-3">
                <EliteBadge size="lg" />
              </div>
            )}

            {/* Domain or @username */}
            <div className="text-[#D4AF37] text-base mb-3 sm:mb-4 font-medium">
              {profile.domain ? `${profile.domain}` : `${profile.subdomain}.com.rich`}
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-4 sm:mb-6">
                {profile.bio}
              </p>
            ) : (
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-4 sm:mb-6">
                A plataforma premium para criar sua identidade digital profissional. Domínios personalizados, perfis elegantes e cartões exclusivos.
              </p>
            )}

          {/* Tab Navigation */}
          <div className="flex gap-3 max-w-lg mx-auto mb-4 sm:mb-6">
            {/* Store Button - Only show if enabled by user AND allowed by admin */}
            {profile?.show_store_button_on_profile !== false &&
             profile?.store_enabled !== false &&
             profile?.store_allowed_by_admin !== false && (
              <button
                onClick={() => navigate(`/${actualSubdomain}/loja`)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Loja</span>
              </button>
            )}
            {/* Social Button - Only show if enabled by user AND allowed by admin */}
            {profile?.social_enabled !== false &&
             profile?.social_allowed_by_admin !== false && (
              <button
                onClick={() => setActiveTab('community')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === 'community'
                    ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Social</span>
              </button>
            )}
          </div>

          {/* Custom Links */}
          {profileLinks.length > 0 && (
            <div className="space-y-3 max-w-lg mx-auto mb-8">
              {profileLinks.map((link) => {
                const IconComponent = (LucideIcons as any)[
                  link.icon.charAt(0).toUpperCase() +
                  link.icon.slice(1).replace(/-./g, (x: string) => x[1].toUpperCase())
                ] || ExternalLink;

                const bgColorWithOpacity = `${link.style.bgColor}${Math.round(link.style.opacity * 255).toString(16).padStart(2, '0')}`;

                const handleLinkClick = async () => {
                  try {
                    await profileLinksService.incrementClicks(link.id);
                  } catch (error) {
                    console.error('Failed to track click:', error);
                  }

                  // Determinar como abrir o link baseado no tipo
                  if (link.url.startsWith('mailto:') || link.url.startsWith('tel:') || link.url.startsWith('sms:')) {
                    // Email, telefone, SMS: abrir diretamente (não usa _blank)
                    window.location.href = link.url;
                  } else if (link.url.includes('wa.me') || link.url.includes('maps.google.com') || link.url.startsWith('geo:')) {
                    // WhatsApp, Localização: abrir em nova aba
                    window.open(link.url, '_blank', 'noopener,noreferrer');
                  } else {
                    // Outros links (websites, etc): abrir em nova aba
                    window.open(link.url, '_blank', 'noopener,noreferrer');
                  }
                };

                return (
                  <button
                    key={link.id}
                    onClick={handleLinkClick}
                    style={{
                      backgroundColor: bgColorWithOpacity,
                      color: link.style.textColor,
                      borderRadius: '12px',
                      borderColor: link.style.borderColor || 'transparent',
                      borderWidth: link.style.borderColor ? '2px' : '0',
                      borderStyle: 'solid',
                      boxShadow: link.style.shadow ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
                    }}
                    className="w-full px-6 py-4 font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5" />
                      <span>{link.title}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer CTA - Affiliate-aware */}
        {!isProfileOwner && (
          <ProfileFooterCTA
            affiliateCode={affiliateCode || undefined}
            isAffiliate={isEliteMember && !!affiliateCode}
          />
        )}
      </div>
      </div>
        </div>
      )}

      {/* Dashboard Drawer */}
      <DashboardDrawer
        isOpen={showDashboard}
        onClose={() => {
          setShowDashboard(false);
          if (actualSubdomain) {
            navigate(`/${actualSubdomain}`);
          }
        }}
        returnUrl={`/${actualSubdomain}`}
        returnPageName={profile?.display_name || actualSubdomain || 'Perfil'}
      />

      {/* Login Modal from Settings Button */}
      <LoginModalSimple
        isOpen={showSettingsLogin}
        onClose={() => setShowSettingsLogin(false)}
        affiliateCode={affiliateCode || undefined}
      />
    </>
  );
}
