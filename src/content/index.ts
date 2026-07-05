import { createRoot } from 'react-dom/client';
import { DateTimeFixed } from '../pluggins/DateTimeFixed/DateTimeFixed';
import SpeedDeal from '../components/SpeedDeal/SpeedDeal';
import { UIProvider } from '../context/UIContext';
import type { TecnicoResumen } from '../types/wow';
import { createElement } from 'react';
import type { InstallationTask } from './background-pronto';
import { Toaster, sileo } from "sileo";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface VisitaTech {
  id: number;
  codigo: string;
  lista: VisitaSGC[];
}
export interface VisitaSGC {
  visita_tecnica_id: number;
  visita_tecnica_type_id: number;
  estado_id: number;
  tipo: string;
  fecha_solicitud: string;
  asignado_a: string;
  cuadrilla: string;
  fecha_visita: string;
  horario: string;
  observacion_visita_tecnica: string;
  motivo_de_cierre: string | null;
  estado: string;
  fecha_completado: string | null;
  fecha_validado: string | null;
}
export type CasoGarantia = 'NO_GARANTIA' | 'GARANTIA_NO_CAMBIAR' | 'GARANTIA_CAMBIAR' | 'GARANTIA_EXTERNA';
export interface AnalisisServicio {
  id: number;
  codigo: string;
  esGarantia: boolean;
  caso: CasoGarantia;
  diasEntreVisitas: number | null;
  dilacion: {
    aplica: boolean;
    horasDesdeSolicitud: number;
    horasFormateadas: string;
  } | null;
  metadata: {
    tecnicoGarantia: string;
    cuadrillaGarantia: string;
  } | null;
}
export interface Servicio {
  id: number;
  codigo: string;
  distrito: string;
  location: string;
  assignationDate: string;
  type: string;
  idTypeService: number;
  idState: number;
  estado: 'Pendiente' | 'En proceso' | 'Completado' | 'Validado' | 'Rechazado';
}
export interface Tecnico {
  nombre: string;
  cuadrilla: string;
  zonasBase: string[];
  servicios: Servicio[];
}

// ─── Chrome message listener ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_SESSION_DATA') {
    sendResponse({ data: { ...localStorage } });
    return true;
  }

  if (message.type === 'GET_USER_NAME') {
    sendResponse({ name: localStorage.getItem('sNombres') ?? 'Desconocido' });
    return true;
  }
  if (message.type === 'APPLY_SESSION_DATA') {
    Object.entries(message.data).forEach(([key, value]) => {
      if (value === 'undefined' || value === undefined || value === null) return;
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    sendResponse({ ok: true });
    return true;
  }
});

// ─── Interceptor ─────────────────────────────────────────────────────────────
function injectInterceptor() {
  console.log("[WOW Extension] Una creación de Ángel Santa Cruz 🧙‍♂️✨");
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('assets/interceptor.js');
  script.dataset.extensionId = chrome.runtime.id;
  (document.head || document.documentElement).appendChild(script);
}

// ─── Procesar JSON técnicos ───────────────────────────────────────────────────
const procesarJsonTecnicos = (jsonResponse: any): TecnicoResumen[] => {
  const dataArray = jsonResponse.data?.data || [];
  return dataArray.map((item: any) => {
    const currentItem = item;
    return {
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
};

// ─── Observer global ──────────────────────────────────────────────────────────
let globalObserver: MutationObserver | null = null;
let paintTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Paint ubigeos ────────────────────────────────────────────────────────────
const paintUbigeos = (tecnicosData: TecnicoResumen[]) => {
  if (tecnicosData.length === 0) return;

  // Pausar el observer mientras mutamos el DOM para no disparar bucle infinito
  globalObserver?.disconnect();

  const nameContainers = document.querySelectorAll<HTMLDivElement>('[data-copy-tecnico="true"]');

  nameContainers.forEach((nameContainer) => {
    const colContainer = nameContainer.closest<HTMLDivElement>('.flex.flex-col.items-start.justify-center');
    if (!colContainer) return;
    if (colContainer.querySelector('.wow-ui-ubigeos')) return;

    const rawName = nameContainer.textContent?.trim() ?? '';
    const cleanName = rawName.split(' (')[0].replace(/\s+/g, ' ').trim().toUpperCase();

    const match = tecnicosData.find(t =>
      t.nombre.replace(/\s+/g, ' ').trim().toUpperCase() === cleanName
    );
    if (!match) return;

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

    const uniqueZones = [...new Set(match.zonasBase)];
    ubigeoBox.innerHTML = `
      <div style="font-weight:700;font-size:9px;color:#15803d;margin-bottom:3px;">📍 UBIGEOS:</div>
      ${uniqueZones.map(z => `<div>• ${z}</div>`).join('')}
    `;
    colContainer.appendChild(ubigeoBox);
  });

  // Reconectar el observer después de pintar
  if (globalObserver) {
    globalObserver.observe(document.body, { childList: true, subtree: true });
  }
};

// ─── Observer con debounce ────────────────────────────────────────────────────
const startObserver = (tecnicosData: TecnicoResumen[]) => {
  // Siempre recrear con los datos más frescos
  globalObserver?.disconnect();

  globalObserver = new MutationObserver(() => {
    // Debounce: esperar 150ms a que Angular termine su ciclo antes de pintar
    if (paintTimeout) clearTimeout(paintTimeout);
    paintTimeout = setTimeout(() => {
      paintUbigeos(tecnicosData);
    }, 150);
  });

  globalObserver.observe(document.body, { childList: true, subtree: true });
};

// ─── Fecha helpers ────────────────────────────────────────────────────────────
const MESES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};

function parseFechaSGC(str: string | null): Date | null {
  if (!str) return null;
  const matchTexto = str.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (matchTexto) {
    const mes = MESES[matchTexto[2].toLowerCase()] ?? 0;
    const fecha = new Date(Number(matchTexto[3]), mes, Number(matchTexto[1]));
    const matchHora = str.match(/(\d{2}):(\d{2})/);
    if (matchHora) fecha.setHours(Number(matchHora[1]), Number(matchHora[2]), 0, 0);
    return fecha;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str.substring(0, 10) + 'T00:00:00');
  }
  return null;
}

// ─── Análisis de historial ────────────────────────────────────────────────────
export function analizarHistorialServicio(
  historial: VisitaSGC[],
  idServicio: number,
  codigoServicio: string
): AnalisisServicio {
  const visitasValidas = historial.filter(v => {
    const estado = (v.estado || '').toLowerCase();
    const tecnico = (v.asignado_a || '').toLowerCase();
    if (estado === 'anulado') return false;
    if (!v.asignado_a || tecnico.includes('sin asignacion')) return false;
    return true;
  });

  if (visitasValidas.length === 0) {
    return { id: idServicio, codigo: codigoServicio, esGarantia: false, caso: 'NO_GARANTIA', diasEntreVisitas: null, dilacion: null, metadata: null };
  }

  const tieneInstalacion = visitasValidas.some(v =>
    v.tipo.toLowerCase().includes('instalación de servicio') ||
    v.tipo.toLowerCase().includes('instalacion de servicio')
  );
  const tieneOtraVisita = visitasValidas.some(v =>
    !v.tipo.toLowerCase().includes('instalación de servicio') &&
    !v.tipo.toLowerCase().includes('instalacion de servicio')
  );

  const visitasOrdenadas = [...visitasValidas].sort((a, b) => {
    const fechaA = parseFechaSGC(a.fecha_solicitud)?.getTime() ?? 0;
    const fechaB = parseFechaSGC(b.fecha_solicitud)?.getTime() ?? 0;
    return fechaB - fechaA;
  });

  const v1 = visitasOrdenadas[0];
  const v2 = visitasOrdenadas[1] ?? null;

  let dilacionInfo = null;
  const fechaSolicitudV1 = parseFechaSGC(v1.fecha_solicitud);
  if (fechaSolicitudV1) {
    const diferenciaMilisegundos = Date.now() - fechaSolicitudV1.getTime();
    const horasDesde = diferenciaMilisegundos / 36e5;
    if (horasDesde > 2) {
      const dias = Math.floor(horasDesde / 24);
      const horasRestantes = Math.floor(horasDesde % 24);
      let horasStr = '';
      if (dias >= 1) {
        horasStr = `${dias}d ${horasRestantes}h`;
      } else {
        const minutosRestantes = Math.floor((diferenciaMilisegundos % 36e5) / 60000);
        horasStr = `${Math.floor(horasDesde)}h ${minutosRestantes}m`;
      }
      dilacionInfo = { aplica: true, horasDesdeSolicitud: horasDesde, horasFormateadas: horasStr };
    }
  }

  if (!tieneInstalacion || !tieneOtraVisita) {
    return { id: idServicio, codigo: codigoServicio, esGarantia: false, caso: 'NO_GARANTIA', diasEntreVisitas: null, dilacion: dilacionInfo, metadata: null };
  }

  let dias: number | null = null;
  if (v2 && fechaSolicitudV1) {
    const fechaVisitaAnterior = parseFechaSGC(v2.fecha_visita || v2.fecha_completado);
    if (fechaVisitaAnterior) {
      const d1 = new Date(fechaSolicitudV1.getTime());
      const d2 = new Date(fechaVisitaAnterior.getTime());
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      dias = Math.round((d1.getTime() - d2.getTime()) / 86400000);
    }
  }

  let caso: CasoGarantia = 'NO_GARANTIA';
  if (dias === null || dias > 30) {
    caso = 'NO_GARANTIA';
  } else if (v1.asignado_a.trim().toLowerCase() === v2!.asignado_a.trim().toLowerCase()) {
    caso = 'GARANTIA_NO_CAMBIAR';
  } else if ((v1.cuadrilla ?? '').trim().toLowerCase() === (v2!.cuadrilla ?? '').trim().toLowerCase()) {
    caso = 'GARANTIA_CAMBIAR';
  } else {
    caso = 'GARANTIA_EXTERNA';
  }

  const metadataGarantia = caso !== 'NO_GARANTIA' && v2
    ? {
      tecnicoGarantia: v2.asignado_a.replace(/\s+/g, ' ').trim().toUpperCase(),
      cuadrillaGarantia: (v2.cuadrilla || 'SIN CUADRILLA').trim().toUpperCase()
    }
    : null;

  return { id: idServicio, codigo: codigoServicio, esGarantia: caso !== 'NO_GARANTIA', caso, diasEntreVisitas: dias, dilacion: dilacionInfo, metadata: metadataGarantia };
}

window.addEventListener('WOW_DATA_INTERCEPTED', async (event: Event) => {
  const customEvent = event as CustomEvent;
  const datosProcesados = procesarJsonTecnicos(customEvent.detail);

  if (datosProcesados.length === 0) return;

  chrome.storage.local.set({ listTechnicians: datosProcesados });
  localStorage.setItem('listTechnicians', JSON.stringify(datosProcesados));

  setTimeout(() => paintUbigeos(datosProcesados), 300);

  startObserver(datosProcesados);
});

function pedirTareasPronto(): Promise<InstallationTask[]> {
  console.log('[Wow Multitasking] Solicitando tareas Pronto al background...');
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'GET_PRONTO_TASKS' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error('Sin respuesta del background'));
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

export function actualizarAlertasDePronto() {
  sileo.promise(pedirTareasPronto(), {
    loading: {
      title: 'Obteniendo tareas Pronto...',
      description: 'Esto puede tardar unos segundos.',
    },
    success: (tasks: InstallationTask[]) => {
      inyectarDatosEnUI(tasks);
      console.log('[Wow Multitasking] Tareas por confirmar obtenidas:', tasks);
      const departamentoFiltro = obtenerDepartamentoSeleccionado();
      const tareasFiltradas = tasks.filter(task => {
        if (departamentoFiltro === 'TODOS') return true;

        const deptTarea = task.address?.ubigeo?.department || '';
        return deptTarea.toUpperCase() === departamentoFiltro;
      });
    
      const yesResults = departamentoFiltro === 'TODOS' ? "Se actualizaron las invitaciones pendientes para todos los departamentos." : `Se actualizaron las invitaciones pendientes para ${departamentoFiltro}.`;
      const notResults = departamentoFiltro === 'TODOS' ? "No hay invitaciones pendientes para ningún departamento." : `No hay invitaciones pendientes para ${departamentoFiltro}.`;
      return {
        title: `${tareasFiltradas.length} tareas Pronto encontradas para ${departamentoFiltro}`,
        description: tareasFiltradas.length > 0
          ? yesResults
          : notResults,
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

function inyectarDatosEnUI(tasks: InstallationTask[]) {
  console.log('[Wow Multitasking] Procesando inyección de tareas en UI. Total crudo:', tasks.length);

  // 1. Obtener el filtro actual del SGC
  const departamentoFiltro = obtenerDepartamentoSeleccionado();
  console.log('[Wow Multitasking] Filtro de departamento detectado:', departamentoFiltro);

  // 2. Filtrar las tareas según el departamento
  const tareasFiltradas = tasks.filter(task => {
    if (departamentoFiltro === 'TODOS') return true;

    const deptTarea = task.address?.ubigeo?.department || '';
    return deptTarea.toUpperCase() === departamentoFiltro;
  });

  console.log(`[Wow Multitasking] Tareas filtradas para [${departamentoFiltro}]:`, tareasFiltradas);

  // 3. Buscar el contenedor principal de la fila del título (para poder ponernos abajo a lo ancho)
  const rowContainer = document.querySelector('vex-por-instalador .px-gutter.pt-6.pb-14 .flex.md\\:flex-row.flex-col');
  if (!rowContainer) {
    console.warn('[Wow Multitasking] No se encontró el contenedor de la fila principal.');
    return;
  }

  // 4. Remover contenedor anterior si ya existía para evitar duplicados
  const boxAnterior = document.getElementById('wow-pronto-panel');
  if (boxAnterior) boxAnterior.remove();

  // 5. Crear el nuevo contenedor que ocupará todo el ancho disponible
  const prontoPanel = document.createElement('div');
  prontoPanel.id = 'wow-pronto-panel';
  Object.assign(prontoPanel.style, {
    width: '100%',
    marginTop: '16px',
    backgroundColor: '#faf5ff', // Morado corporativo Wow muy sutil
    border: '1px solid #e9d5ff',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '12px',
    color: '#581c87',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    boxSizing: 'border-box'
  });

  const cantidad = tareasFiltradas.length;

  if (cantidad === 0) {
    prontoPanel.innerHTML = `
      <div style="font-weight: 700; color: #6b7280; display: flex; align-items: center; gap: 6px;">
        🔔 Pronto: 0 invitaciones pendientes para [${departamentoFiltro}]
      </div>
    `;
  } else {
    // Para aprovechar el ancho, estructuramos los códigos en un grid horizontal automático o flex envuelto
    const codigosHtml = tareasFiltradas.map(t => {
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; background-color: #ffffff; border: 1px solid #f3e8ff; border-radius: 6px; padding: 6px 10px; min-width: 180px; flex: 1; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
          <span style="font-weight: 700; font-family: monospace; font-size: 12px; color: #7e22ce;">${t.customerCode}</span>
          <span style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 500; margin-left: 8px;">📍 ${t.address?.ubigeo?.district || 'S/D'}</span>
        </div>
      `;
    }).join('');

    prontoPanel.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e9d5ff; padding-bottom: 6px;">
        <span style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
          ⚠️ Invitaciones Pronto Pendientes: 
          <span style="background: #7e22ce; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800;">${cantidad}</span>
        </span>
        <span style="font-size: 11px; color: #a21caf; font-weight: 600; text-transform: uppercase;">Región: ${departamentoFiltro}</span>
      </div>
      <div class="vex-scrollbar" style="display: flex; flex-wrap: wrap; gap: 10px; max-height: 150px; overflow-y: auto; padding-right: 4px;">
        ${codigosHtml}
      </div>
    `;
  }

  // 6. En lugar de meterlo DENTRO del título, lo insertamos justo DESPUÉS de la fila del título utilizando 'after'
  rowContainer.after(prontoPanel);
}
function obtenerDepartamentoSeleccionado(): string {
  // Buscamos el contenedor del mat-select de departamento usando su atributo de Angular formcontrolname
  const selectDept = document.querySelector('mat-select[formcontrolname="departament_code"]');
  if (!selectDept) return 'TODOS';

  const textoContainer = selectDept.querySelector('.mat-select-value-text span');
  const departamentoRaw = textoContainer?.textContent?.trim() || 'TODOS';

  return departamentoRaw.toUpperCase();
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
injectInterceptor();

const container = document.createElement('div');
container.id = 'wow-extension-root';
Object.assign(container.style, {
  position: 'fixed',
  zIndex: '50',
  top: '0',
  left: '0',
  width: '100vw',
  height: '100vh',
  pointerEvents: 'none',
  backgroundColor: 'transparent',
});
document.body.appendChild(container);

const style = document.createElement('style');
style.textContent = `
  #wow-extension-root { pointer-events: none; }
  #wow-extension-root [data-sileo-toaster],
  #wow-extension-root [data-sileo-toast] {
    pointer-events: auto;
  }
`;
document.head.appendChild(style);

const root = createRoot(container);
root.render(
  createElement(
    UIProvider,
    null,
    createElement(Toaster, { position: 'top-center' }),
    createElement(DateTimeFixed),
    createElement(SpeedDeal)
  )
);