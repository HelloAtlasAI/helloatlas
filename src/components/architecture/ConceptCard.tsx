 import { motion } from 'framer-motion';
 import { LucideIcon } from 'lucide-react';
 
 interface ConceptCardProps {
   title: string;
   description: string;
   icon: LucideIcon;
   features: string[];
   accentColor?: string;
   delay?: number;
 }
 
 const ConceptCard = ({ 
   title, 
   description, 
   icon: Icon, 
   features, 
   accentColor = 'primary',
   delay = 0 
 }: ConceptCardProps) => {
   const colorClasses: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
     primary: {
       bg: 'bg-primary/5',
       border: 'border-primary/30 hover:border-primary/50',
       text: 'text-primary',
       iconBg: 'bg-primary/20'
     },
     blue: {
       bg: 'bg-blue-500/5',
       border: 'border-blue-500/30 hover:border-blue-500/50',
       text: 'text-blue-400',
       iconBg: 'bg-blue-500/20'
     },
     emerald: {
       bg: 'bg-emerald-500/5',
       border: 'border-emerald-500/30 hover:border-emerald-500/50',
       text: 'text-emerald-400',
       iconBg: 'bg-emerald-500/20'
     },
     amber: {
       bg: 'bg-amber-500/5',
       border: 'border-amber-500/30 hover:border-amber-500/50',
       text: 'text-amber-400',
       iconBg: 'bg-amber-500/20'
     },
     cyan: {
       bg: 'bg-cyan-500/5',
       border: 'border-cyan-500/30 hover:border-cyan-500/50',
       text: 'text-cyan-400',
       iconBg: 'bg-cyan-500/20'
     },
     orange: {
       bg: 'bg-orange-500/5',
       border: 'border-orange-500/30 hover:border-orange-500/50',
       text: 'text-orange-400',
       iconBg: 'bg-orange-500/20'
     }
   };
 
   const colors = colorClasses[accentColor] || colorClasses.primary;
 
   return (
     <motion.div
       className={`relative p-6 rounded-2xl backdrop-blur-xl border transition-all ${colors.bg} ${colors.border}`}
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay, duration: 0.4 }}
       whileHover={{ scale: 1.02, y: -2 }}
     >
       <div className={`inline-flex p-3 rounded-xl ${colors.iconBg} mb-4`}>
         <Icon className={`w-6 h-6 ${colors.text}`} />
       </div>
       
       <h3 className="text-lg font-semibold mb-2">{title}</h3>
       <p className="text-sm text-muted-foreground mb-4">{description}</p>
       
       <ul className="space-y-2">
         {features.map((feature, index) => (
           <motion.li
             key={index}
             className="flex items-center gap-2 text-sm"
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: delay + 0.1 * (index + 1) }}
           >
             <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
             <span className="text-muted-foreground">{feature}</span>
           </motion.li>
         ))}
       </ul>
     </motion.div>
   );
 };
 
 export default ConceptCard;