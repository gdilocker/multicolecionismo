import React, { useState } from "react";
import { Search, CheckCircle, XCircle, Loader2, AlertTriangle, Award, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Domain } from "../types";
import { supabase } from "../lib/supabase";

interface DomainSearchProps {
  onDomainSelected?: (domain: Domain) => void;
}

type DomainStatus = "UNAVAILABLE" | "AVAILABLE";

interface DomainSearchResult {
  status: DomainStatus;
  fqdn: string;
  isAvailable: boolean;
  isPremium: boolean;
  planRequired: "ELITE" | "STANDARD_OR_ELITE" | null;
  price: { monthly: number; currency: string; yearly?: number } | null;
  message: string;
  suggestions?: string[];
  userHasSubscription?: boolean;
  userPlanType?: string;
  showDirectPurchase?: boolean;
  isAdmin?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Converte input do usuário para domínio .com.rich
function toDomain(value: string): string {
  const s = value.trim().toLowerCase();
  if (!s) throw new Error("Informe um nome de domínio");
  if (s.endsWith(".com.rich")) return s;
  if (s.includes(".")) return s;
  return `${s}.com.rich`;
}

async function checkDomainAvailability(fqdn: string): Promise<DomainSearchResult> {
  try {
    // Get current session to send auth token
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || SUPABASE_ANON_KEY;

    const apiUrl = `${SUPABASE_URL}/functions/v1/domains`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'check',
        fqdn: fqdn
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DomainSearch] Error response:', errorText);
      throw new Error(`API retornou status ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    console.log('[DomainSearch] Result:', result);

    return result;

  } catch (error) {
    console.error(`[DomainSearch] Erro na verificação:`, error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Não foi possível conectar ao serviço.');
      }
    }

    throw new Error('Serviço temporariamente indisponível.');
  }
}

const DomainSearch: React.FC<DomainSearchProps> = ({ onDomainSelected }) => {
  const [sld, setSld] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DomainSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<DomainSearchResult[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const sanitizeInput = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSld = sld.trim();
    if (!cleanSld) return;

    setIsSearching(true);
    setError("");
    setSearchResult(null);
    setSuggestions([]);

    try {
      // First, check if it's a profile search (without .com.rich extension)
      if (!cleanSld.includes('.')) {
        // Check if profile exists
        const profileCheckUrl = `${SUPABASE_URL}/rest/v1/user_profiles?subdomain=eq.${cleanSld}&is_public=eq.true&select=subdomain`;
        const profileResponse = await fetch(profileCheckUrl, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        if (profileResponse.ok) {
          const profiles = await profileResponse.json();
          if (profiles && profiles.length > 0) {
            // Profile exists! Redirect to it
            navigate(`/${cleanSld}`);
            return;
          }
        }
      }

      // If not a profile or profile doesn't exist, check domain availability
      const domainToCheck = cleanSld.endsWith(".com.rich") ? cleanSld : `${cleanSld}.com.rich`;
      const result = await checkDomainAvailability(domainToCheck);
      setSearchResult(result);

      // Se for Premium AVAILABLE, navegar para a landing page
      if (
        result.status === 'AVAILABLE' &&
        result.isPremium === true &&
        result.isAvailable === true
      ) {
        const slug = result.fqdn.replace('.com.rich', '');
        navigate(`/${slug}`);
        return;
      }

      // Convert to Domain type for callback
      if (onDomainSelected && result.isAvailable && result.price) {
        onDomainSelected({
          name: result.fqdn,
          available: result.isAvailable,
          price: result.price.monthly
        });
      }

      // Only generate additional suggestions if domain is unavailable and no suggestions returned from API
      if (result.status === "UNAVAILABLE" && (!result.suggestions || result.suggestions.length === 0)) {
        const baseName = cleanSld.replace(/\.com\.rich$/, '');
        const suggestionVariations = [
          `${baseName}1.com.rich`,
          `${baseName}app.com.rich`,
          `${baseName}pro.com.rich`,
          `my${baseName}.com.rich`
        ];

        const suggestionPromises = suggestionVariations.map(async (domain) => {
          try {
            return await checkDomainAvailability(domain);
          } catch (err) {
            return null;
          }
        });

        const suggestionResults = await Promise.all(suggestionPromises);
        const validSuggestions = suggestionResults.filter((s): s is DomainSearchResult =>
          s !== null && s.status === "AVAILABLE"
        );
        setSuggestions(validSuggestions);
      } else if (result.suggestions) {
        setSuggestions([]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido na verificação";
      console.error("[DomainSearch] Erro:", err);
      setError(errorMessage);

    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = () => {
    if (searchResult?.isAvailable && searchResult.price) {
      navigate(`/checkout?domain=${encodeURIComponent(searchResult.fqdn)}&price=${searchResult.price.monthly}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-stretch">
            <input
              type="text"
              value={sld}
              onChange={(e) => setSld(sanitizeInput(e.target.value))}
              placeholder="Buscar perfil ou domínio"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white text-gray-900 placeholder-gray-400"
              disabled={isSearching}
            />
            <div className="flex items-center px-4 bg-white border border-l-0 border-gray-300 rounded-r-lg text-gray-500 text-lg font-medium select-none">
              .com.rich
            </div>
          </div>
          <button
            type="submit"
            disabled={isSearching || !sld.trim()}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 border-2 border-white shadow-lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 text-blue-600" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Não foi possível verificar o domínio</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-semibold text-gray-900">{searchResult.fqdn}</h3>

                {/* Badges */}
                {searchResult.status === "UNAVAILABLE" && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    <XCircle className="w-3 h-3" />
                    Indisponível
                  </span>
                )}
                {searchResult.status === "AVAILABLE" && searchResult.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-semibold rounded-full">
                    <Award className="w-3 h-3" />
                    PREMIUM
                  </span>
                )}
                {searchResult.status === "AVAILABLE" && !searchResult.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Disponível
                  </span>
                )}
              </div>

              {/* Message */}
              <div className={`text-sm whitespace-pre-line ${
                searchResult.status === "AVAILABLE" ? "text-green-600" : "text-red-600"
              }`}>
                {searchResult.message}
              </div>
            </div>

            {/* Price Display */}
            <div className="text-right">
              {searchResult.isAdmin && searchResult.price?.yearly === 0 ? (
                <>
                  <p className="text-2xl font-bold text-green-600">
                    INCLUÍDO
                  </p>
                  <p className="text-sm text-gray-500">Vitalício</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                    <span>👑</span> Admin
                  </p>
                </>
              ) : searchResult.userHasSubscription && searchResult.price?.yearly ? (
                <>
                  <p className="text-2xl font-bold text-blue-600">
                    ${searchResult.price.yearly}
                  </p>
                  <p className="text-sm text-gray-500">/ano</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Domínio adicional
                  </p>
                </>
              ) : searchResult.price && searchResult.price.monthly && !searchResult.userHasSubscription ? (
                <>
                  <p className="text-2xl font-bold text-blue-600">
                    ${searchResult.price.monthly.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">/mês</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Plano Standard
                  </p>
                </>
              ) : searchResult.isPremium && searchResult.planRequired === "ELITE" ? (
                <>
                  <p className="text-lg font-bold text-blue-600">💎 Premium</p>
                  <p className="text-sm text-gray-500">
                    {searchResult.userHasSubscription ? 'Sob Consulta' : 'Plano Elite'}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* ESTADO 1: UNAVAILABLE */}
            {searchResult.status === "UNAVAILABLE" && searchResult.suggestions && (
              <div>
                <p className="text-gray-600 mb-2">Que tal tentar uma destas variações?</p>
                <div className="flex flex-wrap gap-2">
                  {searchResult.suggestions.map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const name = sugg.replace('.com.rich', '');
                        setSld(name);
                        handleSearch(new Event('submit') as any);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ESTADO 0: ADMIN - free registration */}
            {searchResult.status === "AVAILABLE" && searchResult.isAdmin && searchResult.price?.yearly === 0 && (
              <button
                onClick={() => navigate(`/checkout?domain=${encodeURIComponent(searchResult.fqdn)}&price=0&type=admin`)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>👑</span>
                Registrar Gratuitamente (Vitalício)
              </button>
            )}

            {/* ESTADO 2A: User HAS subscription - show direct purchase */}
            {searchResult.status === "AVAILABLE" && searchResult.showDirectPurchase && !searchResult.isAdmin && !searchResult.isPremium && searchResult.price?.yearly && (
              <button
                onClick={() => navigate(`/checkout?domain=${encodeURIComponent(searchResult.fqdn)}&price=${searchResult.price.yearly}&type=additional`)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Adicionar domínio por ${searchResult.price.yearly}/ano
              </button>
            )}

            {/* ESTADO 2B: User HAS Elite subscription - premium domain (sob consulta) */}
            {searchResult.status === "AVAILABLE" && searchResult.showDirectPurchase && searchResult.isPremium && searchResult.userPlanType === 'elite' && (
              <button
                onClick={() => navigate(`/panel/support`)}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5" />
                Solicitar Orçamento
              </button>
            )}

            {/* ESTADO 2C: User HAS Standard subscription but domain requires Elite - show upgrade */}
            {searchResult.status === "AVAILABLE" && searchResult.isPremium && searchResult.userPlanType === 'prime' && (
              <button
                onClick={() => navigate('/panel/billing')}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5" />
                Fazer Upgrade para Elite
              </button>
            )}

            {/* ESTADO 2D: User DOES NOT have subscription - show plans */}
            {searchResult.status === "AVAILABLE" && !searchResult.userHasSubscription && (
              <button
                onClick={() => navigate('/valores')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center justify-center gap-2"
              >
                {searchResult.isPremium ? (
                  <>
                    <Award className="w-5 h-5" />
                    Ver Plano Elite
                  </>
                ) : (
                  <>
                    Ver Planos
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Additional Suggestions List */}
      {suggestions.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Outras sugestões disponíveis:</h3>
          <div className="grid gap-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-medium text-gray-900">{suggestion.fqdn}</h4>
                      {suggestion.isPremium && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-semibold rounded-full">
                          <Award className="w-3 h-3" />
                          PREMIUM
                        </span>
                      )}
                      {suggestion.status === "AVAILABLE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Disponível
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          <XCircle className="w-3 h-3" />
                          Indisponível
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {suggestion.price && suggestion.price.monthly ? (
                      <>
                        <p className="text-xl font-bold text-blue-600">
                          ${suggestion.price.monthly}
                        </p>
                        <p className="text-xs text-gray-500">/mês</p>
                      </>
                    ) : suggestion.planRequired === "ELITE" ? (
                      <p className="text-sm font-medium text-blue-600">Plano Elite</p>
                    ) : (
                      <p className="text-sm text-gray-400">—</p>
                    )}
                  </div>
                </div>
                {suggestion.status === "AVAILABLE" && suggestion.planRequired === "STANDARD_OR_ELITE" && suggestion.price && (
                  <button
                    onClick={() => navigate(`/checkout?domain=${encodeURIComponent(suggestion.fqdn)}&price=${suggestion.price.monthly}`)}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Registrar agora por ${suggestion.price.monthly}/mês
                  </button>
                )}
                {suggestion.planRequired === "ELITE" && (
                  <button
                    onClick={() => navigate('/valores')}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Ver Plano Elite
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainSearch;
export { DomainSearch };