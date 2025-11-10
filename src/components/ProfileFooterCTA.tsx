import { ExternalLink } from 'lucide-react';

interface ProfileFooterCTAProps {
  affiliateCode?: string;
  isAffiliate?: boolean;
}

const DEFAULT_SIGNUP_URL = '/register';

function buildAffiliateLink(code?: string): string {
  if (!code) return DEFAULT_SIGNUP_URL;

  const params = new URLSearchParams({
    ref: code,
    utm_source: 'profile_footer',
    utm_medium: 'referral',
    utm_campaign: 'affiliate'
  });

  return `${DEFAULT_SIGNUP_URL}?${params.toString()}`;
}

export function ProfileFooterCTA({ affiliateCode, isAffiliate }: ProfileFooterCTAProps) {
  const href = isAffiliate && affiliateCode
    ? buildAffiliateLink(affiliateCode)
    : DEFAULT_SIGNUP_URL;

  return (
    <div className="text-center py-6 border-t border-white/5">
      <a
        href={href}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm font-medium transition-colors group"
      >
        <span>Crie sua página .com.rich</span>
        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </div>
  );
}
