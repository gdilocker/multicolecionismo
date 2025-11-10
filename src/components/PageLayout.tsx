import React, { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { sanitizeHtml } from '../lib/security/sanitize';
import { useDrawer } from '../contexts/DrawerContext';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBlobs?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  showBlobs = false
}) => {
  const { isInDrawer, closeDrawer } = useDrawer();

  // Sanitize title to prevent XSS attacks
  const sanitizedTitle = useMemo(() => {
    if (!title) return '';
    return sanitizeHtml(title);
  }, [title]);
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA]">
      {isInDrawer && (
        <div className="fixed top-4 left-4 z-[100]">
          <button
            onClick={closeDrawer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-gray-900 rounded-lg transition-all shadow-lg hover:shadow-xl group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">Fechar</span>
          </button>
        </div>
      )}

      <div className="relative pt-32 pb-16">
        {title && (
          <motion.section
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
            initial="hidden"
            animate="show"
            variants={container}
          >
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1
                variants={item}
                className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight"
                dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
              />
              {subtitle && (
                <motion.p
                  variants={item}
                  className="text-xl text-[#6B7280] leading-relaxed"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </motion.section>
        )}

        {children}
      </div>
    </div>
  );
};

export default PageLayout;
