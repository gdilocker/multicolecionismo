import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video as LucideIcon } from 'lucide-react';

interface PolicyLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  lastUpdated: string;
  legalNote?: string;
  children: ReactNode;
}

const PolicyLayout: React.FC<PolicyLayoutProps> = ({
  icon: Icon,
  title,
  subtitle = ".com.rich",
  lastUpdated,
  legalNote,
  children
}) => {
  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-sm">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              {title}
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">{subtitle}</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: {lastUpdated}</span>
            </div>
            {legalNote && (
              <p className="text-sm text-[#6B7280]/60 mt-2">
                {legalNote}
              </p>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {children}
        </motion.section>
      </div>
    </div>
  );
};

export default PolicyLayout;
