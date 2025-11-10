export interface NamecheapAvailabilityResult {
  available: boolean;
  suggestions?: string[];
}

export interface NamecheapRegisterResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export interface Namecheap {
  checkAvailability(fqdn: string): Promise<NamecheapAvailabilityResult>;
  registerDomain(fqdn: string, years: number): Promise<NamecheapRegisterResult>;
}

export function createNamecheap(): Namecheap {
  return {
    async checkAvailability(fqdn: string): Promise<NamecheapAvailabilityResult> {
      const isEmailDomain = fqdn.endsWith('.email');
      return {
        available: isEmailDomain,
        suggestions: isEmailDomain ? [] : [`${fqdn.split('.')[0]}.email`]
      };
    },

    async registerDomain(fqdn: string, years: number): Promise<NamecheapRegisterResult> {
      console.log(`[MOCK] Registering domain: ${fqdn} for ${years} year(s)`);
      return {
        success: true,
        orderId: `mock-order-${Date.now()}`
      };
    }
  };
}
