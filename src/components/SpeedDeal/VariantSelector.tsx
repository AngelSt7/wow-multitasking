import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { MultitaskingPrefs } from "./types";

interface VariantSelectorProps {
  prefs: MultitaskingPrefs;
  onChange: (prefs: MultitaskingPrefs) => void;
  onClose: () => void;
}

const variants: Array<{
  position: MultitaskingPrefs["position"];
  mode: MultitaskingPrefs["mode"];
  label: string;
  desc: string;
}> = [
  {
    position: "corner",
    mode: "onPress",
    label: "Esquina · Presionar",
    desc: "Boton en esquina, se abre al tocar",
  },
  {
    position: "corner",
    mode: "alwaysOpen",
    label: "Esquina · Siempre abierto",
    desc: "Boton en esquina, acciones siempre visibles",
  },
  {
    position: "vertical",
    mode: "onPress",
    label: "Vertical · Presionar",
    desc: "Barra lateral, se abre al tocar",
  },
  {
    position: "vertical",
    mode: "alwaysOpen",
    label: "Vertical · Siempre abierto",
    desc: "Barra lateral siempre visible",
  },
];

export default function VariantSelector({ prefs, onChange, onClose }: VariantSelectorProps) {
  const handleVariantClick = (nextPrefs: MultitaskingPrefs) => {
    onChange(nextPrefs);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 12 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="absolute bottom-16 right-0 w-64 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50"
      style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #0f1320 100%)" }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-bold text-white/70 tracking-widest uppercase">Variante</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {variants.map((variant) => {
          const isSelected = prefs.position === variant.position && prefs.mode === variant.mode;

          return (
            <button
              key={`${variant.position}-${variant.mode}`}
              onClick={() => handleVariantClick({ position: variant.position, mode: variant.mode })}
              className={`w-full px-4 py-3 text-left border-b border-white/5 transition-all
                ${isSelected ? "bg-white/10 border-l-2 border-l-blue-500" : "hover:bg-white/5"}
              `}
            >
              <div className="font-medium text-white text-sm">{variant.label}</div>
              <div className="text-xs text-white/50 mt-0.5">{variant.desc}</div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
