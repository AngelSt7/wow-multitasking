import { useState, useEffect } from 'react';
import type { MultitaskingPrefs } from '../components/SpeedDeal/types';

const MULTITASKING_KEY = 'multitasking';
const defaultMultitasking: MultitaskingPrefs = {
    position: 'corner',
    mode: 'onPress',
    autoSearchPronto: false
};

const validateContext = () => typeof chrome !== 'undefined' && chrome.storage?.local;


export function useMultitaskingPrefs() {
    const [mtPrefs, setMtPrefs] = useState<MultitaskingPrefs>(defaultMultitasking);
    const [isLoaded, setIsLoaded] = useState(false);

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
            } catch (error: any) {
                console.error(`❌ Error cargando prefs:`, error);
            } finally {
                setIsLoaded(true);
            }
        }

        loadPreferences();

        // 🎧 ¡ESCUCHAR CAMBIOS DE CHROME STORAGE EN TIEMPO REAL!
        if (validateContext()) {
            const handleStorageChange = (changes: any, areaName: string) => {
                if (areaName === 'local' && changes[MULTITASKING_KEY]) {
                    const raw = changes[MULTITASKING_KEY].newValue as Partial<MultitaskingPrefs> | undefined;
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
                } catch (e) { }
            };
        }
    }, []);


    const updateMultitaskingPrefs = async (updater: Partial<MultitaskingPrefs> | ((prev: MultitaskingPrefs) => MultitaskingPrefs)) => {
        let nextPrefs: MultitaskingPrefs;

        if (typeof updater === 'function') {
            nextPrefs = updater(mtPrefs);
        } else {
            nextPrefs = { ...mtPrefs, ...updater };
        }

        setMtPrefs(nextPrefs);

        if (!validateContext()) return;

        try {
            await chrome.storage.local.set({ [MULTITASKING_KEY]: nextPrefs });
        } catch (error: any) {
            if (error?.message?.includes('Extension context invalidated')) {
                console.warn(`⚠️ [Popup] Contexto de extensión invalidado al guardar.`);
            } else {
                console.error(`❌ [Popup] Error guardando multitasking prefs:`, error);
            }
        }
    };

    return { mtPrefs, updateMultitaskingPrefs, isPrefsLoaded: isLoaded };
}