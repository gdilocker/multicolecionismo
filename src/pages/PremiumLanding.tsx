import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Zap, TrendingUp, Mail, ArrowRight, Sparkles, Award, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumLandingProps {
  domain: string; // Ex: "vip.com.rich"
}

const PremiumLanding: React.FC<PremiumLandingProps> = ({ domain }) => {
  const navigate = useNavigate();
  const slug = domain.replace('.com.rich', '');

  useEffect(() => {
    // Analytics event
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'premium_view', {
          domain: domain,
          slug: slug
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, [domain, slug]);

  const handleContactClick = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'premium_contact_click', {
          domain: domain,
          slug: slug
        });
      }
    } catch (e) {
      console.error('Analytics error:', e);
    }
    navigate(`/contact?domain=${encodeURIComponent(domain)}&type=premium-request`);
  };

  const handleSupremeClick = () => {
    navigate('/valores#supreme');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b2e] via-[#2B2D42] to-[#1a1b2e]">
      {/* Hero Premium */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-full mb-8"
          >
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-semibold text-sm tracking-wide uppercase">Domínio Premium</span>
          </motion.div>

          {/* Domain Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h1 className={`font-bold mb-4 break-words px-4 ${
              slug.length <= 8
                ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'
                : slug.length <= 12
                ? 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'
                : slug.length <= 16
                ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'
                : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
            }`}>
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                {slug}
              </span>
              <span className="text-white/60">.com.rich</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Crown className="w-5 h-5" />
              <p className="text-xl font-medium">Exclusivo Plano Supreme</p>
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto mb-12"
          >
            Este domínio premium representa exclusividade, autoridade e prestígio.
            Ideal para marcas que desejam se destacar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleContactClick}
              className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Tenho Interesse
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleSupremeClick}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Ver Plano Supreme
            </button>
          </motion.div>
        </div>
      </section>

      {/* Supreme Plan Context */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 md:p-10 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl flex-shrink-0">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Plano Supreme
                  <Award className="w-6 h-6 text-yellow-600" />
                </h3>
                <p className="text-lg text-gray-800 leading-relaxed mb-4">
                  <span className="font-semibold">Para quem tem o objetivo de se tornar referência mundial no seu segmento.</span> O Supreme não é apenas um domínio premium - é uma plataforma completa e exclusiva que posiciona sua marca como líder global.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Com infraestrutura dedicada, suporte corporativo de elite e total flexibilidade contratual, você terá todos os recursos necessários para consolidar sua presença digital em escala internacional. <span className="font-semibold text-gray-900">Ideal para empresas, executivos e profissionais que pensam grande e não aceitam menos que a excelência.</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-20 bg-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          >
            Por Que Este Domínio é <span className="text-yellow-400">Premium</span>?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Crown,
                title: 'Exclusividade',
                description: 'Domínios curtos, memoráveis e de alta demanda são raros e valorizados.'
              },
              {
                icon: Zap,
                title: 'Memorabilidade',
                description: 'Fácil de lembrar, digitar e compartilhar. Perfeito para branding.'
              },
              {
                icon: TrendingUp,
                title: 'Autoridade',
                description: 'Transmite credibilidade e profissionalismo imediatos ao seu público.'
              },
              {
                icon: Award,
                title: 'Raridade',
                description: 'Disponibilidade limitada. Uma vez registrado, nunca mais estará disponível.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-gradient-to-b from-white/5 to-white/0 border border-white/10 rounded-xl hover:border-yellow-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Elite Plan Info */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">Acesso Exclusivo ao Plano Supreme</h2>
            </div>

            <p className="text-gray-300 text-lg mb-6">
              Domínios premium são reservados para clientes do <strong className="text-yellow-400">Plano Supreme</strong>.
              Ao assinar, você terá acesso a:
            </p>

            <ul className="space-y-3 mb-8">
              {[
                'Acesso ilimitado a domínios premium',
                'Infraestrutura dedicada e escalável',
                'Suporte corporativo de elite 24/7',
                'Ferramentas avançadas de gestão',
                'Total flexibilidade contratual'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mb-6 p-6 bg-black/30 rounded-xl border border-yellow-500/20">
              <p className="text-2xl font-bold text-yellow-400 mb-3">
                Disponibilidade Sob Consulta
              </p>
              <p className="text-gray-300 leading-relaxed">
                Este domínio premium está disponível exclusivamente através do Plano Supreme.
                Entre em contato com nossa equipe para conhecer as condições especiais e
                receber uma proposta personalizada para o seu negócio.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContactClick}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Manifestar Interesse
              </button>
              <button
                onClick={handleSupremeClick}
                className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Conhecer o Plano Supreme
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-black/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Reserve Este Domínio Premium
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Domínios premium são únicos. Uma vez reservado, representa sua marca de forma exclusiva.
            </p>
            <button
              onClick={handleContactClick}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/25 transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Quero Saber Mais
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PremiumLanding;
