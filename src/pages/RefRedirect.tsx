import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RefRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Salvar no cookie com 30 dias de expiração
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `ref=${code}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

      // Redirecionar para o registro com o código
      const params = new URLSearchParams({
        ref: code,
        utm_source: 'short_link',
        utm_medium: 'referral',
        utm_campaign: 'affiliate'
      });

      navigate(`/register?${params.toString()}`, { replace: true });
    } else {
      // Se não houver código, ir para página inicial
      navigate('/', { replace: true });
    }
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecionando...</p>
      </div>
    </div>
  );
}
