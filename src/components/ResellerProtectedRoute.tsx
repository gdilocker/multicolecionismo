import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Target, CreditCard, ChevronRight } from 'lucide-react';
import { PanelLayout } from './PanelLayout';

interface ResellerProtectedRouteProps {
  children: React.ReactNode;
}

export default function ResellerProtectedRoute({ children }: ResellerProtectedRouteProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [reason, setReason] = useState<'no_role' | 'no_subscription' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[ResellerProtectedRoute] Customer check:', { customer, customerError, userId: user.id });

      if (customerError) throw customerError;

      const userRole = customer?.role || 'customer';

      console.log('[ResellerProtectedRoute] Role check:', { userRole });

      if (userRole !== 'reseller' && userRole !== 'admin') {
        console.log('[ResellerProtectedRoute] Access denied - not reseller or admin');
        setHasAccess(false);
        setReason('no_role');
        setLoading(false);
        return;
      }

      if (userRole === 'admin') {
        console.log('[ResellerProtectedRoute] Admin access granted');
        setIsAdmin(true);
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('customer_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (subError) throw subError;

      const hasActiveSub = subscription &&
        (subscription.status === 'active' || subscription.status === 'trialing') &&
        (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

      if (!hasActiveSub) {
        setHasAccess(false);
        setReason('no_subscription');
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking reseller access:', error);
      setHasAccess(false);
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <PanelLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Verificando acesso...</p>
          </div>
        </div>
      </PanelLayout>
    );
  }

  if (!hasAccess && reason === 'no_role') {
    return (
      <PanelLayout>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-lg"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Acesso Restrito</h2>
            <p className="text-slate-600 mb-6">
              Você não tem permissão para acessar o painel de afiliados. Esta área é exclusiva para revendedores aprovados.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Se você deseja se tornar um afiliado, entre em contato com nosso suporte.
            </p>
            <motion.a
              href="/panel/support"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Falar com Suporte
              <ChevronRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </PanelLayout>
    );
  }

  if (!hasAccess && reason === 'no_subscription') {
    return (
      <PanelLayout>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-lg"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Assinatura Necessária</h2>
            <p className="text-slate-600 mb-6">
              Para acessar o painel de revendedor e começar a ganhar comissões, você precisa ter uma assinatura ativa.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Escolha um plano adequado às suas necessidades e comece a revender hoje mesmo!
            </p>
            <motion.a
              href="/valores"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
            >
              Ver Planos e Assinar
              <ChevronRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </PanelLayout>
    );
  }

  return <>{children}</>;
}
