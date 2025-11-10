import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, ChevronLeft, Clock, Eye, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { sanitizeHtml } from '../lib/security/sanitize';

const parseMarkdown = (text: string): string => {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push(`<h3>${line.substring(4)}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push(`<h2>${line.substring(3)}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      result.push(`<h1>${line.substring(2)}</h1>`);
      continue;
    }

    // Unordered lists
    if (line.startsWith('- ')) {
      if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      const content = line.substring(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      result.push(`<li>${content}</li>`);
      continue;
    }

    // Ordered lists
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (!inOrderedList) {
        result.push('<ol>');
        inOrderedList = true;
      }
      const content = orderedMatch[2].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      result.push(`<li>${content}</li>`);
      continue;
    }

    // Regular paragraph
    if (inList) { result.push('</ul>'); inList = false; }
    if (inOrderedList) { result.push('</ol>'); inOrderedList = false; }
    const content = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result.push(`<p>${content}</p>`);
  }

  // Close any open lists
  if (inList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');

  return result.join('\n');
};

interface Article {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const SupportArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse markdown and sanitize article content to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    if (!article?.content) return '';
    const htmlContent = parseMarkdown(article.content);
    return sanitizeHtml(htmlContent);
  }, [article?.content]);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('support_articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setArticle(data);

        await supabase.rpc('increment_article_views', { article_id: data.id });

        const { data: related } = await supabase
          .from('support_articles')
          .select('*')
          .eq('category', data.category)
          .eq('is_published', true)
          .neq('id', data.id)
          .limit(3);

        setRelatedArticles(related || []);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Book className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Artigo não encontrado</h2>
          <p className="text-slate-600 mb-6">O artigo que você procura não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/suporte')}
            className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Voltar para Suporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-20">
      {/* Back Button */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-20 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/suporte')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium group transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>Voltar para Suporte</span>
          </button>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-block px-4 py-2 bg-slate-100 text-slate-900 rounded-full text-sm font-semibold mb-4">
            {article.category}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {article.title}
          </h1>
          <p className="text-xl text-slate-600 mb-6">
            {article.description}
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {format(new Date(article.updated_at), 'dd/MM/yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {article.view_count} visualizações
            </div>
          </div>
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-2 border-slate-200 rounded-2xl p-8 md:p-12 shadow-lg mb-12"
        >
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          <style>{`
            .article-content h1 {
              font-size: 2rem;
              font-weight: 700;
              color: #0f172a;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            .article-content h2 {
              font-size: 1.5rem;
              font-weight: 700;
              color: #1e293b;
              margin-top: 2rem;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #e2e8f0;
            }
            .article-content h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #334155;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            .article-content p {
              color: #475569;
              line-height: 1.75;
              margin-bottom: 1rem;
              font-size: 1.0625rem;
            }
            .article-content strong {
              color: #1e293b;
              font-weight: 600;
            }
            .article-content ul, .article-content ol {
              margin: 1.5rem 0;
              padding-left: 1.5rem;
            }
            .article-content ul {
              list-style-type: disc;
            }
            .article-content ol {
              list-style-type: decimal;
            }
            .article-content li {
              color: #475569;
              margin-bottom: 0.75rem;
              line-height: 1.625;
              padding-left: 0.5rem;
            }
            .article-content li strong {
              color: #1e293b;
            }
            .article-content ul ul, .article-content ol ol {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }
          `}</style>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-8 mb-12"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Ainda precisa de ajuda?</h3>
          <p className="text-slate-700 mb-6">
            Nossa equipe de suporte está pronta para ajudar você com qualquer dúvida.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/suporte/abrir-chamado')}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-900 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Abrir Chamado
            </button>
            <a
              href="mailto:support@com.rich"
              className="flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-white transition-all"
            >
              <Mail className="w-5 h-5" />
              Enviar E-mail
            </a>
          </div>
        </motion.div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Artigos Relacionados</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((related, index) => (
                <motion.div
                  key={related.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => navigate(`/suporte/${related.slug}`)}
                  className="bg-white border-2 border-slate-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-slate-300 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-900 rounded-lg flex items-center justify-center mb-4">
                    <Book className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{related.title}</h4>
                  <p className="text-sm text-slate-600">{related.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </article>
    </div>
  );
};

export default SupportArticle;
