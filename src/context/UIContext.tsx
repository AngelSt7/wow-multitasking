import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from "react";
import HeadbandManner from "../manners/HeadbandManner";
import { UIContext } from "./useUI";
import TechnicianManner from '../manners/TechnicianManner';

export type ModalType = 'none' | 'cintillos' | 'filter';

const MODAL_GAP = 12;

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [modalPosition, setModalPosition] = useState<{ right: number; top: number } | null>(null);
  const anchorRef = useRef<Element | null>(null);

  const calcPosition = useCallback((el: Element) => {
    const rect = el.getBoundingClientRect();
    setAnchorRect(rect);
    setModalPosition({
      right: window.innerWidth - rect.right,
      top: rect.top - MODAL_GAP,
    });
  }, []);

  useEffect(() => {
    if (activeModal === 'none') return;
    const handleResize = () => {
      if (anchorRef.current) calcPosition(anchorRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeModal, calcPosition]);

  const openModal = (type: ModalType, event?: React.MouseEvent) => {
    if (type === 'none') { closeModals(); return; }
    const target = event?.currentTarget;
    if (target instanceof Element) {
      anchorRef.current = target;
      calcPosition(target);
    }
    setActiveModal(type);
  };

  const closeModals = () => {
    setActiveModal('none');
    setAnchorRect(null);
    setModalPosition(null);
    anchorRef.current = null;
  };

  return (
    <UIContext.Provider value={{ activeModal, setActiveModal: openModal, closeModals, setAnchorRect, anchorRect }}>
      {children}
      <AnimatePresence>
        {activeModal !== 'none' && modalPosition && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              pointerEvents: 'none',
            }}
          >


            <motion.div
              style={{
                position: 'absolute',
                right: modalPosition.right,
                top: modalPosition.top,
                translateY: '-100%',
                pointerEvents: 'auto',
                width: 'max-content',
              }}
              // --- CAMBIOS AQUÍ ---
              initial={{ x: '100%', opacity: 0 }} // Empieza fuera de la pantalla (derecha)
              animate={{ x: 0, opacity: 1 }}       // Entra a su posición original
              exit={{ x: '100%', opacity: 0 }}    // Sale hacia la derecha
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} // Efecto suave de resorte
            // ---------------------
            >
              <div style={{
                filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.2))',
                width: '600px' // Asegúrate de que este ancho sea el que quieres
              }}>
                {activeModal === 'cintillos' && <HeadbandManner onClose={closeModals} />}
                {activeModal === 'filter' && <TechnicianManner onClose={closeModals} />}
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </UIContext.Provider>
  );
};