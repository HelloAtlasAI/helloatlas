import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Email Card - Data Stream Background
export const EmailAtmosphere = () => {
  const streams = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      width: 1 + Math.random() * 2,
      height: 50 + Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 5,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {streams.map((stream) => (
        <motion.div
          key={stream.id}
          className="absolute bg-gradient-to-b from-pink-500/40 via-rose-500/20 to-transparent rounded-full"
          style={{
            left: stream.left,
            width: stream.width,
            height: stream.height,
            top: '-20%',
          }}
          animate={{
            y: ['0%', '150vh'],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: stream.duration,
            delay: stream.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// Stocks Card - Market Pulse Background
export const StocksAtmosphere = () => {
  const pulses = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: i * 0.5,
      size: 200 + i * 100,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {pulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            className="absolute rounded-full border border-emerald-500/20"
            style={{
              width: pulse.size,
              height: pulse.size,
              left: -pulse.size / 2,
              top: -pulse.size / 2,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 4,
              delay: pulse.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      
      {/* Trend lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M0 50 Q 25 30, 50 50 T 100 40"
          fill="none"
          stroke="hsl(142, 71%, 45%)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};

// Calendar Card - Time Flow Background
export const CalendarAtmosphere = () => {
  const orbs = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: 10 + (i * 7),
      size: 8 + Math.random() * 20,
      duration: 8 + Math.random() * 4,
      delay: i * 0.3,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Flowing time orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20"
          style={{
            left: `${orb.left}%`,
            width: orb.size,
            height: orb.size,
            top: '50%',
          }}
          animate={{
            y: ['-50%', '-150%', '50%', '-50%'],
            opacity: [0.3, 0.6, 0.3, 0.3],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Horizontal time flow lines */}
      <div className="absolute inset-0 opacity-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            style={{ top: `${20 + i * 25}%`, left: 0, right: 0 }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
};

// Tasks Card - Zen Ripple Background
export const TasksAtmosphere = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Central zen ripples */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-blue-500/20"
            style={{
              width: 100 * i,
              height: 100 * i,
              left: -50 * i,
              top: -50 * i,
            }}
            animate={{
              scale: [1, 1.3],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      
      {/* Floating focus particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Notes Card - Creative Paper Texture
export const NotesAtmosphere = () => {
  const inkSplashes = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
      size: 30 + Math.random() * 60,
      rotation: Math.random() * 360,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Paper texture grain */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Ink splashes */}
      {inkSplashes.map((splash) => (
        <motion.div
          key={splash.id}
          className="absolute rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 blur-xl"
          style={{
            left: `${splash.left}%`,
            top: `${splash.top}%`,
            width: splash.size,
            height: splash.size,
            transform: `rotate(${splash.rotation}deg)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// News Card - Information Flow
export const NewsAtmosphere = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Headline bars flowing */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 rounded-full bg-gradient-to-r from-violet-500/30 via-purple-500/20 to-transparent"
          style={{
            top: `${10 + i * 9}%`,
            left: '-100%',
            width: 100 + Math.random() * 200,
          }}
          animate={{
            x: ['0%', '200vw'],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
      
      {/* Trending indicator pulses */}
      <motion.div
        className="absolute top-10 right-10 w-4 h-4 rounded-full bg-amber-500/40"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Documents Card - File Constellation
export const DocumentsAtmosphere = () => {
  const nodes = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
    })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden opacity-40">
      {/* File nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.size,
            height: node.size,
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {nodes.slice(0, 10).map((node, i) => {
          const next = nodes[(i + 1) % 10];
          return (
            <motion.line
              key={i}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke="hsl(210, 100%, 60%)"
              strokeWidth="0.5"
              strokeOpacity="0.2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Travel Card - Journey Path
export const TravelAtmosphere = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* World map grid lines */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-violet-500/50"
            style={{ top: `${i * 10}%`, left: 0, right: 0 }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-violet-500/50"
            style={{ left: `${i * 10}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>
      
      {/* Destination beacon */}
      <motion.div
        className="absolute top-1/3 right-1/4"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-4 h-4 rounded-full bg-violet-500/60" />
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-violet-500/30 animate-ping" />
      </motion.div>
      
      {/* Flight path */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M10 80 Q 30 20, 50 50 T 85 30"
          fill="none"
          stroke="hsl(260, 80%, 60%)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};
