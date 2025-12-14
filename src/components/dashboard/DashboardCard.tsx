import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  onClick?: () => void;
  glowColor?: string;
  glowing?: boolean;
}

export const DashboardCard = ({ 
  children, 
  className = '', 
  header,
  onClick,
  glowColor
}: DashboardCardProps) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl h-full bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.2)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 opacity-30" style={{ background: glowColor ? `radial-gradient(ellipse at top, ${glowColor} 0%, transparent 60%)` : 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      <div className="relative z-10 h-full flex flex-col">
        {header && <div className="px-5 py-4 border-b border-white/5">{header}</div>}
        <div className="flex-1 p-5">{children}</div>
      </div>
    </motion.div>
  );
};
