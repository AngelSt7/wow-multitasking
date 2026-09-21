import { motion } from 'framer-motion';
import type { SpeedDealVariantCommonProps } from "./types";

export default function VerticalAlwaysOpen({
  actions,
  onAction,
}: SpeedDealVariantCommonProps) {
  return (
    <nav
      className="fixed bottom-3 right-3 z-50 pointer-events-none flex flex-col items-end gap-2"
      aria-label="WOW Multitasking acciones rápidas"
    >
      {[...actions].reverse().map((action, i) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 24, delay: i * 0.06 }}
          className="flex flex-row items-center gap-2"
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
            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center shadow-lg
                       hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-white/40 pointer-events-auto"
            style={{ backgroundColor: action.color }}
            aria-label={action.label}
            title={action.label}
          >
            <action.icon size={18} color="white" strokeWidth={2} />
          </button>
        </motion.div>
      ))}
    </nav>
  );
}