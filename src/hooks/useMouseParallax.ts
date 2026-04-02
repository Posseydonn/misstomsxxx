import { useEffect, useRef, useState } from "react";

interface ParallaxPosition {
  x: number;
  y: number;
}

export function useMouseParallax(sensitivity = 1): ParallaxPosition {
  const [position, setPosition] = useState<ParallaxPosition>({ x: 0, y: 0 });
  const targetRef = useRef<ParallaxPosition>({ x: 0, y: 0 });
  const currentRef = useRef<ParallaxPosition>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const activeRef = useRef(true);

  useEffect(() => {
    // Disable on touch-only devices
    const isHoverDevice = window.matchMedia("(hover: hover)").matches;
    if (!isHoverDevice) {
      activeRef.current = false;
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * sensitivity,
        y: (e.clientY / window.innerHeight - 0.5) * sensitivity,
      };
    };

    const animate = () => {
      const lerp = 0.08;
      currentRef.current = {
        x: currentRef.current.x + (targetRef.current.x - currentRef.current.x) * lerp,
        y: currentRef.current.y + (targetRef.current.y - currentRef.current.y) * lerp,
      };

      // Only update state when values actually change meaningfully
      const dx = Math.abs(currentRef.current.x - position.x);
      const dy = Math.abs(currentRef.current.y - position.y);
      if (dx > 0.0001 || dy > 0.0001) {
        setPosition({ ...currentRef.current });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [sensitivity]);

  return position;
}
