import { Search, Zap, Eye, Binoculars } from "lucide-react";
import type { ModalType } from "../../context/UIContext";
import { actualizarAlertasDePronto } from "../../content";

export const RADIUS = 150;       // subido de 130 -> compensa el spread más cerrado
export const VERTICAL_GAP = 90;  // sin cambios, el vertical va bien

export const getActions = (
  setActiveModal: (type: ModalType, e?: React.MouseEvent) => void,
  runSearchScript: () => void
) => [
  { 
    id: "cintillos", 
    icon: Zap, 
    label: "Buscar cintillos", 
    color: "#e05c00", 
    angle: -90,  // arriba, justo encima del botón central
    action: (e?: React.MouseEvent) => setActiveModal("cintillos", e) 
  },
  { 
    id: "search", 
    icon: Search, 
    label: "Búsqueda", 
    color: "#1a1a2e", 
    angle: -118.33, 
    action: () => runSearchScript() 
  },
  { 
    id: "filter", 
    icon: Eye, 
    label: "Vista rápida", 
    color: "#4a0080", 
    angle: -146.67, 
    action: (e?: React.MouseEvent) => setActiveModal("filter", e) 
  },
  { 
    id: "pronto", 
    icon: Binoculars, 
    label: "Pronto", 
    color: "#0d7d6f", 
    angle: -175, 
    action: () => actualizarAlertasDePronto() 
  },
];

export const STORAGE_KEY = "multitasking";

export const idleIcons = [
  { icon: Zap,        color: "#e05c00" },
  { icon: Search,     color: "#1a1a2e" },
  { icon: Eye,        color: "#4a0080" },
  { icon: Binoculars, color: "#0d7d6f" },
];

export const DEFAULT_PREFS = {
  position: "corner",
  mode: "onPress",
} satisfies {
  position: "corner" | "vertical";
  mode: "onPress" | "alwaysOpen";
};