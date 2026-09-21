import type { TecnicoResumen } from "../types/wow";
import { DomObserverService } from "./dom-observer.service";

export class TechnicianService {

    public static processTechniciansJson(jsonResponse: any): TecnicoResumen[] {
        const dataArray = jsonResponse.data?.data || [];
        
        const resultado = dataArray.map((item: any) => {
            const currentItem = item;
            return {
                techId: currentItem.technician?.id || 0,
                nombre: currentItem.technician?.name?.replace(/\s+/g, ' ').trim() || 'SIN NOMBRE',
                cuadrilla: currentItem.cuadrilla?.name || 'SIN CUADRILLA',
                zonasBase: (currentItem.ubigeos || []).map((u: any) =>
                    `${u.departament} - ${u.province} - ${u.district}`
                ),
                servicios: Object.keys(currentItem)
                    .filter(key => !isNaN(Number(key)) && currentItem[key]?.visit?.csg)
                    .map(key => {
                        const v = currentItem[key].visit;
                        return {
                            id: Number(v.csg.id),
                            codigo: v.csg.code,
                            type: v.type.description,
                            idTypeService: v.type.id,
                            distrito: v.ubigeo.district,
                            estado: v.state.description,
                            idState: v.state.id,
                            assignationDate: v.assigned_at,
                        };
                    })
            };
        });

        return resultado;
    }

    public static addUbigeos(tecnicosData: TecnicoResumen[]) {
        if (tecnicosData.length === 0) {
            console.warn("[WOW Service] addUbigeos cancelado: El arreglo de técnicos está vacío.");
            return;
        }

        DomObserverService.stop();

        const nameContainers = document.querySelectorAll<HTMLDivElement>('[data-copy-Technician="true"]');

        if (nameContainers.length === 0) {
            console.warn("[WOW Service] Selector principal dio 0. ¿Seguro que el atributo es exacto?");
        }

        nameContainers.forEach((nameContainer, index) => {
            const colContainer = nameContainer.closest<HTMLDivElement>('.flex.flex-col.items-start.justify-center');
            if (!colContainer) {
                console.warn(`[WOW Service] [${index}] No se encontró el contenedor '.flex.flex-col...' padre.`);
                return;
            }
            
            if (colContainer.querySelector('.wow-ui-ubigeos')) return;

            const rawName = nameContainer.textContent?.trim() ?? '';
            const cleanName = rawName.split(' (')[0].replace(/\s+/g, ' ').trim().toUpperCase();

            const match = tecnicosData.find(t => {
                const nombreJson = t.nombre.replace(/\s+/g, ' ').trim().toUpperCase();
                return nombreJson.includes(cleanName) || cleanName.includes(nombreJson);
            });

            if (!match) {
                return;
            }

            const ubigeoBox = this.getBox();
            const uniqueZones = [...new Set(match.zonasBase)];
            ubigeoBox.innerHTML = `
              <div style="font-weight:700;font-size:9px;color:#15803d;margin-bottom:3px;">📍 UBIGEOS:</div>
              ${uniqueZones.map(z => `<div>• ${z}</div>`).join('')}
            `;
            colContainer.appendChild(ubigeoBox);
        });

        DomObserverService.start(tecnicosData);
    }

    private static getBox() {
        const ubigeoBox = document.createElement('div');
        ubigeoBox.className = 'wow-ui-ubigeos';
        Object.assign(ubigeoBox.style, {
            marginTop: '8px',
            padding: '6px 8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#166534',
            lineHeight: '1.5',
            width: '100%',
            boxSizing: 'border-box',
        });
        return ubigeoBox;
    }
}