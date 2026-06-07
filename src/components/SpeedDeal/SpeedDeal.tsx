// src/components/SpeedDeal/SpeedDeal.tsx
import { useEffect, useMemo, useState } from "react";
import "../../App.css";
import { getActions, idleIcons, RADIUS, STORAGE_KEY, VERTICAL_GAP } from "./constants";
import RadialAlwaysOpen from "./RadialAlwaysOpen";
import RadialToggle from "./RadialToggle";
import { parsePrefs, loadPrefs } from "./storage";
import { useSpeedDial } from "./useSpeedDial";
import VerticalAlwaysOpen from "./VerticalAlwaysOpen";
import VerticalToggle from "./VerticalToggle";
import { useUI } from "../../context/useUI";
import { runSearchScript } from "../../ts/logic";

interface Props {
  onAction?: (id: string) => void;
}

type VariantKey = "vertical-alwaysOpen" | "corner-alwaysOpen" | "corner-onPress" | "vertical-onPress";

export default function SpeedDeal({ onAction }: Props) {
  const { setActiveModal } = useUI();
  const [prefs, setPrefs] = useState(() => loadPrefs());

  const { open: _open, idleIndex, isMobile, toggle } = useSpeedDial(3, idleIcons.length);
  
  const actions = useMemo(() => {
    return getActions(setActiveModal, runSearchScript);
  }, [setActiveModal]);

  const isAlwaysOpen = prefs.mode === "alwaysOpen";
  const isVertical = prefs.position === "vertical";
  const open = isAlwaysOpen ? true : _open;

  const IdleIcon = idleIcons[idleIndex].icon;
  const idleBg = idleIcons[idleIndex].color;

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    try {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const raw = result[STORAGE_KEY];
        if (raw) setPrefs(parsePrefs(raw));
      });
      
      const handler = (changes: any, area: string) => {
        if (area === "local" && changes[STORAGE_KEY]) setPrefs(parsePrefs(changes[STORAGE_KEY].newValue));
      };
      
      chrome.storage.onChanged.addListener(handler);
      return () => {
        try {
          if (chrome.storage) chrome.storage.onChanged.removeListener(handler);
        } catch (error: any) {
          if (error?.message?.includes('Extension context invalidated')) {
          }
        }
      };
    } catch (error: any) {
      if (error?.message?.includes('Extension context invalidated')) {
      } else {
        console.error(`❌ [SpeedDeal] Error accediendo a chrome.storage:`, error);
      }
    }
  }, []);

  const getContainerPosition = (index: number, angleDeg: number) => {
    if (isVertical || isMobile) return { x: 0, y: -(index + 1) * VERTICAL_GAP };
    const rad = (angleDeg * Math.PI) / 180;
    return { x: Math.cos(rad) * RADIUS, y: Math.sin(rad) * RADIUS };
  };

  const variantKey = useMemo<VariantKey>(() => {
    if (prefs.position === "vertical" && prefs.mode === "alwaysOpen") return "vertical-alwaysOpen";
    if (prefs.position === "corner" && prefs.mode === "alwaysOpen") return "corner-alwaysOpen";
    if (prefs.position === "corner" && prefs.mode === "onPress") return "corner-onPress";
    return "vertical-onPress";
  }, [prefs.mode, prefs.position]);

  const commonProps = { actions, onAction, isMobile };
  const toggleProps = { ...commonProps, open, toggle, idleBg, IdleIcon, getContainerPosition, isVertical };

  switch (variantKey) {
    case "vertical-alwaysOpen": return <VerticalAlwaysOpen {...commonProps} />;
    case "corner-alwaysOpen": return <RadialAlwaysOpen {...commonProps} getContainerPosition={getContainerPosition} />;
    case "corner-onPress": return <RadialToggle {...toggleProps} />;
    case "vertical-onPress": return <VerticalToggle {...toggleProps} />;
    default: return null;
  }
}