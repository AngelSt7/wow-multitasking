// src/context/MultitaskingContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { MultitaskingPrefs } from '../components/SpeedDeal/types';

const MULTITASKING_KEY = 'multitasking';
const defaultMultitasking: MultitaskingPrefs = { 
  position: 'corner', 
  mode: 'onPress', 
  autoSearchPronto: false 
};

interface MultitaskingContextType {
  mtPrefs: MultitaskingPrefs;
  updateMultitaskingPrefs: (updater: Partial<MultitaskingPrefs> | ((prev: MultitaskingPrefs) => MultitaskingPrefs)) => Promise<void>;
  isPrefsLoaded: boolean;
}

const MultitaskingContext = createContext<MultitaskingContextType | undefined>(undefined);

const validateContext = () => typeof chrome !== 'undefined' && chrome.storage?.local;

export function MultitaskingProvider({ children }: { children: React.ReactNode }) {
  const [mtPrefs, setMtPrefs] = useState<MultitaskingPrefs>(defaultMultitasking);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Cargar preferencias e iniciar el PUENTE DE COMUNICACIÓN
  useEffect(() => {
    async function loadPreferences() {
      if (!validateContext()) {
        setIsLoaded(true);
        return;
      }
      try {
        const result = await chrome.storage.local.get(MULTITASKING_KEY);
        const raw = result[MULTITASKING_KEY] as Partial<MultitaskingPrefs> | undefined;

        if (raw) {
          setMtPrefs({
            position: raw.position === 'vertical' ? 'vertical' : 'corner',
            mode: raw.mode === 'alwaysOpen' ? 'alwaysOpen' : 'onPress',
            autoSearchPronto: raw.autoSearchPronto === true,
          });
        }
      } catch (error) {
        console.error(`❌ Error cargando prefs:`, error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadPreferences();

    // 🎧 ESTO ES LO QUE CONECTA EL POPUP CON EL CONTENT SCRIPT (SPEEDDEAL)
    if (validateContext()) {
      const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
        if (areaName === 'local' && changes[MULTITASKING_KEY]) {
          const raw = changes[MULTITASKING_KEY].newValue as Partial<MultitaskingPrefs> | undefined;
          console.log('📡 [MultitaskingContext] Cambio detectado desde Chrome Storage:', raw);
          if (raw) {
            setMtPrefs({
              position: raw.position === 'vertical' ? 'vertical' : 'corner',
              mode: raw.mode === 'alwaysOpen' ? 'alwaysOpen' : 'onPress',
              autoSearchPronto: raw.autoSearchPronto === true,
            });
          }
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        try {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        } catch (e) {}
      };
    }
  }, []);

  // 2. Al guardar, solo escribimos en Chrome Storage. 
  // El evento `onChanged` de arriba se encargará de actualizar el React del Popup Y el React inyectado.
  const updateMultitaskingPrefs = async (updater: Partial<MultitaskingPrefs> | ((prev: MultitaskingPrefs) => MultitaskingPrefs)) => {
    let nextPrefs: MultitaskingPrefs;
    if (typeof updater === 'function') {
      nextPrefs = updater(mtPrefs);
    } else {
      nextPrefs = { ...mtPrefs, ...updater };
    }

    if (!validateContext()) {
      setMtPrefs(nextPrefs); // Fallback si no hay extensión de Chrome
      return;
    }

    try {
      // Al guardar aquí, Chrome disparará `onChanged` en TODAS las instancias de la extensión
      await chrome.storage.local.set({ [MULTITASKING_KEY]: nextPrefs });
    } catch (error) {
      console.error(`❌ Error guardando prefs:`, error);
    }
  };

  const value = useMemo(() => ({
    mtPrefs,
    updateMultitaskingPrefs,
    isPrefsLoaded: isLoaded
  }), [mtPrefs, isLoaded]);

  return (
    <MultitaskingContext.Provider value={value}>
      {children}
    </MultitaskingContext.Provider>
  );
}

export function useMultitasking() {
  const context = useContext(MultitaskingContext);
  if (context === undefined) {
    throw new Error('useMultitasking debe ser usado dentro de un MultitaskingProvider');
  }
  return context;
}