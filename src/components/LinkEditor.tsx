import { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertTriangle, ExternalLink, Copy, GripVertical, Trash2, Plus, Eye, Save } from 'lucide-react';
import { ProfileLink, LinkStyle, profileLinksService } from '../lib/services/profileLinks';
import { hasGoodContrast, suggestTextColor } from '../lib/utils/contrastChecker';
import * as LucideIcons from 'lucide-react';
import LinkSecurityStatus from './LinkSecurityStatus';

interface LinkEditorProps {
  profileId: string;
  links: ProfileLink[];
  onLinksChange: () => void;
}

const POPULAR_ICONS = [
  { value: 'link', label: 'Link Padrão' },
  { value: 'external-link', label: 'Link Externo' },
  { value: 'mail', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'message-circle', label: 'Mensagem' },
  { value: 'globe', label: 'Website' },
  { value: 'shopping-cart', label: 'Loja/Carrinho' },
  { value: 'shopping-bag', label: 'Compras' },
  { value: 'heart', label: 'Favorito' },
  { value: 'star', label: 'Destaque' },
  { value: 'music', label: 'Música' },
  { value: 'video', label: 'Vídeo' },
  { value: 'camera', label: 'Câmera/Foto' },
  { value: 'book', label: 'Livro/Blog' },
  { value: 'file-text', label: 'Documento' },
  { value: 'calendar', label: 'Agenda/Calendário' },
  { value: 'map-pin', label: 'Localização' },
  { value: 'gift', label: 'Presente/Oferta' },
  { value: 'briefcase', label: 'Trabalho/Portfólio' },
  { value: 'bookmark', label: 'Marcador' },
  { value: 'award', label: 'Prêmio/Conquista' },
  { value: 'zap', label: 'Energia/Ação' },
];

export default function LinkEditor({ profileId, links, onLinksChange }: LinkEditorProps) {
  const [editingLink, setEditingLink] = useState<ProfileLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastStyleUsed, setLastStyleUsed] = useState<LinkStyle | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; linkId: string | null }>({ show: false, linkId: null });
  const [localLinks, setLocalLinks] = useState<ProfileLink[]>(links);

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: 'link',
    style: {
      bgColor: '#3B82F6',
      textColor: '#FFFFFF',
      borderColor: null as string | null,
      radius: 1,
      shadow: true,
      opacity: 0.2,
    },
    is_active: true,
  });

  useEffect(() => {
    setLocalLinks(links);
  }, [links]);

  useEffect(() => {
    if (editingLink) {
      setFormData({
        title: editingLink.title,
        url: editingLink.url,
        icon: editingLink.icon,
        style: editingLink.style,
        is_active: editingLink.is_active,
      });
    } else if (isCreating) {
      const baseStyle = lastStyleUsed || {
        bgColor: '#3B82F6',
        textColor: '#FFFFFF',
        borderColor: null,
        radius: 1,
        shadow: true,
        opacity: 0.2,
      };
      setFormData({
        title: '',
        url: '',
        icon: 'link',
        style: baseStyle,
        is_active: true,
      });
    }
  }, [editingLink, isCreating, lastStyleUsed]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const normalizeUrl = (url: string, icon: string): string => {
    const trimmedUrl = url.trim();

    // Email
    if (icon === 'mail' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedUrl)) {
      if (!trimmedUrl.startsWith('mailto:')) {
        return `mailto:${trimmedUrl}`;
      }
      return trimmedUrl;
    }

    // Telefone (detecta números com +, dígitos e espaços/hífens)
    if (icon === 'phone' || /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(trimmedUrl.replace(/[\s\-\(\)]/g, ''))) {
      const phoneNumber = trimmedUrl.replace(/[\s\-\(\)]/g, '');
      if (!trimmedUrl.startsWith('tel:')) {
        return `tel:${phoneNumber}`;
      }
      return trimmedUrl;
    }

    // SMS/Mensagem
    if (icon === 'message-circle') {
      const phoneNumber = trimmedUrl.replace(/[\s\-\(\)]/g, '');
      if (!trimmedUrl.startsWith('sms:') && !trimmedUrl.startsWith('https://wa.me/')) {
        // Se começar com +55 ou número brasileiro, assume WhatsApp
        if (phoneNumber.match(/^\+?55\d{10,11}$/)) {
          const cleanNumber = phoneNumber.replace(/\+/g, '');
          return `https://wa.me/${cleanNumber}`;
        }
        return `sms:${phoneNumber}`;
      }
      return trimmedUrl;
    }

    // Localização
    if (icon === 'map-pin') {
      if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('geo:')) {
        return `https://maps.google.com/?q=${encodeURIComponent(trimmedUrl)}`;
      }
      return trimmedUrl;
    }

    // URLs normais - adiciona https:// se não tiver protocolo
    if (!trimmedUrl.match(/^[a-zA-Z]+:\/\//)) {
      return `https://${trimmedUrl}`;
    }

    return trimmedUrl;
  };

  const validateUrl = (url: string, icon: string): boolean => {
    const trimmedUrl = url.trim();

    // Email
    if (icon === 'mail' || trimmedUrl.startsWith('mailto:')) {
      const email = trimmedUrl.replace('mailto:', '');
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Telefone
    if (icon === 'phone' || trimmedUrl.startsWith('tel:')) {
      const phone = trimmedUrl.replace('tel:', '').replace(/[\s\-\(\)]/g, '');
      return phone.length >= 8;
    }

    // SMS/WhatsApp
    if (icon === 'message-circle' || trimmedUrl.startsWith('sms:') || trimmedUrl.includes('wa.me')) {
      return trimmedUrl.length > 5;
    }

    // Localização
    if (icon === 'map-pin') {
      return trimmedUrl.length > 0;
    }

    // URLs normais
    try {
      const urlToValidate = trimmedUrl.match(/^[a-zA-Z]+:\/\//) ? trimmedUrl : `https://${trimmedUrl}`;
      new URL(urlToValidate);
      return true;
    } catch {
      return false;
    }
  };

  const contrastCheck = hasGoodContrast(
    formData.style.bgColor,
    formData.style.textColor,
    formData.style.opacity
  );

  // REMOVIDO: Sem autosave, apenas salvamento manual via botão

  const handleDuplicate = (link: ProfileLink) => {
    // Verifica limite de 10 links
    if (links.length >= 10) {
      showToast('Limite de 10 links atingido.', 'error');
      return;
    }

    // Abre formulário pré-preenchido com dados do link original
    setIsCreating(true);
    setEditingLink(null);
    setFormData({
      title: `${link.title} (cópia)`,
      url: link.url,
      icon: link.icon,
      style: link.style,
      is_active: link.is_active,
    });
  };

  const handleSetAsDefault = (link: ProfileLink) => {
    setLastStyleUsed(link.style);
    showToast('Estilo definido como padrão!', 'success');
  };

  const handleSaveManual = async () => {
    if (!formData.title || !formData.url || !formData.icon) {
      showToast('Preencha título, ícone e URL', 'error');
      return;
    }

    // Validar URL
    if (!validateUrl(formData.url, formData.icon)) {
      showToast('URL inválida. Verifique o formato.', 'error');
      return;
    }

    // Verifica limite de 10 links ao criar novo
    if (isCreating && links.length >= 10) {
      showToast('Limite de 10 links atingido.', 'error');
      return;
    }

    // Normalizar URL antes de salvar
    const normalizedUrl = normalizeUrl(formData.url, formData.icon);

    try {
      setSaveStatus('saving');
      let savedLinkId: string | undefined;

      if (editingLink) {
        await profileLinksService.updateLink(editingLink.id, {
          title: formData.title,
          url: normalizedUrl,
          icon: formData.icon,
          style: formData.style,
          is_active: formData.is_active,
        });
        savedLinkId = editingLink.id;
        showToast('Link atualizado com sucesso!', 'success');
        setEditingLink(null);
      } else if (isCreating) {
        const newLink = await profileLinksService.createLink({
          profile_id: profileId,
          title: formData.title,
          url: normalizedUrl,
          icon: formData.icon,
          style: formData.style,
          is_active: formData.is_active,
        });
        savedLinkId = newLink.id;
        setLastStyleUsed(formData.style);
        showToast('Link criado com sucesso!', 'success');
        setIsCreating(false);
      }

      if (savedLinkId) {
        profileLinksService.verifyLinkSecurity(savedLinkId, normalizedUrl).catch(err => {
          console.error('Falha na verificação de segurança:', err);
        });
      }

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        setEditingLink(null);
        setIsCreating(false);
      }, 800);
      onLinksChange();
    } catch (error: any) {
      console.error('Failed to save link:', error);
      if (error?.message?.includes('limit') || error?.code === '409') {
        showToast('Limite de 10 links atingido.', 'error');
      } else {
        showToast('Erro ao salvar link', 'error');
      }
      setSaveStatus('idle');
    }
  };

  const handleDeleteClick = (linkId: string) => {
    setDeleteConfirmModal({ show: true, linkId });
  };

  const handleDeleteConfirm = async () => {
    const linkId = deleteConfirmModal.linkId;
    if (!linkId) return;

    try {
      await profileLinksService.deleteLink(linkId);
      if (editingLink?.id === linkId) {
        setEditingLink(null);
      }
      showToast('Link excluído com sucesso!', 'success');
      onLinksChange();
    } catch (error) {
      console.error('Failed to delete link:', error);
      showToast('Erro ao excluir link', 'error');
    } finally {
      setDeleteConfirmModal({ show: false, linkId: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmModal({ show: false, linkId: null });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLinks = [...localLinks];
    const draggedLink = newLinks[draggedIndex];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedLink);

    setLocalLinks(newLinks);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    try {
      const linkIds = localLinks.map((l) => l.id);
      await profileLinksService.reorderLinks(profileId, linkIds);
      setDraggedIndex(null);
      showToast('Ordem dos links atualizada!', 'success');
      onLinksChange();
    } catch (error) {
      console.error('Failed to reorder links:', error);
      showToast('Erro ao atualizar ordem dos links', 'error');
      setDraggedIndex(null);
      setLocalLinks(links); // Reverte para ordem original em caso de erro
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-./g, (x) => x[1].toUpperCase())];
    return IconComponent || LucideIcons.Link;
  };

  const renderPreview = () => {
    const Icon = getIconComponent(formData.icon);
    const bgColorWithOpacity = `${formData.style.bgColor}${Math.round(formData.style.opacity * 255).toString(16).padStart(2, '0')}`;

    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border-2 border-slate-200">
        <p className="text-slate-700 text-sm font-medium mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview em Tempo Real
        </p>
        <button
          style={{
            backgroundColor: bgColorWithOpacity,
            color: formData.style.textColor,
            borderRadius: `${formData.style.radius}px`,
            borderColor: formData.style.borderColor || 'transparent',
            borderWidth: formData.style.borderColor ? '2px' : '0',
            borderStyle: 'solid',
            boxShadow: formData.style.shadow ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
          }}
          className="w-full px-6 py-4 font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span>{formData.title || 'Título do Link'}</span>
          </div>
          <ExternalLink className="w-4 h-4 opacity-70" />
        </button>

        {!contrastCheck.isGood && (
          <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-semibold mb-1">Contraste Baixo</p>
              <p className="opacity-90">
                Ajuste a cor ou opacidade para melhor legibilidade.
                Contraste atual: {contrastCheck.ratio.toFixed(2)} (mínimo: {contrastCheck.minRequired})
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-down`}>
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Links Personalizados</h3>
          <p className="text-sm text-slate-600 mt-1">
            Crie botões personalizados para suas redes sociais e sites
          </p>
        </div>
        <button
          onClick={() => {
            if (links.length >= 10) {
              showToast('Limite de 10 links atingido.', 'error');
              return;
            }
            setIsCreating(true);
            setEditingLink(null);
          }}
          disabled={links.length >= 10}
          className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all shadow-lg ${
            links.length >= 10
              ? 'bg-slate-300 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black hover:scale-105'
          }`}
        >
          <Plus className="w-5 h-5" />
          Adicionar Link
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">Seus Links ({localLinks.length}/10)</h4>
            </div>

            {localLinks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm">Nenhum link criado ainda</p>
                <p className="text-slate-400 text-xs mt-1">Clique em "Adicionar Link" para começar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {localLinks.map((link, index) => {
                  const Icon = getIconComponent(link.icon);
                  return (
                    <div
                      key={link.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group bg-slate-50 hover:bg-slate-100 rounded-xl p-4 border-2 transition-all cursor-move ${
                        editingLink?.id === link.id ? 'border-[#D4AF37]' : 'border-transparent'
                      } ${draggedIndex === index ? 'opacity-50 scale-95' : ''} hover:shadow-md`}
                      onClick={() => {
                        setEditingLink(link);
                        setIsCreating(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-slate-400" />
                        <Icon className="w-5 h-5 text-slate-600" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900 truncate">{link.title}</p>
                            {link.security_status && (
                              <LinkSecurityStatus
                                linkId={link.id}
                                status={link.security_status}
                                isBlocked={link.is_blocked}
                              />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{link.url}</p>
                          {link.is_blocked && link.block_reason && (
                            <p className="text-xs text-red-600 mt-1">{link.block_reason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAsDefault(link);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Usar como padrão de estilo"
                          >
                            <Eye className="w-4 h-4 text-[#D4AF37]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(link);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(link.id);
                            }}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            link.is_active ? 'bg-green-500' : 'bg-slate-300'
                          }`}
                          title={link.is_active ? 'Ativo' : 'Inativo'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {(editingLink || isCreating) && (
          <div className="space-y-4">
            {renderPreview()}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-slate-900">
                  {isCreating ? 'Novo Link' : 'Editar Link'}
                </h4>
                <div className="flex items-center gap-3">
                  {saveStatus === 'saving' && (
                    <span className="text-xs text-slate-500">Salvando...</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Salvo
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingLink(null);
                      setIsCreating(false);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, 60) })}
                    placeholder="Ex: Meu Portfólio, Meu Email, Meu WhatsApp"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none"
                    maxLength={60}
                  />
                  <p className="text-xs text-slate-500 mt-1">{formData.title.length}/60 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ícone *
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none"
                    required
                  >
                    {POPULAR_ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder={
                      formData.icon === 'mail' ? 'usuario@exemplo.com' :
                      formData.icon === 'phone' ? '+5511999999999 ou 11999999999' :
                      formData.icon === 'message-circle' ? '+5511999999999 (WhatsApp) ou número SMS' :
                      formData.icon === 'map-pin' ? 'Rua Exemplo, 123, São Paulo - SP' :
                      'https://seusite.com'
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.icon === 'mail' && '📧 Digite apenas o email (mailto: será adicionado automaticamente)'}
                    {formData.icon === 'phone' && '📞 Digite o número (tel: será adicionado automaticamente)'}
                    {formData.icon === 'message-circle' && '💬 Número brasileiro abre WhatsApp, outros abrem SMS'}
                    {formData.icon === 'map-pin' && '📍 Digite o endereço (Google Maps será usado)'}
                    {!['mail', 'phone', 'message-circle', 'map-pin'].includes(formData.icon) && '🔗 Digite a URL completa ou sem https:// (será adicionado automaticamente)'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cor de Fundo
                    </label>
                    <input
                      type="color"
                      value={formData.style.bgColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, bgColor: e.target.value },
                        })
                      }
                      className="w-full h-12 rounded-xl border border-slate-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cor do Texto
                    </label>
                    <input
                      type="color"
                      value={formData.style.textColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, textColor: e.target.value },
                        })
                      }
                      className="w-full h-12 rounded-xl border border-slate-200 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Opacidade: {Math.round(formData.style.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={formData.style.opacity * 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        style: { ...formData.style, opacity: parseInt(e.target.value) / 100 },
                      })
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Raio das Bordas: {formData.style.radius}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="32"
                    value={formData.style.radius}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        style: { ...formData.style, radius: parseInt(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.style.shadow}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          style: { ...formData.style, shadow: e.target.checked },
                        })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-slate-700">Sombra</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-sm font-medium text-slate-700">Ativo</span>
                  </label>
                </div>

                {/* Botão Salvar */}
                <div className="pt-6 border-t border-slate-200">
                  <button
                    onClick={handleSaveManual}
                    disabled={!formData.title || !formData.url || saveStatus === 'saving'}
                    className={`w-full px-6 py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                      !formData.title || !formData.url || saveStatus === 'saving'
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>{editingLink ? 'Atualizar Link' : 'Salvar Link'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Excluir Link</h3>
                <p className="text-sm text-slate-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-slate-700 mb-6">
              Tem certeza que deseja excluir este link?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
