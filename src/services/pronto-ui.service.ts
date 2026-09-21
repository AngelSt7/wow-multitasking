import type { ProntoInstallation } from "../interfaces/pronto-install.interface";
import { sileo } from "sileo";
// import { mockResponseFromPronto } from "../mock/test";

export class ProntoUiService {

    static updateProntoAlerts() {
        sileo.promise(this.getTaksToPronto(), {
            loading: {
                title: 'Obteniendo tareas Pronto...',
                description: 'Esto puede tardar unos segundos.',
            },
            success: (tasks: ProntoInstallation[]) => {
                this.injectTasks(tasks);

                const deparmentString = this.getDepartments(tasks);

                return {
                    title: `${tasks.length} tareas Pronto encontradas para ${deparmentString}`,
                    description: tasks.length > 0
                        ? "Se actualizaron las invitaciones pendientes para todos los departamentos."
                        : "No hay invitaciones pendientes para ningún departamento.",
                };
            },
            error: (err: unknown) => {
                const message = err instanceof Error ? err.message : 'No se pudo obtener Pronto';
                console.warn('[Wow Multitasking]', message);
                return {
                    title: 'Error al buscar tareas',
                    description: message,
                };
            },
        });
    }

    private static getTaksToPronto(): Promise<ProntoInstallation[]> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'GET_PRONTO_TASKS' }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (!response) {
                    reject(new Error('No se recibió respuesta del background'));
                    return;
                }
                if (!response.success) {
                    reject(new Error(response.error || 'Error desconocido'));
                    return;
                }
                const tasks = response.data?.data?.maintenanceManager_FindTasks || [];

                resolve(tasks);
            });
        });
    }

    private static injectTasks(tasks: ProntoInstallation[]) {
        console.log('[Wow Multitasking] Procesando inyección de tareas en UI. Total crudo:', tasks.length);

        const rowContainer = document.querySelector('vex-por-instalador .px-gutter.pt-6.pb-14 .flex.md\\:flex-row.flex-col');
        if (!rowContainer) {
            console.warn('[Wow Multitasking] No se encontró el contenedor de la fila principal.');
            return;
        }

        const boxAnterior = document.getElementById('wow-pronto-panel');
        if (boxAnterior) boxAnterior.remove();

        const prontoPanel = this.getPanelContainer();

        const cantidad = tasks.length;

        if (cantidad === 0) {
            prontoPanel.innerHTML = `
      <div style="font-weight: 700; color: #6b7280; display: flex; align-items: center; gap: 6px;">
        🔔 Pronto: 0 invitaciones pendientes para [GYGA]
      </div>
    `;
        } else {

            const codigosHtml = tasks.map(t => {
                const base = t.address.ubigeo
                const location = `${base.department} / ${base.province} / ${base.district}`;
                return `
<div style="display: flex; align-items: center; justify-content: space-between; background-color: #ffffff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 8px 12px; min-width: 180px; flex: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.05); user-select: none; -webkit-user-select: none;">
  
  <div style="display: flex; gap: 3px; align-items: flex-start;">
    
    <button 
      onclick="navigator.clipboard.writeText('${t.customerCode}'); this.style.borderColor='#a855f7';"
      title="Clic para copiar código comercial"
      style="background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 4px; padding: 2px 6px; font-weight: 800; font-family: monospace; font-size: 12px; color: #581c87; cursor: pointer; transition: all 0.15s ease; outline: none; display: inline-flex; align-items: center;"
      onmouseover="this.style.borderColor='#c084fc'; this.style.backgroundColor='#f3e8ff';"
      onmouseout="this.style.borderColor='#f3e8ff'; this.style.backgroundColor='#faf5ff';"
      onmousedown="this.style.transform='scale(0.96)';"
      onmouseup="this.style.transform='scale(1)';"
    >
      ${t.customerCode}
    </button>

    <button 
      onclick="navigator.clipboard.writeText('${t.id}'); this.style.borderColor='#a855f7';"
      title="Clic para copiar ID de tarea"
      style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 4px; padding: 2px 6px; font-weight: 700; font-family: monospace; font-size: 11px; color: #4b5563; cursor: pointer; transition: all 0.15s ease; outline: none; display: inline-flex; align-items: center;"
      onmouseover="this.style.borderColor='#d1d5db'; this.style.backgroundColor='#f3f4f6';"
      onmouseout="this.style.borderColor='#f3f4f6'; this.style.backgroundColor='#f9fafb';"
      onmousedown="this.style.transform='scale(0.96)';"
      onmouseup="this.style.transform='scale(1)';"
    >
      ${t.id}
    </button>

  </div>

  <span style="color: #374151; font-size: 10.5px; text-transform: uppercase; font-weight: 700; margin-left: 12px; letter-spacing: 0.3px;">
    📍 ${location || 'S/D'}
  </span>

</div>
      `;
            }).join('');

            prontoPanel.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e9d5ff; padding-bottom: 6px; -webkit-user-select: none; user-select: none;">
        <span style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
          ⚠️ Invitaciones Pronto Pendientes: 
          <span style="background: #7e22ce; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800;">${cantidad}</span>
        </span>
        <span style="font-size: 11px; color: #a21caf; font-weight: 600; text-transform: uppercase;">Región: TODOS</span>
      </div>
      <div class="vex-scrollbar" style="display: flex; flex-wrap: wrap; gap: 10px; max-height: 150px; overflow-y: auto; padding-right: 4px;">
        ${codigosHtml}
      </div>
    `;
        }

        rowContainer.after(prontoPanel);
    }

    private static getPanelContainer(): HTMLElement {
        const panel = document.createElement('div');
        panel.id = 'wow-pronto-panel';
        Object.assign(panel.style, {
            width: '100%',
            marginTop: '16px',
            backgroundColor: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#581c87',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            boxSizing: 'border-box'
        });
        return panel;
    }

    // private static filterTasksByDepartment(tasks: ProntoInstallation[]): ProntoInstallation[] {
    //     return tasks.filter(task => {
    //         const deptTarea = task.address?.ubigeo?.department || '';
    //         return deptTarea.toUpperCase() === department;
    //     });

    // }

    private static getDepartments(tasks: ProntoInstallation[]): string {
        const clear = tasks.map(task => {
            return task.address?.ubigeo?.department || '';
        })
        const uniqueDepartments = Array.from(new Set(clear));
        return uniqueDepartments.join(', ');
    }

    // private static getDepartmentSelected(): string {
    //     const selectDept = document.querySelector('mat-select[formcontrolname="departament_code"]');
    //     if (!selectDept) return 'TODOS';

    //     const textoContainer = selectDept.querySelector('.mat-select-value-text span');
    //     const departamentoRaw = textoContainer?.textContent?.trim() || 'TODOS';

    //     return departamentoRaw.toUpperCase();
    // }


}