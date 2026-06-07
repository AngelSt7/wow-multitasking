import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRef } from "react";
import type { SpeedDealToggleVariantProps } from "./types";

export default function RadialToggle(props: SpeedDealToggleVariantProps) {
  const {
    actions, open, toggle, onAction,
    idleBg, IdleIcon,
    getContainerPosition, isVertical, isMobile
  } = props;

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <nav className="fixed bottom-3 right-3 z-50 pointer-events-auto">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <AnimatePresence>
          {open && actions.map((action, i) => {
            const { x, y } = getContainerPosition(i, action.angle);
            return (
              <motion.div
                key={action.id}
                className="absolute flex flex-col items-center gap-1.5"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                animate={{ opacity: 1, x, y, scale: 1 }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                transition={{ type: "spring", stiffness: 360, damping: 24, delay: i * 0.05 }}
              >
                <button
                  ref={el => { buttonRefs.current[i] = el; }}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    action.action(e);
                    onAction?.(action.id);
                  }}
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg
                             hover:scale-110 transition-transform focus:outline-none
                             focus:ring-2 focus:ring-white/40"
                  style={{ backgroundColor: action.color }}
                  aria-label={action.label}
                >
                  <action.icon size={18} color="white" strokeWidth={2} />
                </button>
                <motion.span
                  initial={{ opacity: 0, y: isVertical || isMobile ? -5 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-[10px] font-bold text-zinc-700 whitespace-nowrap
                              bg-zinc-50 py-0.5 px-1 rounded-md shadow-md border border-zinc-100
                              ${isVertical || isMobile ? "static mt-1" : "absolute top-12"}`}
                >
                  {action.label}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div className="relative z-10">
          <button
            onClick={toggle}
            aria-expanded={open}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl overflow-hidden transition-colors focus:outline-none"
            style={{ backgroundColor: open ? "#1a1f2e" : idleBg }}
          >
            {!open && (
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: idleBg }}
                animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <X size={22} color="white" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
                    <IdleIcon size={22} color="white" strokeWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </button>
        </div>
      </div>
    </nav>
  );
}