import { useState, useEffect } from "react";

type Phase = "enter" | "visible" | "shrink" | "slideUp" | "done";

export const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 0→1.0s: line + logo + text animate in via CSS
    timers.push(setTimeout(() => setPhase("visible"), 1000));
    // 1.0→1.8s: pause (visible)
    timers.push(setTimeout(() => setPhase("shrink"), 1800));
    // 1.8→2.05s: content shrinks
    timers.push(setTimeout(() => setPhase("slideUp"), 2050));
    // 2.05→2.85s: overlay slides up
    timers.push(
      setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 2850)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (phase === "done") return null;

  const isSliding = phase === "slideUp";
  const isShrinking = phase === "shrink";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: "#ffffff",
        transform: isSliding ? "translateY(-100vh)" : "translateY(0)",
        transition: isSliding
          ? "transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)"
          : undefined,
      }}
    >
      {/* Dot grid decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 0)",
          backgroundSize: "40px 40px",
          opacity: 0.03,
        }}
      />

      {/* Subtle corner rings */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[260px] h-[260px] rounded-full border border-black pointer-events-none"
        style={{ opacity: 0.04 }}
      />
      <div
        className="absolute bottom-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full border border-black pointer-events-none"
        style={{ opacity: 0.03 }}
      />

      {/* Center content */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          animation: isShrinking
            ? "ls-shrink 0.25s cubic-bezier(0.4,0,1,1) forwards"
            : undefined,
        }}
      >
        {/* Logo */}
        <img
          src="/logo.png"
          alt="Мисс Стоматология"
          className="w-24 h-24 md:w-32 md:h-32 object-contain mb-6"
          style={{
            animation:
              "ls-logo-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s forwards",
            opacity: 0,
            filter: "drop-shadow(0 0 24px rgba(0,0,0,0.08))",
          }}
        />

        {/* Gradient line red→teal */}
        <div
          className="h-[2px] w-48 md:w-56 rounded-full mb-5"
          style={{
            background:
              "linear-gradient(90deg, hsl(0 65% 51%), hsl(168 76% 42%))",
            animation:
              "ls-line-grow 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s forwards, ls-line-pulse 2s ease-in-out 1s infinite",
            transform: "scaleX(0)",
            transformOrigin: "center",
          }}
        />

        {/* Clinic name */}
        <span
          className="text-sm md:text-base uppercase tracking-[0.3em] font-medium"
          style={{
            color: "rgba(0,0,0,0.55)",
            animation:
              "ls-text-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s forwards",
            opacity: 0,
          }}
        >
          Мисс Стоматология
        </span>
      </div>
    </div>
  );
};
