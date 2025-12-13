export const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />

      {/* Animated gradient blobs */}
      <div 
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow"
        style={{ animationDuration: "4s" }}
      />
      <div 
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse-glow"
        style={{ animationDuration: "5s", animationDelay: "1s" }}
      />
      <div 
        className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-secondary/10 blur-3xl animate-pulse-glow"
        style={{ animationDuration: "6s", animationDelay: "2s" }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Radial gradient from center */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 100%)",
          opacity: 0.4,
        }}
      />
    </div>
  );
};
