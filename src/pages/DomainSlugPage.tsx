import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PremiumLanding from './PremiumLanding';
import PublicProfile from './PublicProfile';
import ProtectedBrandAccess from '../components/ProtectedBrandAccess';

type DomainStatus = 'UNAVAILABLE' | 'AVAILABLE';

interface DomainCheckResult {
  status: DomainStatus;
  fqdn: string;
  isAvailable: boolean;
  isPremium: boolean;
  planRequired: 'ELITE' | 'STANDARD_OR_ELITE' | null;
  price: { monthly: number; currency: string } | null;
  message: string;
  suggestions?: string[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Normalizar slug para formato válido
function normalizeSlug(slug: string): string | null {
  if (!slug) return null;

  const normalized = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');

  if (!normalized || normalized.length < 1) return null;
  if (!/^[a-z0-9]/.test(normalized)) return null; // Deve começar com letra ou número

  return normalized;
}

async function checkDomainAPI(fqdn: string): Promise<DomainCheckResult> {
  const apiUrl = `${SUPABASE_URL}/functions/v1/domains`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'check',
      fqdn: fqdn
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

const DomainSlugPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainData, setDomainData] = useState<DomainCheckResult | null>(null);
  const [isProtectedBrand, setIsProtectedBrand] = useState(false);
  const [protectedBrandData, setProtectedBrandData] = useState<{
    domain_name: string;
    brand_display_name: string;
    description?: string;
    access_password: string;
  } | null>(null);
  const [brandAuthenticated, setBrandAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    async function fetchDomainStatus() {
      if (!slug) {
        if (isMounted) {
          setError('Slug inválido');
          setLoading(false);
        }
        return;
      }

      const normalizedSlug = normalizeSlug(slug);

      if (!normalizedSlug) {
        if (isMounted) {
          setError('Formato de domínio inválido');
          setLoading(false);
        }
        return;
      }

      // Safety timeout - 5 seconds max
      timeoutId = setTimeout(() => {
        console.error('[DomainSlugPage] TIMEOUT! Force rendering profile');
        if (isMounted) {
          setDomainData({
            status: 'UNAVAILABLE',
            fqdn: `${normalizedSlug}.com.rich`,
            isAvailable: false,
            isPremium: false,
            planRequired: null,
            price: null,
            message: 'Domínio registrado'
          });
          setLoading(false);
        }
      }, 5000);

      try {
        console.log('[DomainSlugPage] Starting fetch for:', normalizedSlug);

        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // FIRST: Check if this is a protected brand
        console.log('[DomainSlugPage] Checking protected brands...');
        const { data: brandData, error: brandError } = await supabase
          .from('protected_brands')
          .select('*')
          .eq('domain_name', normalizedSlug)
          .eq('is_active', true)
          .maybeSingle();

        console.log('[DomainSlugPage] Brand check result:', { brandData, brandError });

        if (brandData && !brandError && !brandAuthenticated) {
          // This is a protected brand - show protection screen
          console.log('[DomainSlugPage] Protected brand detected, showing access screen');
          if (isMounted) {
            setIsProtectedBrand(true);
            setProtectedBrandData(brandData);
            setLoading(false);
          }
          return;
        }

        const fqdn = `${normalizedSlug}.com.rich`;
        console.log('[DomainSlugPage] Checking domain registration for:', fqdn);

        // FIRST: Check if this domain is registered (exists in domains table)
        const domainsData = await fetch(`${SUPABASE_URL}/rest/v1/domains?fqdn=eq.${normalizedSlug}.com.rich&select=id,customer_id,registrar_status,customers(user_id)`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }).then(r => r.json());

        console.log('[DomainSlugPage] Domains data:', domainsData);

        // If domain is registered, it's unavailable (someone owns it)
        if (Array.isArray(domainsData) && domainsData.length > 0) {
          console.log('[DomainSlugPage] Domain is registered');
          const domainRecord = domainsData[0];

          // Check if profile exists for this domain's owner
          const ownerUserId = domainRecord.customers?.user_id;
          console.log('[DomainSlugPage] Owner user_id:', ownerUserId);

          if (ownerUserId) {
            // Check if profile exists
            console.log('[DomainSlugPage] Checking for existing profile...');
            const existingProfile = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?subdomain=eq.${normalizedSlug}&select=id`, {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            }).then(r => r.json());

            console.log('[DomainSlugPage] Existing profile:', existingProfile);

            // If profile doesn't exist, try to auto-create it
            if (!Array.isArray(existingProfile) || existingProfile.length === 0) {
              console.log('[DomainSlugPage] No profile found, auto-creating...');
              try {
                await fetch(`${SUPABASE_URL}/functions/v1/auto-create-profile`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    user_id: ownerUserId,
                    domain: fqdn
                  })
                });
                console.log('[DomainSlugPage] Profile auto-created');
              } catch (createError) {
                console.error('[DomainSlugPage] Error auto-creating profile:', createError);
              }
            }
          }

          // Domain exists, show the public profile
          console.log('[DomainSlugPage] Setting UNAVAILABLE status');
          if (isMounted) {
            setDomainData({
              status: 'UNAVAILABLE',
              fqdn: fqdn,
              isAvailable: false,
              isPremium: false,
              planRequired: null,
              price: null,
              message: 'Este domínio já está registrado'
            });
            setLoading(false);
          }
          console.log('[DomainSlugPage] State updated, returning');
          return;
        }

        // SECOND: Check if it's an existing user profile (with or without domain)
        const profileData = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?subdomain=eq.${normalizedSlug}&select=subdomain,is_public`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }).then(r => r.json());

        // If a profile exists with this subdomain, show it (even if domain not registered)
        if (Array.isArray(profileData) && profileData.length > 0) {
          if (isMounted) {
            setDomainData({
              status: 'UNAVAILABLE',
              fqdn: fqdn,
              isAvailable: false,
              isPremium: false,
              planRequired: null,
              price: null,
              message: 'Este perfil já existe'
            });
            setLoading(false);
          }
          return;
        }

        // THIRD: If neither domain nor profile exists, check availability via API
        try {
          const result = await checkDomainAPI(fqdn);
          if (isMounted) {
            setDomainData(result);
          }

          // SEO: Atualizar meta tags
          document.title = result.isPremium
            ? `${normalizedSlug}.com.rich - Domínio Premium | com.rich`
            : `${normalizedSlug}.com.rich | com.rich`;

          // Canonical URL
          const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
          if (canonical) {
            canonical.href = `https://com.rich/${normalizedSlug}`;
          }
        } catch (apiError) {
          console.error('[DomainSlugPage] API Error:', apiError);
          // If API fails, show as available
          if (isMounted) {
            setDomainData({
              status: 'AVAILABLE',
              fqdn: fqdn,
              isAvailable: true,
              isPremium: false,
              planRequired: null,
              price: { monthly: 25, currency: 'USD' },
              message: 'Domínio disponível'
            });
          }
        }

      } catch (err) {
        console.error('[DomainSlugPage] Error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao verificar domínio');
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDomainStatus();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [slug, brandAuthenticated]);

  const verifyBrandPassword = async (password: string): Promise<boolean> => {
    if (!protectedBrandData) return false;

    // Simple password comparison (stored as plain text)
    if (password === protectedBrandData.access_password) {
      setBrandAuthenticated(true);
      setIsProtectedBrand(false);
      // This will trigger useEffect to reload
      return true;
    }
    return false;
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3B82F6] mx-auto mb-4" />
          <p className="text-gray-600">Verificando domínio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !domainData) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">Erro</h1>
          <p className="text-gray-600 mb-6">{error || 'Não foi possível verificar o domínio'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  // Premium Domain Available (à venda) -> Premium Landing
  if (
    domainData.status === 'AVAILABLE' &&
    domainData.isPremium === true &&
    domainData.isAvailable === true
  ) {
    return <PremiumLanding domain={domainData.fqdn} />;
  }

  // Domain Unavailable (já registrado) -> Mostrar perfil público
  if (domainData.status === 'UNAVAILABLE') {
    // Use the normalized slug to ensure consistency
    const normalizedSlug = normalizeSlug(slug || '');
    return <PublicProfile subdomain={normalizedSlug || slug} />;
  }

  // Standard Domain Available -> Página de disponível padrão
  if (
    domainData.status === 'AVAILABLE' &&
    domainData.isPremium === false
  ) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-black mb-4">
              {domainData.fqdn}
            </h1>
            <p className="text-xl text-green-600 font-semibold mb-2">
              ✅ Domínio Disponível para Registro
            </p>
            <p className="text-gray-600 mb-8">
              Para registrar este domínio, escolha um dos nossos planos de licenciamento
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/valores')}
                className="px-8 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-lg transition-colors"
              >
                Ver Planos
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Buscar Outro Domínio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (não deveria chegar aqui)
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-black mb-2">Estado Desconhecido</h1>
        <p className="text-gray-600 mb-6">Não foi possível determinar o status deste domínio.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
};

export default DomainSlugPage;
