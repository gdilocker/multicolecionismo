import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Store, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SelectUserType() {
  const [selectedType, setSelectedType] = useState<'social' | 'member' | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!selectedType || !user) return;

    setLoading(true);
    try {
      // Update or create customer with user_type
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingCustomer) {
        await supabase
          .from('customers')
          .update({ user_type: selectedType })
          .eq('id', existingCustomer.id);
      } else {
        await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            email: user.email,
            user_type: selectedType
          });
      }

      // Redirect based on type
      if (selectedType === 'social') {
        navigate('/social');
      } else {
        navigate('/panel/dashboard');
      }
    } catch (error) {
      console.error('Error setting user type:', error);
      alert('Erro ao configurar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Como você quer usar?
          </h1>
          <p className="text-xl text-gray-600">
            Escolha como deseja começar sua experiência
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Social Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType('social')}
            className={`relative bg-white rounded-2xl p-8 border-2 transition-all ${
              selectedType === 'social'
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {selectedType === 'social' && (
              <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <User className="w-10 h-10 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Apenas Rede Social
              </h2>

              <p className="text-gray-600 mb-4">
                Participe da comunidade, curta, comente e compartilhe posts.
              </p>

              <div className="w-full bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">Inclui:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Feed social completo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Curtir e comentar posts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Seguir outros membros
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    100% gratuito
                  </li>
                </ul>
              </div>
            </div>
          </motion.button>

          {/* Member Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType('member')}
            className={`relative bg-white rounded-2xl p-8 border-2 transition-all ${
              selectedType === 'member'
                ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {selectedType === 'member' && (
              <div className="absolute top-4 right-4 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <Store className="w-10 h-10 text-amber-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Criar Negócio
              </h2>

              <p className="text-gray-600 mb-4">
                Tenha seu domínio próprio, loja e perfil profissional.
              </p>

              <div className="w-full bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">Inclui tudo + :</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Domínio exclusivo
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Loja integrada
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Página customizável
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    14 dias de teste grátis
                  </li>
                </ul>
              </div>
            </div>
          </motion.button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || loading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Configurando...
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
