export interface DNSApplyParams {
  fqdn: string;
  mxHost: string;
  spfInclude: string;
  dkimTxt?: {
    selector: string;
    value: string;
  };
  dmarcPolicy?: string;
}

export interface DNSCheckResult {
  [key: string]: {
    ok: boolean;
    value?: string;
    error?: string;
  };
}

export interface CloudflareDNS {
  applyDefaults(params: DNSApplyParams): Promise<{ ok: boolean }>;
  checkDNS(fqdn: string): Promise<DNSCheckResult>;
}

export function createCloudflare(): CloudflareDNS {
  return {
    async applyDefaults(params: DNSApplyParams): Promise<{ ok: boolean }> {
      console.log(`[MOCK] Applying DNS defaults for: ${params.fqdn}`);
      console.log(`  MX: ${params.mxHost}`);
      console.log(`  SPF: v=spf1 include:${params.spfInclude} ~all`);
      if (params.dkimTxt) {
        console.log(`  DKIM: ${params.dkimTxt.selector}._domainkey = ${params.dkimTxt.value}`);
      }
      if (params.dmarcPolicy) {
        console.log(`  DMARC: _dmarc = ${params.dmarcPolicy}`);
      }
      return { ok: true };
    },

    async checkDNS(fqdn: string): Promise<DNSCheckResult> {
      console.log(`[MOCK] Checking DNS for: ${fqdn}`);
      return {
        MX: { ok: true, value: 'mail..com.rich' },
        SPF: { ok: true, value: 'v=spf1 include:_spf..com.rich ~all' },
        DKIM: { ok: true, value: 'v=DKIM1; k=rsa; p=MOCK_PUBLIC_KEY' },
        DMARC: { ok: true, value: 'v=DMARC1; p=none; pct=100' }
      };
    }
  };
}
