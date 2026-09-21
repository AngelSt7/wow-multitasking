import type { TecnicoResumen } from "../types/wow";
import { TechnicianService } from "./technician.service";

export class DomObserverService {

    private static globalObserver: MutationObserver | null = null;
    private static paintTimeout: ReturnType<typeof setTimeout> | null = null;

    static get globalObserverInstance(): MutationObserver | null {
        return DomObserverService.globalObserver;
    }

    public static start(tecnicosData: TecnicoResumen[]) {
        this.globalObserver?.disconnect();

        this.globalObserver = new MutationObserver(() => {

            if (this.paintTimeout) clearTimeout(this.paintTimeout);
            this.paintTimeout = setTimeout(() => {
                TechnicianService.addUbigeos(tecnicosData);
            }, 150);
        });

        this.globalObserver.observe(document.body, { childList: true, subtree: true });
    }

    public static stop() {
        this.globalObserver?.disconnect();
        this.globalObserver = null;
    }

}