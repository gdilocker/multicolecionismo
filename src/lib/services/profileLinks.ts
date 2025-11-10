import { supabase } from '../supabase';

export interface LinkStyle {
  bgColor: string;
  textColor: string;
  borderColor: string | null;
  radius: number;
  shadow: boolean;
  opacity: number;
}

export interface ProfileLink {
  id: string;
  user_id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string;
  style: LinkStyle;
  is_active: boolean;
  sort_order: number;
  clicks: number;
  created_at: string;
  updated_at: string;
  security_status?: 'safe' | 'suspicious' | 'malicious' | 'pending' | 'under_review';
  is_blocked?: boolean;
  block_reason?: string;
  last_security_check?: string;
}

export interface CreateLinkInput {
  profile_id: string;
  title: string;
  url: string;
  icon?: string;
  style?: Partial<LinkStyle>;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateLinkInput {
  title?: string;
  url?: string;
  icon?: string;
  style?: Partial<LinkStyle>;
  is_active?: boolean;
  sort_order?: number;
}

const DEFAULT_STYLE: LinkStyle = {
  bgColor: '#3B82F6',
  textColor: '#FFFFFF',
  borderColor: null,
  radius: 16,
  shadow: true,
  opacity: 1.0,
};

export const profileLinksService = {
  async getLinks(profileId: string): Promise<ProfileLink[]> {
    const { data, error } = await supabase
      .from('profile_links')
      .select('*')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getPublicLinks(profileId: string): Promise<ProfileLink[]> {
    const { data, error } = await supabase
      .from('profile_links')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .eq('is_blocked', false)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createLink(input: CreateLinkInput): Promise<ProfileLink> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const maxOrder = await this.getMaxSortOrder(input.profile_id);

    const style = { ...DEFAULT_STYLE, ...input.style };

    const { data, error } = await supabase
      .from('profile_links')
      .insert({
        user_id: user.user.id,
        profile_id: input.profile_id,
        title: input.title,
        url: input.url,
        icon: input.icon || 'link',
        style,
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLink(linkId: string, updates: UpdateLinkInput): Promise<ProfileLink> {
    const { data: existingLink, error: fetchError } = await supabase
      .from('profile_links')
      .select('style')
      .eq('id', linkId)
      .single();

    if (fetchError) throw fetchError;

    const newStyle = updates.style
      ? { ...existingLink.style, ...updates.style }
      : existingLink.style;

    const { data, error } = await supabase
      .from('profile_links')
      .update({
        ...updates,
        style: newStyle,
      })
      .eq('id', linkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('profile_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;
  },

  async duplicateLink(linkId: string): Promise<ProfileLink> {
    const { data: original, error: fetchError } = await supabase
      .from('profile_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (fetchError) throw fetchError;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const maxOrder = await this.getMaxSortOrder(original.profile_id);

    const { data, error } = await supabase
      .from('profile_links')
      .insert({
        user_id: user.user.id,
        profile_id: original.profile_id,
        title: `${original.title} (cópia)`,
        url: original.url,
        icon: original.icon,
        style: original.style,
        is_active: original.is_active,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reorderLinks(profileId: string, linkIds: string[]): Promise<void> {
    const updates = linkIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('profile_links')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('profile_id', profileId);

      if (error) throw error;
    }
  },

  async incrementClicks(linkId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_link_clicks', {
      link_id: linkId,
    });

    if (error) throw error;
  },

  async getMaxSortOrder(profileId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profile_links')
      .select('sort_order')
      .eq('profile_id', profileId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.sort_order ?? -1;
  },

  async verifyLinkSecurity(linkId: string, url: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiUrl = `${supabaseUrl}/functions/v1/verify-link-security`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkId, url, checkType: 'automatic' })
    });

    if (!response.ok) {
      console.error('Failed to verify link security:', await response.text());
    }
  },

  async requestManualReview(linkId: string, message?: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('request_link_review', {
      p_link_id: linkId,
      p_user_message: message
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  },
};
