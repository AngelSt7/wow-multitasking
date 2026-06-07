import { useState, useEffect } from "react";

export function useSpeedDial(_actionsCount: number, idleIconsCount: number) {
  const [open, setOpen] = useState(false);
  const [idleIndex, setIdleIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open) return;
    const interval = setInterval(() => {
      setIdleIndex((prev) => (prev + 1) % idleIconsCount);
    }, 1800);
    return () => clearInterval(interval);
  }, [open, idleIconsCount]);

  const toggle = () => setOpen(!open);

  return { open, idleIndex, isMobile, toggle };
}