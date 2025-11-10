import { supabase } from '../supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export const api = {
  availability: async (fqdn: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/domains/availability?fqdn=${encodeURIComponent(fqdn)}`,
      { headers }
    );
    return response.json();
  },

  register: async (data: { fqdn: string; years: number }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/domains/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  dnsApply: async (data: {
    fqdn: string;
    mxHost: string;
    spfInclude: string;
    dkimTxt?: { selector: string; value: string };
    dmarcPolicy?: string;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/dns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  dnsCheck: async (fqdn: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/dns?fqdn=${encodeURIComponent(fqdn)}`,
      { headers }
    );
    return response.json();
  },

  emailCreateDomain: async (fqdn: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email/domains`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fqdn })
    });
    return response.json();
  },

  emailCreateMailbox: async (params: {
    fqdn: string;
    localpart: string;
    quota_mb?: number;
    password: string;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email/mailboxes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return response.json();
  },

  emailCreateAlias: async (params: {
    fqdn: string;
    source: string;
    destination: string;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email/aliases`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return response.json();
  },

  provisionDomain: async (domainId: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'provision_domain', domain_id: domainId })
    });
    return response.json();
  },

  processPendingDomains: async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'process_pending' })
    });
    return response.json();
  },

  emailResetPassword: async (params: {
    fqdn: string;
    localpart: string;
    newPassword: string;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email/mailboxes/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return response.json();
  },

  emailUpdateQuota: async (params: {
    fqdn: string;
    localpart: string;
    quotaMb: number;
  }) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email/mailboxes/update-quota`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    return response.json();
  }
};
