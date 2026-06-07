import { createContext, useContext } from 'react';
import type { ModalType } from './UIContext';

interface UIContextType {
  activeModal: ModalType;
  anchorRect: DOMRect | null;
  setActiveModal: (type: ModalType, e?: React.MouseEvent) => void;
  closeModals: () => void;
  setAnchorRect: (rect: DOMRect | null) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI debe usarse dentro de UIProvider");
  return context;
};