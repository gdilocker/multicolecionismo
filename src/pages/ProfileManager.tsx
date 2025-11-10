import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PanelLayout } from '../components/PanelLayout';
import { PageHeader } from '../components/PageHeader';
import SocialButtonsEditor from '../components/SocialButtonsEditor';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import BackgroundEditor from '../components/BackgroundEditor';
import { Upload, Camera, X, Check, Settings, Palette, Share2, BarChart3, Crown, Monitor, Tablet, Smartphone, Type, MessageCircle, Eye, Save, Image as ImageIcon, Trash2, Phone, Link as LinkIcon, ToggleLeft, Store } from 'lucide-react';
import PhoneInput from '../components/PhoneInput';
import { motion, AnimatePresence } from 'framer-motion';
import { EliteBadge } from '../components/EliteBadge';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ThemeTemplateSelector from '../components/ThemeTemplateSelector';
import GoogleFontSelector from '../components/GoogleFontSelector';
import CustomCSSEditor from '../components/CustomCSSEditor';
import { VerticalFeed } from '../components/social/VerticalFeed';
import { PublicProfileView } from '../components/PublicProfileView';
import { CONTENT_LIMITS, validateBio, validateDisplayName, validateUsername } from '../lib/contentLimits';
import LinkEditor from '../components/LinkEditor';
import { profileLinksService, ProfileLink } from '../lib/services/profileLinks';
import FeatureControls from '../components/FeatureControls';

interface UserProfile {
  id: string;
  subdomain: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_public: boolean;
  password_protected: boolean;
  access_password: string | null;
  allow_default_password: boolean;
  background_type?: string;
  background_color?: string;
  background_gradient_start?: string;
  background_gradient_end?: string;
  background_media_url?: string;
  background_overlay_opacity?: number;
  background_overlay_color?: string;
  custom_font?: string;
  custom_css?: string;
}

export default function ProfileManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { domainId } = useParams<{ domainId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'background' | 'social' | 'links' | 'community' | 'analytics' | 'features' | 'store'>('profile');
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [socialEnabled, setSocialEnabled] = useState(false);
  const [isEliteMember, setIsEliteMember] = useState(false);
  const [userPlanName, setUserPlanName] = useState('Prime');
  const [customPassword, setCustomPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [domainName, setDomainName] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [linksRefresh, setLinksRefresh] = useState(0);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('BR');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  useEffect(() => {
    if (user?.id && !hasLoadedProfile) {
      setHasLoadedProfile(true);
      loadProfile();
    }
  }, [user?.id, domainId]);

  useEffect(() => {
    if (profile?.id) {
      loadFeatureStatus();
    }
  }, [profile?.id]);

  const loadFeatureStatus = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('store_enabled, social_enabled, store_allowed_by_admin, social_allowed_by_admin')
        .eq('id', profile.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setStoreEnabled(data.store_enabled && data.store_allowed_by_admin);
        setSocialEnabled(data.social_enabled && data.social_allowed_by_admin);
      }
    } catch (error) {
      console.error('Error loading feature status:', error);
    }
  };

  useEffect(() => {
    if (showPreview) {
      // Recarregar links imediatamente quando o preview abre
      loadLinks();

      const interval = setInterval(() => {
        loadLinks(); // Recarregar links periodicamente
        setPreviewRefreshKey(prev => prev + 1);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [showPreview, profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      loadLinks();
    }
  }, [profile?.id, linksRefresh]);

  const loadLinks = async () => {
    if (!profile?.id) return;
    try {
      const links = await profileLinksService.getLinks(profile.id);
      console.log('📥 Links carregados do banco:', links);
      setProfileLinks(links);
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  };

  const convertLinksForPreview = () => {
    const converted = profileLinks.map((link) => {
      const style = link.style || {
        bgColor: '#3B82F6',
        textColor: '#FFFFFF',
        opacity: 1.0
      };

      return {
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        position: link.sort_order,
        is_visible: link.is_active,
        is_system_link: false,
        button_color: style.bgColor || '#3B82F6',
        button_text_color: style.textColor || '#FFFFFF',
        button_opacity: (style.opacity || 1.0) * 100, // Converter 0-1 para 0-100
        button_animation: 'none',
      };
    });

    // Debug: ver links convertidos
    if (converted.length > 0) {
      console.log('🔄 Links convertidos para preview:', converted);
    }

    return converted;
  };

  const loadProfile = async () => {
    try {
      let profileData;
      let profileError;
      let currentDomainId = domainId;

      // Se não tem domainId na URL, busca o domínio principal (primeiro registrado)
      if (!currentDomainId) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user?.id)
          .maybeSingle();

        if (!customerData) {
          // Sem customer, vai para página de domínios
          setLoading(false);
          navigate('/panel/domains', { replace: true });
          return;
        }

        const { data: domainsData, error: domainsError } = await supabase
          .from('domains')
          .select('id, fqdn')
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: true });  // Primeiro domínio = domínio principal

        if (domainsError) throw domainsError;

        if (!domainsData || domainsData.length === 0) {
          // Sem domínios, vai para página de registrar domínio
          setLoading(false);
          navigate('/panel/domains', { replace: true });
          return;
        }

        // Pega o primeiro domínio (domínio principal)
        currentDomainId = domainsData[0].id;
        setDomainName(domainsData[0].fqdn);
      }

      // Agora temos certeza que currentDomainId existe
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!customerData) {
        setLoading(false);
        navigate('/panel/domains', { replace: true });
        return;
      }

      const { data: domainData } = await supabase
        .from('domains')
        .select('fqdn')
        .eq('id', currentDomainId)
        .eq('customer_id', customerData.id)
        .maybeSingle();

      if (!domainData) {
        // Domínio não encontrado ou não pertence ao usuário
        setLoading(false);
        navigate('/panel/domains', { replace: true });
        return;
      }

      if (!domainId) {
        // Se veio sem domainId, atualiza a URL para incluir o domínio principal
        navigate(`/panel/profile/${currentDomainId}`, { replace: true });
      }

      setDomainName(domainData.fqdn);

      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('domain_id', currentDomainId)
        .maybeSingle();

      profileData = result.data;
      profileError = result.error;

      if (!profileData && domainData) {
        console.log('Creating new profile for domain:', currentDomainId);

        const newProfile = {
          user_id: user?.id,
          domain_id: currentDomainId,
          subdomain: domainData.fqdn.split('.')[0],
          display_name: domainData.fqdn.split('.')[0],
          bio: '',
          is_public: true
        };

        try {
          const { data: created, error: createError } = await supabase
            .from('user_profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            // Se o erro for duplicata (23505 ou 409), tenta buscar o existente
            if (createError.code === '23505' || createError.message?.includes('duplicate')) {
              console.log('Profile already exists, fetching it...');
              const retryResult = await supabase
                .from('user_profiles')
                .select('*')
                .eq('domain_id', currentDomainId)
                .maybeSingle();

              if (retryResult.data) {
                profileData = retryResult.data;
                console.log('Profile found:', profileData);
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          } else {
            profileData = created;
            console.log('Profile created successfully:', profileData);
          }
        } catch (error) {
          console.error('Error in profile creation:', error);
          throw error;
        }
      }

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      if (profileData) {
        console.log('[ProfileManager] Loaded profile with avatar_url:', profileData.avatar_url);
        setProfile(profileData);

        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('plan_id, subscription_plans(plan_type)')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subscriptionData && subscriptionData.subscription_plans) {
          const planType = (subscriptionData.subscription_plans as any).plan_type;
          setIsEliteMember(planType === 'elite' || planType === 'supreme');
          setUserPlanName(planType === 'elite' ? 'Elite' : planType === 'supreme' ? 'Supreme' : 'Prime');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Por favor, selecione uma imagem válida.');
      setMessageType('error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('A imagem deve ter no máximo 5MB.');
      setMessageType('error');
      return;
    }

    setUploadingImage(true);
    setMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const newAvatarUrl = data.publicUrl;
      console.log('[ProfileManager] Uploading avatar:', newAvatarUrl);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      console.log('[ProfileManager] Avatar saved to database!');
      setProfile({ ...profile, avatar_url: newAvatarUrl });
      setMessageType('success');
      setMessage('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setMessageType('error');
      setMessage(error.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile) return;

    setUploadingImage(true);
    setMessage('');

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: '' });
      setMessageType('success');
      setMessage('Foto removida com sucesso!');
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      setMessageType('error');
      setMessage(error.message || 'Erro ao remover a foto');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage('');

    try {
      const bioValidation = validateBio(profile.bio || '');
      if (!bioValidation.valid) {
        setMessageType('error');
        setMessage(bioValidation.error || 'Erro na validação');
        setSaving(false);
        return;
      }

      const displayNameValidation = validateDisplayName(profile.display_name || '');
      if (!displayNameValidation.valid) {
        setMessageType('error');
        setMessage(displayNameValidation.error || 'Erro na validação');
        setSaving(false);
        return;
      }

      console.log('Updating profile with data:', {
        display_name: profile.display_name,
        background_type: profile.background_type,
        background_color: profile.background_color,
        background_gradient_start: profile.background_gradient_start,
        background_gradient_end: profile.background_gradient_end,
      });

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          is_public: profile.is_public,
          password_protected: profile.password_protected,
          allow_default_password: profile.allow_default_password,
          background_type: profile.background_type,
          background_color: profile.background_color,
          background_gradient_start: profile.background_gradient_start,
          background_gradient_end: profile.background_gradient_end,
          background_media_url: profile.background_media_url,
          background_overlay_opacity: profile.background_overlay_opacity,
          background_overlay_color: profile.background_overlay_color,
          custom_font: profile.custom_font,
          show_whatsapp_on_posts: (profile as any).show_whatsapp_on_posts || false,
        })
        .eq('id', profile.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);

      // If custom password was set, call the function to hash and save it
      if (customPassword && profile.password_protected) {
        const { error: pwError } = await supabase.rpc('set_profile_password', {
          profile_uuid: profile.id,
          password_text: customPassword
        });

        if (pwError) throw pwError;
        setCustomPassword('');
        setShowPasswordField(false);
      }

      setMessageType('success');
      setMessage('Perfil atualizado com sucesso!');

      // Reload profile data from database to ensure state is in sync
      if (data && data.length > 0) {
        setProfile(data[0]);
        console.log('Profile state refreshed from database');
      }

      // Redirect to public profile after 1.5 seconds
      setTimeout(() => {
        navigate(`/${profile.subdomain}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessageType('error');
      setMessage(error?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      </PanelLayout>
    );
  }

  if (!profile) {
    // Se não tem domainId, está carregando ou redirecionando
    if (!domainId) {
      return (
        <PanelLayout>
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus domínios...</p>
          </div>
        </PanelLayout>
      );
    }

    // Se tem domainId, mas não tem perfil, significa que algo deu errado
    if (domainId) {
      return (
        <PanelLayout>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-red-800 mb-4">
                Erro ao Carregar Perfil
              </h2>
              <p className="text-red-600 mb-6">
                Não foi possível carregar o perfil para este domínio. Por favor, tente novamente.
              </p>
              <button
                onClick={() => navigate('/panel/domains')}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Voltar para Domínios
              </button>
            </div>
          </div>
        </PanelLayout>
      );
    }

    // Admin can create profile without subscription (only for non-domain profiles)
    if (user?.role === 'admin') {
      return (
        <PanelLayout>
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1F1F1F] rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Criar Perfil de Admin
              </h2>
              <p className="text-[#9CA3AF] mb-6">
                Como administrador, você pode criar sua página diretamente.
              </p>
              <button
                onClick={async () => {
                  try {
                    const subdomain = user.email?.split('@')[0] || 'admin';
                    const { data, error } = await supabase
                      .from('user_profiles')
                      .insert({
                        user_id: user.id,
                        subdomain,
                        display_name: user.name || user.email?.split('@')[0] || 'Admin',
                        bio: 'Administrador do sistema',
                        avatar_url: '',
                        is_public: false
                      })
                      .select()
                      .single();

                    if (error) throw error;
                    setProfile(data);
                    setMessage('Perfil criado com sucesso!');
                  } catch (error: any) {
                    console.error('Error creating profile:', error);
                    setMessage(error.message || 'Erro ao criar perfil');
                  }
                }}
                className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8941F] transition-colors"
              >
                Criar Perfil
              </button>
            </div>
          </div>
        </PanelLayout>
      );
    }

    return (
      <PanelLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1F1F1F] rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Você ainda não tem um perfil
            </h2>
            <p className="text-[#9CA3AF] mb-6">
              Para criar um perfil, você precisa ter uma assinatura ativa.
            </p>
            <button
              onClick={() => navigate('/valores')}
              className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8941F] transition-colors"
            >
              Ver Planos
            </button>
          </div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <PageHeader
            title={domainName ? `Gerenciar Página - ${domainName.replace('.com.rich', '')}` : "Gerenciar Página"}
            subtitle={domainName ? `Personalize a página pública do domínio https://${domainName}` : "Personalize sua página pública"}
            badge={isEliteMember ? <EliteBadge size="md" /> : undefined}
            primaryAction={
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                  
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{showPreview ? 'Fechar Preview' : 'Preview Responsivo'}</span>
                </button>
                <button
                  onClick={() => {
                    // Navega na mesma aba - botão voltar do navegador funcionará
                    navigate(`/${profile.subdomain}`);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Ver Página Pública</span>
                </button>
              </div>
            }
          />

          {message && (
            <Toast
              message={message}
              type={messageType}
              onClose={() => setMessage('')}
            />
          )}

          {/* Responsive Preview Modal */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowPreview(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Preview Responsivo</h3>
                      <p className="text-sm text-slate-600">Veja como sua página aparece em diferentes dispositivos</p>
                    </div>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>

                  {/* Device Selector */}
                  <div className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        previewDevice === 'desktop'
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice('tablet')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        previewDevice === 'tablet'
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Tablet className="w-4 h-4" />
                      Tablet
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        previewDevice === 'mobile'
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </button>
                  </div>

                  {/* Preview Container */}
                  <div className="flex items-start justify-center p-4 sm:p-8 bg-slate-100 overflow-auto" style={{ height: 'calc(90vh - 180px)' }}>
                    <motion.div
                      key={`${previewDevice}-${profile?.background_type}-${profile?.background_media_url}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-lg shadow-2xl overflow-auto border-4 ${
                        previewDevice === 'desktop' ? 'w-full max-w-6xl h-full' :
                        previewDevice === 'tablet' ? 'w-[768px] border-slate-300' :
                        'w-[375px] border-slate-800'
                      }`}
                      style={{
                        height: previewDevice !== 'desktop' ? 'auto' : undefined,
                        maxHeight: previewDevice !== 'desktop' ? 'calc(90vh - 220px)' : undefined,
                        backgroundColor: profile?.background_color || '#0A0A0A'
                      }}
                    >
                      {/* Live Preview Content */}
                      <PublicProfileView
                        key={`${previewRefreshKey}-${profileLinks.length}-${JSON.stringify(profileLinks.map(l => l.style))}`}
                        profile={profile as any}
                        links={convertLinksForPreview()}
                        isEliteMember={isEliteMember}
                        activeTab="links"
                        onTabChange={() => {}}
                        isProfileOwner={false}
                        showControls={true}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs Navigation */}
          <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm mb-6" >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: 'profile', label: 'Perfil', icon: Settings },
              { id: 'background', label: 'Background', icon: Palette, dataTour: 'background-tab' },
              { id: 'links', label: 'Links', icon: LinkIcon },
              { id: 'social', label: 'Redes Sociais', icon: Share2 },
              { id: 'features', label: 'Funcionalidades', icon: ToggleLeft },
              ...(storeEnabled ? [{ id: 'store', label: 'Loja', icon: Store, active: true }] : []),
              ...(socialEnabled ? [{ id: 'community', label: 'Meu Feed Social', icon: MessageCircle, active: true }] : []),
              { id: 'analytics', label: 'Analytics', icon: BarChart3, dataTour: 'analytics-tab' },
            ].map((tab: any) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showActiveBadge = tab.active && !isActive;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold transition-all whitespace-nowrap text-sm shadow-sm relative ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white shadow-lg scale-105'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:shadow-md'
                  }`}
                  data-tour={tab.dataTour || undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {showActiveBadge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black shadow-sm">
                      Ativa
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4 sm:gap-6" >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Foto de Perfil</h3>

              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-slate-100 border-4 border-slate-500 shadow-lg">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                        <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    )}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="w-full space-y-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Enviando...' : 'Fazer Upload'}
                  </button>

                  {profile.avatar_url && (
                    <button
                      onClick={() => setShowRemoveAvatarModal(true)}
                      disabled={uploadingImage}
                      className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover Foto
                    </button>
                  )}

                  <p className="text-xs text-slate-400 text-center pt-2">
                    JPG, PNG ou GIF<br />Máximo 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-5" >
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={profile.is_public}
                    onChange={(e) => setProfile({ ...profile, is_public: e.target.checked })}
                    className="w-5 h-5 accent-blue-600 rounded mt-0.5 flex-shrink-0"
                  />
                  <label htmlFor="is_public" className="text-sm sm:text-base text-slate-800 font-medium">
                    Perfil Público
                  </label>
                </div>
                <p className="text-sm text-slate-600 ml-8">
                  {profile.is_public
                    ? 'Sua página está visível para todos na internet'
                    : 'Apenas você pode ver sua página'}
                </p>
              </div>

              {profile.is_public && (
                <div className="border-t border-slate-200 pt-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        id="password_protected"
                        checked={profile.password_protected || false}
                        onChange={(e) => setProfile({ ...profile, password_protected: e.target.checked })}
                        className="w-5 h-5 accent-blue-600 rounded"
                      />
                      <label htmlFor="password_protected" className="text-slate-800 font-medium">
                        Proteger com Senha
                      </label>
                    </div>
                    <p className="text-sm text-slate-600 ml-8">
                      Visitantes precisarão de uma senha para acessar sua página
                    </p>
                  </div>

                  {profile.password_protected && (
                    <div className="ml-8 space-y-4 bg-slate-50 p-4 rounded-lg">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            id="allow_default_password"
                            checked={profile.allow_default_password || false}
                            onChange={(e) => setProfile({ ...profile, allow_default_password: e.target.checked })}
                            className="w-4 h-4 accent-blue-600 rounded"
                          />
                          <label htmlFor="allow_default_password" className="text-sm text-slate-700 font-medium">
                            Permitir senha padrão da plataforma
                          </label>
                        </div>
                        <p className="text-xs text-slate-500 ml-7">
                          Os visitantes poderão usar a senha padrão "comrich2024"
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-slate-700 font-medium">
                            Senha Personalizada (opcional)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPasswordField(!showPasswordField)}
                            className="text-xs text-slate-900 hover:text-slate-900 font-medium"
                          >
                            {showPasswordField ? 'Cancelar' : 'Definir senha'}
                          </button>
                        </div>

                        {showPasswordField && (
                          <div className="space-y-2">
                            <input
                              type="password"
                              value={customPassword}
                              onChange={(e) => setCustomPassword(e.target.value)}
                              placeholder="Digite uma senha personalizada"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none"
                            />
                            <p className="text-xs text-slate-500">
                              Esta senha substituirá qualquer senha anterior que você tenha definido
                            </p>
                          </div>
                        )}

                        {!showPasswordField && profile.access_password && (
                          <p className="text-xs text-emerald-600 font-medium">
                            ✓ Senha personalizada configurada
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Informações Básicas</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome de Exibição *
                </label>
                <input
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => {
                    const newName = e.target.value;
                    if (newName.length <= CONTENT_LIMITS.DISPLAY_NAME.MAX_LENGTH) {
                      setProfile({ ...profile, display_name: newName });
                    }
                  }}
                  maxLength={CONTENT_LIMITS.DISPLAY_NAME.MAX_LENGTH}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-all"
                  placeholder="Seu nome"
                />
                <p className={`text-xs mt-1 ${(profile.display_name?.length || 0) >= 35 ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                  {profile.display_name?.length || 0}/{CONTENT_LIMITS.DISPLAY_NAME.MAX_LENGTH} caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg overflow-x-auto">
                  <span className="text-slate-500 text-sm whitespace-nowrap">com.rich/</span>
                  <span className="text-slate-800 font-medium text-sm break-all">{profile.subdomain}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">O username não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Biografia
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => {
                    const newBio = e.target.value;
                    if (newBio.length <= CONTENT_LIMITS.BIO.MAX_LENGTH) {
                      setProfile({ ...profile, bio: newBio });
                    }
                  }}
                  rows={4}
                  maxLength={CONTENT_LIMITS.BIO.MAX_LENGTH}
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none resize-none transition-all"
                  placeholder="Conte um pouco sobre você..."
                />
                <p className={`text-xs mt-1 ${(profile.bio?.length || 0) >= 180 ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                  {profile.bio?.length || 0}/{CONTENT_LIMITS.BIO.MAX_LENGTH} caracteres
                </p>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  WhatsApp para Contato nos Posts
                </h3>

                <PhoneInput
                  value={(profile as any).whatsapp_number || ''}
                  countryCode={whatsappCountryCode}
                  onChange={(phone, countryCode, prefix) => {
                    setWhatsappCountryCode(countryCode);
                    setProfile({ ...profile, whatsapp_number: phone } as any);
                  }}
                />

                <div className="flex items-center gap-3 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <input
                    type="checkbox"
                    id="show_whatsapp"
                    checked={(profile as any).show_whatsapp_on_posts || false}
                    onChange={(e) => setProfile({ ...profile, show_whatsapp_on_posts: e.target.checked } as any)}
                    className="w-5 h-5 text-green-600 border-green-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="show_whatsapp" className="text-sm text-slate-700 cursor-pointer flex-1">
                    <span className="font-medium">Mostrar botão WhatsApp nos meus posts</span>
                    <p className="text-xs text-slate-500 mt-1">
                      Quando ativado, um botão do WhatsApp aparecerá em todos os seus posts para contato direto
                    </p>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5 text-slate-700" />
                  Fonte do Perfil
                </h3>
                <GoogleFontSelector
                  currentFont={profile.custom_font || 'Inter'}
                  onFontChange={(font) => {
                    setProfile({ ...profile, custom_font: font });
                  }}
                />
              </div>

              <button
                onClick={handleProfileUpdate}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </motion.div>
          </div>
        </div>
        )}

          {/* Background Tab */}
          {activeTab === 'background' && profile && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">Background do Perfil</h2>
              <p className="text-slate-600">
                Personalize o fundo da sua página com cor sólida, gradiente, imagem ou vídeo
              </p>
            </div>

            <BackgroundEditor
              key={profile.background_media_url || 'no-media'}
              profile={profile}
              userId={user.id}
              onUpdate={async (updates) => {
                setProfile({ ...profile, ...updates });
              }}
              onDeleted={async () => {
                console.log('🔄 Recarregando profile após delete...');
                await loadProfile();
              }}
            />

            <div className="mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={handleProfileUpdate}
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Background
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}


          {/* Social Tab */}
          {activeTab === 'social' && profile && (
            <div>
              <SocialButtonsEditor profileId={profile.id} />
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
              
            >
              <LinkEditor
                profileId={profile.id}
                links={profileLinks}
                onLinksChange={() => setLinksRefresh(prev => prev + 1)}
              />
            </motion.div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
            >
              <FeatureControls
                profileId={profile.id}
                onUpdate={() => {
                  loadProfile();
                  loadFeatureStatus();
                  setPreviewRefreshKey(prev => prev + 1);
                }}
              />
            </motion.div>
          )}

          {/* Store Tab */}
          {activeTab === 'store' && profile && storeEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">Loja Virtual</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black shadow-sm">
                    Ativa
                  </span>
                </div>
                <p className="text-slate-600">Gerencie seus produtos e vendas da loja virtual</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Sua Loja Está Ativa!</h4>
                    <p className="text-slate-600 mb-4">Adicione produtos e comece a vender através do seu perfil</p>
                  </div>
                  <button
                    onClick={() => navigate('/panel/loja')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Store className="w-5 h-5" />
                    Gerenciar Produtos da Loja
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Community Tab */}
          {activeTab === 'community' && profile && socialEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Meu Feed Social</h3>
                <p className="text-slate-600">Gerencie seus posts e interaja com sua comunidade</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <VerticalFeed mode="my_posts" userId={user?.id} />
              </div>
            </motion.div>
          )}

          {/* Themes Tab */}
          {activeTab === 'themes' && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Temas Prontos</h3>
                <p className="text-slate-600">Escolha um tema profissional para sua página e personalize como desejar</p>
              </div>

              <button
                onClick={() => setShowThemeSelector(true)}
                className="w-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
              >
                <Palette className="w-5 h-5" />
                Explorar Temas
              </button>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-slate-600" />
                    Temas Gratuitos
                  </h4>
                  <p className="text-sm text-slate-600">Acesso a temas básicos e profissionais</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    Temas Premium
                  </h4>
                  <p className="text-sm text-slate-600">
                    {isEliteMember
                      ? 'Você tem acesso a todos os temas premium!'
                      : 'Disponível para membros Elite/Supreme'}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Após aplicar um tema, você pode personalizá-lo na aba Background
                </p>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Fonte Personalizada</h3>
                <GoogleFontSelector
                  currentFont={profile.custom_font || 'Inter'}
                  onFontChange={async (font) => {
                    try {
                      const { error } = await supabase
                        .from('user_profiles')
                        .update({ custom_font: font })
                        .eq('id', profile.id);

                      if (error) throw error;

                      setProfile({ ...profile, custom_font: font });
                      setMessage('Fonte atualizada com sucesso!');
                      setMessageType('success');
                    } catch (error: any) {
                      console.error('Error updating font:', error);
                      setMessage('Erro ao atualizar fonte');
                      setMessageType('error');
                    }
                  }}
                />
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <CustomCSSEditor
                  currentCSS={profile.custom_css || ''}
                  isEliteMember={isEliteMember}
                  onSave={async (css) => {
                    try {
                      const { error } = await supabase
                        .from('user_profiles')
                        .update({ custom_css: css })
                        .eq('id', profile.id);

                      if (error) throw error;

                      setProfile({ ...profile, custom_css: css });
                      setMessage('CSS personalizado salvo com sucesso!');
                      setMessageType('success');
                    } catch (error: any) {
                      console.error('Error updating CSS:', error);
                      throw error;
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && profile && (
            <div>
              <AnalyticsDashboard
                profileId={profile.id}
                totalViews={0}
              />
            </div>
          )}
        </div>
      </div>

      {/* Theme Selector Modal */}
      {showThemeSelector && profile && (
        <ThemeTemplateSelector
          profileId={profile.id}
          isEliteMember={isEliteMember}
          onThemeApplied={(template) => {
            setProfile({
              ...profile,
              background_type: template.background_type,
              background_color: template.background_type === 'color' ? template.background_value.value : undefined,
              background_gradient_start: template.background_type === 'gradient' ? template.background_value.from : undefined,
              background_gradient_end: template.background_type === 'gradient' ? template.background_value.to : undefined,
            });
            setMessage('Tema aplicado com sucesso!');
            setMessageType('success');
          }}
          onClose={() => setShowThemeSelector(false)}
        />
      )}

      {/* Remove Avatar Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveAvatarModal}
        onClose={() => setShowRemoveAvatarModal(false)}
        onConfirm={handleRemoveAvatar}
        title="Remover Foto de Perfil"
        message="Tem certeza que deseja remover sua foto de perfil? Esta ação não pode ser desfeita."
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </PanelLayout>
  );
}
