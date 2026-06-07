import type { LucideProps } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
export type SpeedDialPosition = "corner" | "vertical";
export type SpeedDialMode = "onPress" | "alwaysOpen";

export interface MultitaskingPrefs {
  position: SpeedDialPosition;
  mode: SpeedDialMode;
}

export interface SpeedDialAction {
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    label: string;
    color: string;
    angle: number;
    id: string;
    action: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface SpeedDealVariantCommonProps {
  actions: SpeedDialAction[];
  onAction?: (id: string) => void;
}

export interface SpeedDealToggleVariantProps extends SpeedDealVariantCommonProps {
  open: boolean;
  toggle: () => void;
  idleBg: string;
  IdleIcon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  getContainerPosition: (i: number, angle: number) => { x: number; y: number };
  isVertical: boolean;
  isMobile: boolean;
}