import { useNavigate } from 'react-router-dom';
import { ExternalLink, Mail, Twitter, Instagram, Linkedin, Github, Youtube, Facebook, Globe, MessageCircle, Link2, ShoppingBag, Eye, Heart, UserPlus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { EliteBadge } from './EliteBadge';

import BackgroundImage from '../assets/Fundo-Imagem-Perfil-Geral.png';

interface ProfileLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  position: number;
  is_visible: boolean;
  is_system_link?: boolean;
  button_color?: string;
  button_text_color?: string;
  button_opacity?: number;
  button_animation?: string;
}

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

interface PublicProfileViewProps {
  profile: UserProfile;
  links: ProfileLink[];
  isEliteMember: boolean;
  activeTab: 'links' | 'community';
  onTabChange: (tab: 'links' | 'community') => void;
  onLinkClick?: (linkId: string, url: string) => void;
  isProfileOwner?: boolean;
  profileStats?: { views: number; followers: number; posts: number };
  showControls?: boolean;
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

export function PublicProfileView({
  profile,
  links,
  isEliteMember,
  activeTab,
  onTabChange,
  onLinkClick,
  isProfileOwner = false,
  profileStats = { views: 0, followers: 0, posts: 0 },
  showControls = true
}: PublicProfileViewProps) {
  const navigate = useNavigate();

  // Check if store feature is active (enabled by user AND allowed by admin)
  const isStoreActive = () => {
    const userEnabled = profile?.store_enabled !== false;
    const adminAllowed = profile?.store_allowed_by_admin !== false;
    const showButton = profile?.show_store_button_on_profile !== false;
    return userEnabled && adminAllowed && showButton;
  };

  // Check if social feature is active (enabled by user AND allowed by admin)
  const isSocialActive = () => {
    const userEnabled = profile?.social_enabled !== false;
    const adminAllowed = profile?.social_allowed_by_admin !== false;
    return userEnabled && adminAllowed;
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || (LucideIcons as any)[iconName] || ExternalLink;
    return Icon;
  };

  const getFontFamily = () => {
    return profile?.custom_font || 'Inter, system-ui, sans-serif';
  };

  const getBackgroundStyle = () => {
    const bgType = profile?.background_type || 'solid';
    const baseStyle: React.CSSProperties = {
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

  const handleLinkClick = (linkId: string, url: string) => {
    if (onLinkClick) {
      onLinkClick(linkId, url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Check if profile is empty
  const defaultBio = "A plataforma premium para criar sua identidade digital profissional. Domínios personalizados, perfis elegantes e cartões exclusivos.";
  const userLinks = links.filter(link => !link.is_system_link);
  const hasCustomAvatar = profile?.avatar_url && !profile.avatar_url.includes('placeholder') && !profile.avatar_url.includes('default');
  const hasCustomBio = profile?.bio && profile.bio !== defaultBio && profile.bio.trim() !== '';
  const hasCustomLinks = userLinks.length > 0;
  const isEmptyProfile = !hasCustomAvatar && !hasCustomBio && !hasCustomLinks;

  // If profile is empty, show institutional page
  if (isEmptyProfile && profile) {
    return (
      <div className="relative py-12 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${BackgroundImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/80 to-black/85 backdrop-blur-[2px]" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
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

            <div className="flex justify-center mt-8">
              <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={getBackgroundStyle()} className="w-full">
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
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              backgroundColor: profile.background_overlay_color || '#000000',
              opacity: (profile.background_overlay_opacity ?? 60) / 100,
            }}
          />
        </>
      )}

      <div className="relative z-10 flex flex-col" style={{ fontFamily: profile.custom_font ? `'${profile.custom_font}', sans-serif` : 'Cinzel, serif' }}>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="text-center mb-8 profile-header">
            {profile.avatar_url ? (
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] overflow-hidden shadow-2xl">
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-[#D4AF37] bg-[#1F1F1F] flex items-center justify-center shadow-2xl">
                <img
                  src="/logo.png"
                  alt="com.rich"
                  className="w-20 h-20 object-contain"
                />
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {profile.display_name || profile.subdomain}
            </h1>
            {isEliteMember && (
              <div className="flex justify-center mb-3">
                <EliteBadge size="lg" />
              </div>
            )}

            <div className="text-[#D4AF37] text-base mb-4 font-medium">
              {profile.domain ? `${profile.domain}` : `${profile.subdomain}.com.rich`}
            </div>

            {profile.bio ? (
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
                {profile.bio}
              </p>
            ) : (
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
                A plataforma premium para criar sua identidade digital profissional. Domínios personalizados, perfis elegantes e cartões exclusivos.
              </p>
            )}

            {showControls && activeTab === 'links' && (
              <div className="flex gap-3 max-w-lg mx-auto mb-6">
                {isStoreActive() && (
                  <button
                    onClick={() => navigate(`/${profile.subdomain}/loja`)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Loja</span>
                  </button>
                )}
                {isSocialActive() && (
                  <button
                    onClick={() => onTabChange('community')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Social</span>
                  </button>
                )}
              </div>
            )}

            {showControls && activeTab !== 'links' && (
              <div className="flex gap-3 max-w-lg mx-auto mb-6">
                <button
                  onClick={() => onTabChange('links')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all bg-white/15 backdrop-blur-sm text-white hover:bg-white/25"
                >
                  <Link2 className="w-5 h-5" />
                  <span>Inicial</span>
                </button>
                {isStoreActive() && (
                  <button
                    onClick={() => navigate(`/${profile.subdomain}/loja`)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                      activeTab === 'store'
                        ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black shadow-lg'
                        : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Loja</span>
                  </button>
                )}
                {isSocialActive() && (
                  <button
                    onClick={() => onTabChange('community')}
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
            )}
          </div>

          {activeTab === 'links' && (
            <div className="space-y-4 profile-links">
              {links.map((link: any) => {
                const Icon = getIcon(link.icon);

                const buttonColor = link.button_color || '#3B82F6';
                const textColor = link.button_text_color || '#FFFFFF';
                const buttonOpacity = (link.button_opacity ?? 100) / 100;
                const buttonAnimation = link.button_animation || 'none';

                const hexToRgba = (hex: string, alpha: number) => {
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                const getAnimationClass = (animation: string): string => {
                  switch (animation) {
                    case 'pulse':
                      return 'animate-pulse';
                    case 'bounce':
                      return 'hover:animate-bounce';
                    case 'shake':
                      return 'hover:animate-shake';
                    case 'glow':
                      return 'hover:shadow-2xl';
                    case 'slide':
                      return 'hover:-translate-y-1 transition-transform';
                    case 'grow':
                      return 'hover:scale-105';
                    case 'rotate':
                      return 'hover:rotate-3 transition-transform';
                    default:
                      return '';
                  }
                };

                const buttonBgColor = hexToRgba(buttonColor, buttonOpacity);
                const animationClass = getAnimationClass(buttonAnimation);

                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id, link.url)}
                    className={`w-full backdrop-blur-sm transition-all duration-200 flex items-center justify-between group shadow-lg p-4 sm:p-5 rounded-xl profile-link ${animationClass} ${buttonAnimation !== 'slide' && buttonAnimation !== 'grow' ? 'hover:scale-[1.02]' : ''}`}
                    style={{ backgroundColor: buttonBgColor }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: textColor }} />
                      <span className="font-medium text-sm sm:text-base truncate" style={{ color: textColor }}>{link.title}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 transition-colors flex-shrink-0" style={{ color: textColor, opacity: 0.7 }} />
                  </button>
                );
              })}

              {links.length === 0 && (
                <div className="text-center py-8 px-4">
                  <p className="text-gray-400 text-sm">Nenhum link disponível no momento</p>
                </div>
              )}

              {isProfileOwner && (
                <div className="grid grid-cols-3 gap-4 mt-8 mb-6">
                  <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl py-4">
                    <div className="text-2xl font-bold text-white mb-1">{profileStats.views}</div>
                    <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      Visualizações
                    </div>
                  </div>
                  <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl py-4">
                    <div className="text-2xl font-bold text-white mb-1">{profileStats.followers}</div>
                    <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      Seguidores
                    </div>
                  </div>
                  <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl py-4">
                    <div className="text-2xl font-bold text-white mb-1">{profileStats.posts}</div>
                    <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3" />
                      Posts
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
