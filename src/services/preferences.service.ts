import type { MultitaskingPrefs } from "../components/SpeedDeal/types";

export class PreferencesService {

    private static readonly MULTITASKING_KEY = 'multitasking';
    private static readonly defaultMultitasking: MultitaskingPrefs = { position: 'corner', mode: 'onPress', autoSearchPronto: false }

    static async getPreferences(): Promise<MultitaskingPrefs> {
        this.validateContext();
        
        try {
            const result = await chrome.storage.local.get(this.MULTITASKING_KEY);
            const raw = result[this.MULTITASKING_KEY] as Partial<MultitaskingPrefs> | undefined;

            if (!raw) return this.defaultMultitasking;

            return {
                position: raw.position === 'vertical' ? 'vertical' : 'corner',
                mode: raw.mode === 'alwaysOpen' ? 'alwaysOpen' : 'onPress',
                autoSearchPronto: raw.autoSearchPronto === true,
            };

        } catch (error: any) {
            if (error?.message?.includes('Extension context invalidated')) {
                console.warn(`⚠️ [Popup] Contexto de extensión invalidado.`);
            } else {
                console.error(`❌ [Popup] Error cargando multitasking prefs:`, error);
            }
            return this.defaultMultitasking;
        }
    }

    static async setPreferences(prefs: MultitaskingPrefs): Promise<void> {
        this.validateContext();
        try {
            await chrome.storage.local.set({ [this.MULTITASKING_KEY]: prefs });
        } catch (error: any) {
            if (error?.message?.includes('Extension context invalidated')) {
                console.warn(`⚠️ [Popup] Contexto de extensión invalidado al guardar.`);
            } else {
                console.error(`❌ [Popup] Error guardando multitasking prefs:`, error);
            }
        }
    }

    private static validateContext() : MultitaskingPrefs | undefined {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) {
            console.warn(`⚠️ [Popup] Chrome Storage API no disponible`);
            return this.defaultMultitasking;
        }
    }


}