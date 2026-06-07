import { motion } from "framer-motion";
import type { SpeedDealVariantCommonProps } from "./types";

interface Props extends SpeedDealVariantCommonProps {
  getContainerPosition: (index: number, angle: number) => { x: number; y: number };
  isMobile: boolean;
}

export default function RadialAlwaysOpen({
  actions,
  onAction,
  getContainerPosition,
  isMobile
}: Props) {
  return (
    <nav className="fixed bottom-3 right-3 z-50 pointer-events-auto">
      <div className="relative w-14 h-14 flex items-center justify-center">

        {actions.map((action, i) => {
          const { x, y } = getContainerPosition(i, action.angle);

          return (
            <motion.div
              key={action.id}
              className="absolute flex flex-col items-center gap-1.5"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
              animate={{ opacity: 1, x, y, scale: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 24, delay: i * 0.05 }}
            >
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  action.action(e);
                  onAction?.(action.id);
                }}
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: action.color }}
              >
                <action.icon size={18} color="white" />
              </button>

              <span className={`text-[10px] font-bold bg-white px-1 rounded shadow
                ${isMobile ? "static mt-1" : "absolute top-12"}`}>
                {action.label}
              </span>
            </motion.div>
          );
        })}

      </div>
    </nav>
  );
}