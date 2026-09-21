import type { SwitchItem } from "../interfaces";
import {
    Zap, Search, Binoculars
} from 'lucide-react';

export const Switches: SwitchItem[] = [
  { id: 'fast', icon: Zap, name: 'Fijar fecha', desc: 'Fijar fechas en ventana' },
  { id: 'popover', icon: Search, name: 'Vista rápida', desc: 'Popover con info de slots' },
  { id: 'autoSearchPronto', icon: Binoculars, name: 'Búsqueda automática', desc: 'Buscar automáticamente en pronto web' },
]