import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "up" | "left" | "right" | "scale";
  delay?: number;
}

export const ScrollReveal = ({ children, className = "", animation = "up", delay = 0 }: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const animClass = {
    up: "animate-reveal-up",
    left: "animate-reveal-left",
    right: "animate-reveal-right",
    scale: "animate-reveal-scale",
  }[animation];

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animClass : "opacity-0"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
