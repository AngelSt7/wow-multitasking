import { Search, Zap, Eye, Binoculars } from "lucide-react";
import type { ModalType } from "../../context/UIContext";
import { ProntoUiService } from "../../services/pronto-ui.service";

export const RADIUS = 150;       // subido de 130 -> compensa el spread más cerrado
export const VERTICAL_GAP = 90;  // sin cambios, el vertical va bien

export const getActions = (
  setActiveModal: (type: ModalType, e?: React.MouseEvent) => void,
  runSearchScript: () => void
) => [
    { 
    id: "search", 
    icon: Search, 
    label: "Búsqueda", 
    color: "#1a1a2e", 
    angle: -90, 
    action: () => runSearchScript() 
  },
  { 
    id: "cintillos", 
    icon: Zap, 
    label: "Buscar cintillos", 
    color: "#e05c00", 
    angle: -118.33, 
    action: (e?: React.MouseEvent) => setActiveModal("cintillos", e) 
  },
    { 
    id: "pronto", 
    icon: Binoculars, 
    label: "Pronto", 
    color: "#0d7d6f", 
    angle: -146.67, 
    action: () => ProntoUiService.updateProntoAlerts()
  },
  { 
    id: "filter", 
    icon: Eye, 
    label: "Vista rápida", 
    color: "#4a0080", 
    angle: -175, 
    action: (e?: React.MouseEvent) => setActiveModal("filter", e) 
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
  autoSearchPronto: false,
} satisfies {
  position: "corner" | "vertical";
  mode: "onPress" | "alwaysOpen";
  autoSearchPronto: boolean;
};

export const MESES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};