import { Search, Zap, Eye } from "lucide-react";
import type { ModalType } from "../../context/UIContext";

export const RADIUS = 120;
export const VERTICAL_GAP = 100;

export const getActions = (
  setActiveModal: (type: ModalType, e?: React.MouseEvent) => void,
  runSearchScript: () => void
) => [
  { 
    id: "cintillos", 
    icon: Zap, 
    label: "Buscar cintillos", 
    color: "#e05c00", 
    angle: -90, 
    action: (e?: React.MouseEvent) => setActiveModal("cintillos", e) 
  },
  { 
    id: "filter", 
    icon: Eye, 
    label: "Vista rápida", 
    color: "#4a0080", 
    angle: -170, 
    action: (e?: React.MouseEvent) => setActiveModal("filter", e) 
  },
    { 
    id: "search", 
    icon: Search, 
    label: "Búsqueda", 
    color: "#1a1a2e", 
    angle: -130, 
    action: () => runSearchScript() 
  },
];

export const STORAGE_KEY = "multitasking";

export const idleIcons = [
  { icon: Zap,    color: "#e05c00" },
  { icon: Search, color: "#1a1a2e" },
  { icon: Eye,    color: "#4a0080" },
];

export const DEFAULT_PREFS = {
  position: "corner",
  mode: "onPress",
} satisfies {
  position: "corner" | "vertical";
  mode: "onPress" | "alwaysOpen";
};