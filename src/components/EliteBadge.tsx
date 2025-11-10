import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface EliteBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const EliteBadge: React.FC<EliteBadgeProps> = ({
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const sizes = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const sizeConfig = sizes[size];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-2 ${sizeConfig.badge} bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black font-bold rounded-full shadow-lg ${className}`}
      style={{
        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)'
      }}
    >
      <Crown className={sizeConfig.icon} fill="currentColor" />
      {showLabel && (
        <span className={sizeConfig.text}>Elite Member</span>
      )}
    </motion.div>
  );
};

export default EliteBadge;
