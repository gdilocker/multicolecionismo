import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PolicySectionProps {
  title: string;
  content: ReactNode;
  index?: number;
}

const PolicySection: React.FC<PolicySectionProps> = ({ title, content, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
      <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-black mb-4">{title}</h2>
        <div className="prose prose-invert max-w-none">{content}</div>
      </div>
    </motion.div>
  );
};

export default PolicySection;
