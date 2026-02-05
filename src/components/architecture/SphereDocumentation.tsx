 import { motion } from 'framer-motion';
 import { 
   Sparkles, Moon, Radio, Mic, Brain, MessageCircle,
   Palette, Volume2, Gauge, Code
 } from 'lucide-react';
 import { AtlasSphere } from '@/components/atlas';
 
 type AIState = 'dormant' | 'passive' | 'activated' | 'listening' | 'thinking' | 'speaking';
 
 const SphereDocumentation = () => {
   const states: { state: AIState; icon: React.ElementType; color: string; description: string; behavior: string }[] = [
     { 
       state: 'dormant', 
       icon: Moon, 
       color: 'slate',
       description: 'Inactive state with minimal visual activity.',
       behavior: 'Slow breathing animation, muted colors, low particle count'
     },
     { 
       state: 'passive', 
       icon: Radio, 
       color: 'blue',
       description: 'Actively listening for wake word activation.',
       behavior: 'Gentle pulsing, soft blue glow, ambient particle motion'
     },
     { 
       state: 'activated', 
       icon: Sparkles, 
       color: 'primary',
       description: 'Just triggered, transitioning to listening mode.',
       behavior: 'Bright flash, expanding particles, color shift to primary'
     },
     { 
       state: 'listening', 
       icon: Mic, 
       color: 'cyan',
       description: 'Actively transcribing user speech input.',
       behavior: 'Audio-reactive particles, cyan accents, ripple effects'
     },
     { 
       state: 'thinking', 
       icon: Brain, 
       color: 'violet',
       description: 'Processing request and generating response.',
       behavior: 'Swirling particle motion, violet glow, increased complexity'
     },
     { 
       state: 'speaking', 
       icon: MessageCircle, 
       color: 'lavender',
       description: 'Outputting synthesized speech response.',
       behavior: 'Rhythmic pulsing synced to TTS, warm lavender tones'
     }
   ];
 
   const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
     slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' },
     blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
     primary: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' },
     cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
     violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
     lavender: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
   };
 
   const technicalFeatures = [
     {
       title: 'GPU Particle System',
       icon: Sparkles,
       description: 'Thousands of particles rendered efficiently using custom shaders.',
       details: ['Custom GLSL shaders', 'Instanced rendering', 'Adaptive particle count']
     },
     {
       title: 'Audio Reactivity',
       icon: Volume2,
       description: 'Sphere responds to voice input and TTS output in real-time.',
       details: ['Web Audio API', 'Frequency analysis', 'Amplitude mapping']
     },
     {
       title: 'Adaptive Quality',
       icon: Gauge,
       description: 'Automatically adjusts rendering quality based on device capabilities.',
       details: ['FPS monitoring', 'Dynamic resolution', 'Particle density scaling']
     },
     {
       title: 'Custom Shaders',
       icon: Code,
       description: 'GLSL shaders for nebula flow, particles, and post-processing.',
       details: ['Nebula flow field', 'Rim glow effect', 'Curl noise']
     }
   ];
 
   return (
     <div className="space-y-8">
       {/* Live Sphere Demo */}
       <motion.div
         className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
       >
         <div className="flex items-center gap-2 mb-4">
           <Sparkles className="w-5 h-5 text-primary" />
           <h3 className="text-lg font-semibold">Live Sphere</h3>
         </div>
         <div className="flex items-center justify-center py-8">
           <div className="w-[300px] h-[300px]">
             <AtlasSphere state="passive" audioLevel={0.1} context="demo" />
           </div>
         </div>
         <p className="text-sm text-muted-foreground text-center">
           The sphere above is rendering live using WebGL and custom GLSL shaders.
         </p>
       </motion.div>
 
       {/* State Cards */}
       <div>
         <div className="flex items-center gap-2 mb-4">
           <Palette className="w-5 h-5 text-cyan-400" />
           <h3 className="text-lg font-semibold">6 Cognitive States</h3>
         </div>
         <p className="text-sm text-muted-foreground mb-4">
           The sphere transitions between states based on user interaction and AI processing status.
         </p>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {states.map((item, index) => {
             const colors = colorClasses[item.color];
             const Icon = item.icon;
             
             return (
               <motion.div
                 key={item.state}
                 className={`backdrop-blur-xl border rounded-xl p-4 ${colors.bg} ${colors.border}`}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: index * 0.05 }}
                 whileHover={{ scale: 1.02 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                     <Icon className="w-4 h-4" />
                   </div>
                   <div>
                     <h4 className="font-medium capitalize">{item.state}</h4>
                   </div>
                 </div>
                 <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                 <p className="text-xs text-muted-foreground/70 italic">{item.behavior}</p>
               </motion.div>
             );
           })}
         </div>
       </div>
 
       {/* Technical Features */}
       <div>
         <div className="flex items-center gap-2 mb-4">
           <Code className="w-5 h-5 text-emerald-400" />
           <h3 className="text-lg font-semibold">Technical Implementation</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {technicalFeatures.map((feature, index) => {
             const Icon = feature.icon;
             
             return (
               <motion.div
                 key={feature.title}
                 className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-xl p-5"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                     <Icon className="w-4 h-4" />
                   </div>
                   <h4 className="font-medium">{feature.title}</h4>
                 </div>
                 <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                 <div className="flex flex-wrap gap-2">
                   {feature.details.map((detail) => (
                     <span 
                       key={detail}
                       className="text-xs px-2 py-1 rounded-full bg-muted/30 text-muted-foreground"
                     >
                       {detail}
                     </span>
                   ))}
                 </div>
               </motion.div>
             );
           })}
         </div>
       </div>
 
       {/* Shader Code Preview */}
       <motion.div
         className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.4 }}
       >
         <div className="flex items-center gap-2 mb-4">
           <Code className="w-5 h-5 text-primary" />
           <h3 className="text-lg font-semibold">Shader Example: Nebula Flow</h3>
         </div>
         <pre className="bg-background/50 rounded-lg p-4 text-xs overflow-x-auto">
           <code className="text-muted-foreground">{`// Fragment shader - Nebula core with rim glow
vec3 viewDir = normalize(vViewPosition);
float rimFactor = 1.0 - abs(dot(vNormal, viewDir));
rimFactor = pow(rimFactor, 2.5);

// Hot spots using noise
vec3 pos = vWorldPosition * 2.0 + uTime * 0.1;
float noise = snoise(pos);
float hotSpot = smoothstep(0.6, 1.0, noise) * 0.5;

// Final color with glow
vec3 finalColor = mix(coreColor, rimColor, rimFactor);
finalColor += hotSpotColor * hotSpot;
gl_FragColor = vec4(finalColor, alpha);`}</code>
         </pre>
       </motion.div>
 
       {/* Configuration Reference */}
       <motion.div
         className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.5 }}
       >
         <div className="flex items-center gap-2 mb-4">
           <Gauge className="w-5 h-5 text-amber-400" />
           <h3 className="text-lg font-semibold">Size Presets</h3>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
           {[
             { name: 'mini', size: '80px', use: 'Cards' },
             { name: 'dashboard', size: '140px', use: 'Dashboard' },
             { name: 'standard', size: '200px', use: 'Default' },
             { name: 'large', size: '300px', use: 'Focus' },
             { name: 'fullscreen', size: '100vh', use: 'Hero' }
           ].map((preset) => (
             <div 
               key={preset.name}
               className="text-center p-3 rounded-lg bg-muted/20"
             >
               <div className="font-mono text-sm text-primary">{preset.name}</div>
               <div className="text-xs text-muted-foreground">{preset.size}</div>
               <div className="text-xs text-muted-foreground/70">{preset.use}</div>
             </div>
           ))}
         </div>
       </motion.div>
     </div>
   );
 };
 
 export default SphereDocumentation;