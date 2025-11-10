export interface ProfileTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  avatar: string;
  bio: string;
  links: Array<{
    title: string;
    url: string;
    icon?: string;
  }>;
  theme: {
    background_color?: string;
    background_gradient?: string;
    text_color?: string;
    button_style?: string;
    font_family?: string;
  };
}

export const profileTemplates: ProfileTemplate[] = [
  {
    id: 'entrepreneur',
    name: 'Empreendedor',
    category: 'Negócios',
    description: 'Perfeito para CEOs, fundadores e empreendedores que querem mostrar seus projetos',
    avatar: '👔',
    bio: 'Empreendedor | Fundador da [Sua Empresa] | Transformando ideias em negócios de impacto',
    links: [
      { title: 'Minha Empresa', url: 'https://suaempresa.com', icon: 'Globe' },
      { title: 'LinkedIn', url: 'https://linkedin.com/in/seuperfil', icon: 'Linkedin' },
      { title: 'Agendar Reunião', url: 'https://calendly.com/voce', icon: 'Calendar' },
      { title: 'WhatsApp Business', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text_color: '#ffffff',
      button_style: 'solid',
      font_family: 'Inter'
    }
  },
  {
    id: 'content-creator',
    name: 'Criador de Conteúdo',
    category: 'Criadores',
    description: 'Ideal para YouTubers, streamers e influencers digitais',
    avatar: '🎬',
    bio: 'Criador de Conteúdo | [Seu Nicho] | Compartilhando conhecimento e diversão com vocês ❤️',
    links: [
      { title: 'YouTube', url: 'https://youtube.com/@seuperfil', icon: 'Youtube' },
      { title: 'Instagram', url: 'https://instagram.com/seuperfil', icon: 'Instagram' },
      { title: 'TikTok', url: 'https://tiktok.com/@seuperfil', icon: 'Music' },
      { title: 'Discord Comunidade', url: 'https://discord.gg/seucomunidade', icon: 'Users' },
      { title: 'Apoie no Patreon', url: 'https://patreon.com/voce', icon: 'Heart' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      text_color: '#ffffff',
      button_style: 'rounded',
      font_family: 'Poppins'
    }
  },
  {
    id: 'coach',
    name: 'Coach/Consultor',
    category: 'Serviços',
    description: 'Para coaches, mentores e consultores que vendem mentorias',
    avatar: '🎯',
    bio: 'Coach & Mentor | Ajudo pessoas a alcançarem seus objetivos | +1000 vidas transformadas',
    links: [
      { title: 'Agendar Sessão Gratuita', url: 'https://calendly.com/voce/sessao-gratuita', icon: 'Calendar' },
      { title: 'Meus Programas', url: 'https://seuprograma.com', icon: 'BookOpen' },
      { title: 'Depoimentos', url: 'https://depoimentos.com', icon: 'Star' },
      { title: 'Instagram', url: 'https://instagram.com/seuperfil', icon: 'Instagram' },
      { title: 'WhatsApp', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      text_color: '#1a202c',
      button_style: 'rounded',
      font_family: 'Montserrat'
    }
  },
  {
    id: 'artist',
    name: 'Artista/Músico',
    category: 'Arte',
    description: 'Showcase para artistas, músicos e bandas',
    avatar: '🎨',
    bio: 'Artista Visual | Criando arte que conecta e inspira ✨ | Encomendas abertas',
    links: [
      { title: 'Portfolio', url: 'https://behance.net/seuperfil', icon: 'Image' },
      { title: 'Spotify', url: 'https://open.spotify.com/artist/voce', icon: 'Music' },
      { title: 'Instagram Arte', url: 'https://instagram.com/seuperfil', icon: 'Instagram' },
      { title: 'Loja de Prints', url: 'https://loja.com', icon: 'ShoppingBag' },
      { title: 'Contato para Projetos', url: 'mailto:contato@email.com', icon: 'Mail' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      text_color: '#2d3748',
      button_style: 'outline',
      font_family: 'Playfair Display'
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce/Loja',
    category: 'Vendas',
    description: 'Para quem vende produtos físicos ou digitais',
    avatar: '🛍️',
    bio: 'Loja Online | Produtos de qualidade com entrega rápida | Frete incluso acima de R$99',
    links: [
      { title: 'Ver Catálogo Completo', url: 'https://loja.com/catalogo', icon: 'ShoppingCart' },
      { title: 'Ofertas da Semana', url: 'https://loja.com/ofertas', icon: 'Tag' },
      { title: 'WhatsApp Vendas', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' },
      { title: 'Instagram Loja', url: 'https://instagram.com/loja', icon: 'Instagram' },
      { title: 'Rastreie Seu Pedido', url: 'https://loja.com/rastreio', icon: 'Package' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text_color: '#ffffff',
      button_style: 'solid',
      font_family: 'Roboto'
    }
  },
  {
    id: 'restaurant',
    name: 'Restaurante/Food',
    category: 'Gastronomia',
    description: 'Para restaurantes, cafés e delivery de comida',
    avatar: '🍕',
    bio: 'Restaurante [Nome] | A melhor comida da região | Delivery e presencial | Seg-Dom 11h-23h',
    links: [
      { title: 'Fazer Pedido (iFood)', url: 'https://ifood.com.br/restaurante', icon: 'ShoppingBag' },
      { title: 'Cardápio Completo', url: 'https://cardapio.com', icon: 'BookOpen' },
      { title: 'Reservar Mesa', url: 'https://reserva.com', icon: 'Calendar' },
      { title: 'Instagram', url: 'https://instagram.com/restaurante', icon: 'Instagram' },
      { title: 'WhatsApp', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' },
      { title: 'Como Chegar', url: 'https://maps.google.com/?q=endereco', icon: 'MapPin' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      text_color: '#2d3748',
      button_style: 'rounded',
      font_family: 'Quicksand'
    }
  },
  {
    id: 'developer',
    name: 'Desenvolvedor',
    category: 'Tech',
    description: 'Para devs, designers e profissionais de tech',
    avatar: '💻',
    bio: 'Full Stack Developer | JavaScript • React • Node.js | Open Source Contributor',
    links: [
      { title: 'GitHub', url: 'https://github.com/seuperfil', icon: 'Github' },
      { title: 'Portfolio', url: 'https://portfolio.dev', icon: 'Code' },
      { title: 'LinkedIn', url: 'https://linkedin.com/in/seuperfil', icon: 'Linkedin' },
      { title: 'Blog Técnico', url: 'https://blog.dev', icon: 'FileText' },
      { title: 'Contato Freelance', url: 'mailto:dev@email.com', icon: 'Mail' }
    ],
    theme: {
      background_color: '#1a202c',
      text_color: '#ffffff',
      button_style: 'outline',
      font_family: 'Fira Code'
    }
  },
  {
    id: 'fitness',
    name: 'Personal Trainer',
    category: 'Saúde',
    description: 'Para personal trainers, nutricionistas e profissionais fitness',
    avatar: '💪',
    bio: 'Personal Trainer | CREF 123456 | Transforme seu corpo e sua vida | Treino online e presencial',
    links: [
      { title: 'Agendar Avaliação', url: 'https://calendly.com/personal', icon: 'Calendar' },
      { title: 'Planos de Treino', url: 'https://planos.fit', icon: 'Dumbbell' },
      { title: 'Antes e Depois', url: 'https://resultados.fit', icon: 'TrendingUp' },
      { title: 'Instagram', url: 'https://instagram.com/personal', icon: 'Instagram' },
      { title: 'WhatsApp', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
      text_color: '#ffffff',
      button_style: 'solid',
      font_family: 'Oswald'
    }
  },
  {
    id: 'photographer',
    name: 'Fotógrafo',
    category: 'Arte',
    description: 'Para fotógrafos profissionais e amadores',
    avatar: '📸',
    bio: 'Fotógrafo Profissional | Casamentos • Eventos • Retratos | Eternizando seus momentos',
    links: [
      { title: 'Portfolio Completo', url: 'https://portfolio.foto', icon: 'Camera' },
      { title: 'Instagram', url: 'https://instagram.com/fotografo', icon: 'Instagram' },
      { title: 'Contratar Ensaio', url: 'https://orcamento.foto', icon: 'DollarSign' },
      { title: 'Depoimentos', url: 'https://depoimentos.foto', icon: 'Star' },
      { title: 'WhatsApp', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' }
    ],
    theme: {
      background_color: '#000000',
      text_color: '#ffffff',
      button_style: 'outline',
      font_family: 'Cinzel'
    }
  },
  {
    id: 'realtor',
    name: 'Corretor de Imóveis',
    category: 'Negócios',
    description: 'Para corretores e imobiliárias',
    avatar: '🏠',
    bio: 'Corretor de Imóveis | CRECI 12345 | Ajudando você a encontrar o imóvel dos sonhos',
    links: [
      { title: 'Imóveis Disponíveis', url: 'https://imoveis.com', icon: 'Home' },
      { title: 'Avaliação Gratuita', url: 'https://avaliar.com', icon: 'Calculator' },
      { title: 'WhatsApp', url: 'https://wa.me/5511999999999', icon: 'MessageCircle' },
      { title: 'Instagram', url: 'https://instagram.com/corretor', icon: 'Instagram' },
      { title: 'Financiamento', url: 'https://financiamento.com', icon: 'CreditCard' }
    ],
    theme: {
      background_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      text_color: '#1a202c',
      button_style: 'rounded',
      font_family: 'Raleway'
    }
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    category: 'Estilo',
    description: 'Design limpo e minimalista para qualquer propósito',
    avatar: '✨',
    bio: 'Simplicidade é sofisticação',
    links: [
      { title: 'Website', url: 'https://site.com', icon: 'Globe' },
      { title: 'Email', url: 'mailto:contato@email.com', icon: 'Mail' },
      { title: 'Social', url: 'https://instagram.com/perfil', icon: 'Share2' }
    ],
    theme: {
      background_color: '#ffffff',
      text_color: '#000000',
      button_style: 'outline',
      font_family: 'Helvetica'
    }
  },
  {
    id: 'neon',
    name: 'Neon Vibes',
    category: 'Estilo',
    description: 'Visual moderno e vibrante com efeito neon',
    avatar: '⚡',
    bio: 'Living in the future | Digital Creator | Tech Enthusiast',
    links: [
      { title: 'Main Link', url: 'https://link1.com', icon: 'Zap' },
      { title: 'Projects', url: 'https://link2.com', icon: 'Rocket' },
      { title: 'Contact', url: 'https://link3.com', icon: 'Send' }
    ],
    theme: {
      background_color: '#0a0a0a',
      text_color: '#00ff88',
      button_style: 'solid',
      font_family: 'Orbitron'
    }
  }
];

export const getTemplatesByCategory = (category: string) => {
  return profileTemplates.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return profileTemplates.find(t => t.id === id);
};

export const templateCategories = [
  'Todos',
  'Negócios',
  'Criadores',
  'Serviços',
  'Arte',
  'Vendas',
  'Gastronomia',
  'Tech',
  'Saúde',
  'Estilo'
];
