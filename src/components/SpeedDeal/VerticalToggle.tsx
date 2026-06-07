import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { SpeedDealToggleVariantProps } from "./types";

export default function VerticalToggle({
  actions,
  open,
  toggle,
  onAction,
  idleBg,
  IdleIcon,
}: SpeedDealToggleVariantProps) {
  return (
    <nav
      className="fixed bottom-3 right-3 z-50 pointer-events-auto flex flex-col items-end gap-2"
      aria-label="WOW Multitasking acciones rapidas"
    >
      <AnimatePresence>
        {open && [...actions].reverse().map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 360, damping: 24, delay: index * 0.05 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] font-bold text-zinc-700 whitespace-nowrap
                             bg-zinc-50 py-0.5 px-1.5 rounded-md shadow-md border border-zinc-100">
              {action.label}
            </span>
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                action.action(e);
                onAction?.(action.id);
              }}
              className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: action.color }}
              aria-label={action.label}
              title={action.label}
            >
              <action.icon size={18} color="white" strokeWidth={2} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="relative z-10">
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={open ? "Cerrar acciones" : "Abrir acciones rapidas"}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl overflow-hidden"
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
          {open ? <X size={22} color="white" strokeWidth={2.5} /> : <IdleIcon size={22} color="white" strokeWidth={2} />}
        </button>
      </div>
    </nav>
  );
}