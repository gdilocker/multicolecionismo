import { supabase } from '../supabase';

export const dbQueries = {
  async getCustomerId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    return data?.id || null;
  },

  async createDomain(params: {
    customerId: string;
    fqdn: string;
    registrarStatus?: string;
    expiresAt?: string;
    dkimSelector?: string;
    dkimPublic?: string;
  }) {
    const { data, error } = await supabase
      .from('domains')
      .insert({
        customer_id: params.customerId,
        fqdn: params.fqdn,
        registrar_status: params.registrarStatus || 'active',
        expires_at: params.expiresAt,
        dkim_selector: params.dkimSelector,
        dkim_public: params.dkimPublic
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDomains(customerId: string) {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDomainById(domainId: string) {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domainId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createMailDomain(params: {
    domainId: string;
    providerRef?: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('mail_domains')
      .insert({
        domain_id: params.domainId,
        provider_ref: params.providerRef,
        status: params.status || 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMailDomainByDomainId(domainId: string) {
    const { data, error } = await supabase
      .from('mail_domains')
      .select('*')
      .eq('domain_id', domainId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createMailbox(params: {
    mailDomainId: string;
    localpart: string;
    quotaMb?: number;
    providerRef?: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('mailboxes')
      .insert({
        mail_domain_id: params.mailDomainId,
        localpart: params.localpart,
        quota_mb: params.quotaMb || 5120,
        provider_ref: params.providerRef,
        status: params.status || 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMailboxes(customerId: string) {
    const { data, error } = await supabase
      .from('mailboxes')
      .select(`
        *,
        mail_domains!inner(
          domain_id,
          domains!inner(
            fqdn,
            customer_id
          )
        )
      `)
      .eq('mail_domains.domains.customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteMailbox(mailboxId: string) {
    const { error } = await supabase
      .from('mailboxes')
      .delete()
      .eq('id', mailboxId);

    if (error) throw error;
  },

  async createAlias(params: {
    mailDomainId: string;
    source: string;
    destination: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('aliases')
      .insert({
        mail_domain_id: params.mailDomainId,
        source: params.source,
        destination: params.destination,
        status: params.status || 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAliases(customerId: string) {
    const { data, error } = await supabase
      .from('aliases')
      .select(`
        *,
        mail_domains!inner(
          domain_id,
          domains!inner(
            fqdn,
            customer_id
          )
        )
      `)
      .eq('mail_domains.domains.customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteAlias(aliasId: string) {
    const { error } = await supabase
      .from('aliases')
      .delete()
      .eq('id', aliasId);

    if (error) throw error;
  },

  async createDNSRecord(params: {
    domainId: string;
    type: string;
    name: string;
    value: string;
    ttl?: number;
    proxied?: boolean;
  }) {
    const { data, error } = await supabase
      .from('dns_records')
      .insert({
        domain_id: params.domainId,
        type: params.type,
        name: params.name,
        value: params.value,
        ttl: params.ttl || 300,
        proxied: params.proxied || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDNSRecords(domainId: string) {
    const { data, error } = await supabase
      .from('dns_records')
      .select('*')
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createOrder(params: {
    customerId: string;
    fqdn: string;
    years: number;
    plan: string;
    totalCents: number;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: params.customerId,
        fqdn: params.fqdn,
        years: params.years,
        plan: params.plan,
        total_cents: params.totalCents,
        status: params.status || 'completed'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMailbox(mailboxId: string, params: { quotaMb?: number }) {
    const { error } = await supabase
      .from('mailboxes')
      .update({
        quota_mb: params.quotaMb
      })
      .eq('id', mailboxId);

    if (error) throw error;
  },

  async getMailboxByEmail(email: string) {
    const [localpart, fqdn] = email.split('@');

    const { data, error } = await supabase
      .from('mailboxes')
      .select(`
        *,
        mail_domains!inner(
          domain_id,
          domains!inner(
            fqdn
          )
        )
      `)
      .eq('localpart', localpart)
      .eq('mail_domains.domains.fqdn', fqdn)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
