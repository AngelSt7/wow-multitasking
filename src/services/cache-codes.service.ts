interface CacheStorageStructure {
    expires: number;
    data: Record<string | number, number>;
}

export class CacheCodesService {
    private static readonly STORAGE_KEY = 'cache-codes';

    /**
     * Calcula la próxima medianoche (00:00:00 del día siguiente) en milisegundos.
     */
    private static getNextMidnight(): number {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
    }

    /**
     * Procesa la respuesta cruda de la API y extrae el mapa de CSG.
     */
    public static getCsgMap(raw: any): Record<string | number, number> {
        const result: Record<string | number, number> = {};
        const rows = raw?.data?.data || [];

        for (const item of rows) {
            for (const key in item) {
                const visit = item[key]?.visit;
                if (visit?.csg?.code && visit?.csg?.id) {
                    result[visit.csg.code] = visit.csg.id;
                }
            }
        }

        return result;
    }

    /**
     * Obtiene el caché actual. Si ya pasó la medianoche, se borra y retorna un objeto vacío.
     */
    public static buildStorage(): CacheStorageStructure {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            return { expires: this.getNextMidnight(), data: {} };
        }

        try {
            const cache: CacheStorageStructure = JSON.parse(raw);

            // Si ya venció la medianoche, borramos todo
            if (!cache.expires || Date.now() >= cache.expires) {
                localStorage.removeItem(this.STORAGE_KEY);
                return { expires: this.getNextMidnight(), data: {} };
            }

            return cache;
        } catch {
            localStorage.removeItem(this.STORAGE_KEY);
            return { expires: this.getNextMidnight(), data: {} };
        }
    }

    /**
     * Extrae los nuevos códigos de la API y los concatena/combina con los existentes
     * sin alterar el expires original (a menos que ya haya expirado).
     */
    public static appendFromApi(rawApiResponse: any): CacheStorageStructure {
        const currentCache = this.buildStorage(); // Valida y obtiene data existente
        const newCodes = this.getCsgMap(rawApiResponse);

        const updatedCache: CacheStorageStructure = {
            expires: currentCache.expires || this.getNextMidnight(),
            data: {
                ...currentCache.data, // 
                ...newCodes           
            }
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedCache));
        return updatedCache;
    }

    public static getItem(key: string | number){
        return this.buildStorage().data[key];
    }
}