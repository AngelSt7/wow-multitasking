import type { TecnicoResumen } from "../types/wow";

export const runSearchScript = () => {
  const nativeSearchButton = document.querySelector(
    'button.mat-fab.bg-primary-800, button[mat-fab].mat-accent'
  ) as HTMLButtonElement;

  if (nativeSearchButton) {
    nativeSearchButton.click();
    console.log('Search button clicked via native selector.');
  } else {
    const altButton = document.querySelector('ic-icon[ng-reflect-icon*="object"]')?.closest('button');
    if (altButton) {
      (altButton as HTMLButtonElement).click();
    }
  }
};

(function () {
  const TARGET_SELECTOR = `
        div[class*="slot-"] div.font-semibold:not([data-multitasking-ready]),
        td.mat-column-client_service_group_code:not([data-multitasking-ready])
    `;

  const applyMultitaskingUI = () => {
    const elements = document.querySelectorAll<HTMLDivElement>(TARGET_SELECTOR);

    elements.forEach(el => {
      const rawText = el.innerText.trim();
      if (!/^\d{7,}$/.test(rawText)) return;

      el.setAttribute('data-multitasking-ready', 'true');
      const codigoServicio = rawText;

      const btnStyle = {
        border: 'none',
        background: '#f3f4f6',
        color: '#6b7280',
        borderRadius: '4px',
        padding: '3px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flexShrink: '0'
      };

      const copyBtn = document.createElement('button');
      copyBtn.title = "Copiar Código";
      copyBtn.setAttribute('data-multitasking-copy', 'true');
      copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      Object.assign(copyBtn.style, btnStyle);

      const searchBtn = document.createElement('button');
      searchBtn.title = "Buscar en SGC";
      searchBtn.setAttribute('data-multitasking-search', 'true');
      searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
      Object.assign(searchBtn.style, btnStyle);

      copyBtn.onclick = (e) => {
        e.stopPropagation();

        navigator.clipboard.writeText(codigoServicio).then(() => {
          copyBtn.style.background = '#d1fae5';

          setTimeout(() => {
            copyBtn.style.background = '#f3f4f6';
          }, 800);
        });
      };

      searchBtn.onclick = (e) => {
        e.stopPropagation();
        chrome.storage.local.set({ "pending_sgc_search": codigoServicio }, () => {
          window.open('https://sgc.wowperu.pe/instalaciones-v2/lista', '_blank');
        });
      };

      // layout
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.gap = '6px';

      if (!el.querySelector('[data-multitasking-copy]')) {
        el.prepend(copyBtn);
        el.appendChild(searchBtn);
      }
    });
  };

  setInterval(applyMultitaskingUI, 1500);
  applyMultitaskingUI();
})();

(function initSGCAutoSearch() {
  if (!window.location.href.includes("instalaciones-v2/lista")) return;

  // 1. Usamos una función que no espere a timeouts si el elemento ya existe
  function fastSearch(codigo: string) {
    const input = document.querySelector<HTMLInputElement>('input[formcontrolname="search_input"]');

    if (!input) {
      // Si no está el input, usamos RequestAnimationFrame para chequear en el próximo frame
      // Es mucho más rápido que setTimeout(500)
      requestAnimationFrame(() => fastSearch(codigo));
      return;
    }


    // Inyección inmediata
    input.value = codigo;

    // Disparamos eventos en cadena sin esperar
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true })); // A veces Angular valida al perder foco

    // Intentamos el click YA, sin setTimeout largo
    // Usamos un microtask (queueMicrotask) para dejar que Angular procese el binding
    queueMicrotask(() => {
      const searchIcon = input.closest('div')?.querySelector<HTMLElement>('ic-icon') ||
        input.parentElement?.querySelector<HTMLElement>('ic-icon');

      if (searchIcon) {
        searchIcon.click();
      } else {
        const form = input.closest('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
      }

      // Estética en segundo plano
      input.style.backgroundColor = "#e0e7ff";
      setTimeout(() => input.style.backgroundColor = "", 500);
    });
  }

  // Leemos el storage inmediatamente
  chrome.storage.local.get(['pending_sgc_search'], (result) => {
    const codigo = result.pending_sgc_search;
    if (codigo) {
      chrome.storage.local.remove('pending_sgc_search');
      fastSearch(codigo as string);
    }
  });
})();

(function initWowPopover(): void {
  'use strict';

  if ((window as any).__wowPopoverV5) return;
  (window as any).__wowPopoverV5 = true;

  interface SlotData {
    hora: string;
    contrata: string;
    tecnico: string;
    tipo: string;
    isBlocked: boolean;
    isEmpty: boolean;
    codigo: string | null;
    estado: string | null;
    ciudadFull: string | null;
    esAG: boolean;
    ts: string | null;
  }

  type StorageData = Record<string, unknown>;
  type StorageChanges = Record<string, chrome.storage.StorageChange>;

  const SLOTS: Record<number, string> = {
    1: '06:30 - 08:00',
    2: '08:00 - 10:00',
    3: '10:00 - 12:00',
    4: '12:00 - 14:00',
    5: '14:00 - 16:00',
    6: '16:00 - 18:00',
  };

  const ESTADO_COLORS: Record<string, string> = {
    'Completado': 'background:#dcfce7;color:#15803d',
    'Reportado': 'background:#fef3c7;color:#92400e',
  };

  document.getElementById('wow-pop-v5')?.remove();

  const pop = document.createElement('div');
  pop.id = 'wow-pop-v5';
  Object.assign(pop.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '2147483647',
    display: 'none',
    width: '288px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    lineHeight: '1.5',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)',
  } satisfies Partial<CSSStyleDeclaration>);

  document.documentElement.appendChild(pop);

  function findVex(el: HTMLElement): HTMLElement | null {
    let cur: HTMLElement | null = el;
    for (let i = 0; i < 25; i++) {
      if (!cur) return null;
      if (cur.tagName?.toLowerCase() === 'vex-calendario-slot') return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function extract(vex: HTMLElement): SlotData | null {
    const parent = vex.parentElement;
    if (!parent) return null;

    // Los slots "adicionales" están dentro de un div.col-span-2
    const row: HTMLElement | null = parent.className?.includes('col-span-2')
      ? parent.parentElement
      : parent;
    if (!row) return null;

    // Calcular índice de columna
    const kids = Array.from(row.children) as HTMLElement[];
    let col = kids.indexOf(vex);
    if (col === -1) {
      const cp2 = vex.parentElement;
      if (cp2) col = kids.indexOf(cp2);
    }
    const hora = SLOTS[col] ?? (col >= 7 ? 'Adicional' : '—');

    // Info del técnico (columna 0)
    const infoCol = kids[0] as HTMLElement | undefined;
    const contrata = infoCol?.querySelector('.uppercase.font-medium')?.textContent?.trim() ?? 'N/A';

    let tecnico = 'Sin asignar';
    let tipo = '';

    if (infoCol) {
      const ngDiv = infoCol.querySelector<HTMLElement>('[class*="ng-tns"]');
      if (ngDiv) {
        const clone = ngDiv.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('span').forEach(s => s.remove());
        tecnico = clone.textContent?.replace(/\s+/g, ' ').trim() || tecnico;
      }
      infoCol.querySelectorAll<HTMLElement>('.text-xs').forEach(d => {
        const t = d.textContent?.trim() ?? '';
        if (t.startsWith('(') && t.endsWith(')')) tipo = t;
      });
    }

    // Tipo de celda
    const isBlocked = !!vex.querySelector('.bg-gray-300');
    const isEmpty = !!vex.querySelector('.border-dashed');

    if (isBlocked) return { hora, contrata, tecnico, tipo, isBlocked: true, isEmpty: false, codigo: null, estado: null, ciudadFull: null, esAG: false, ts: null };
    if (isEmpty) return { hora, contrata, tecnico, tipo, isBlocked: false, isEmpty: true, codigo: null, estado: null, ciudadFull: null, esAG: false, ts: null };

    // Código de servicio
    const codigoEl = vex.querySelector<HTMLElement>('[data-multitasking-ready="true"] span');
    const codigo = codigoEl?.textContent?.trim() ?? null;

    // Estado (puede ser "Reportado · Completado")
    const parts: string[] = [];
    const repEl = vex.querySelector<HTMLElement>('.reportado');
    const estEl = vex.querySelector<HTMLElement>('.estado');
    if (repEl) parts.push(repEl.textContent?.trim() ?? '');
    if (estEl) parts.push(estEl.textContent?.trim() ?? '');
    const estado = parts.filter(Boolean).join(' · ') || null;

    // Ciudad y timestamp desde ng-reflect-message
    let ciudadFull: string | null = null;
    let ts: string | null = null;

    vex.querySelectorAll<HTMLElement>('[ng-reflect-message]').forEach(tip => {
      const msg = tip.getAttribute('ng-reflect-message') ?? '';
      if (/\d{2}\/\d{2}\/\d{4}/.test(msg)) {
        // Es un timestamp (ej: "04/04/2026 04:25 PM")
        ts = `${tip.textContent?.trim()} · ${msg}`;
      } else if (msg.includes(' - ')) {
        // Es una ciudad (ej: "ICA - CHINCHA - SUNAMPE")
        ciudadFull = msg.trim();
      }
    });

    // Autogestión: badge "A" en esquina superior derecha
    const esAG = !!vex.querySelector('.absolute.top-0.right-0');

    return { hora, contrata, tecnico, tipo, isBlocked: false, isEmpty: false, codigo, estado, ciudadFull, esAG, ts };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function makeBadge(estado: string | null): string {
    if (!estado) return '';
    return estado.split(' · ').map(p => {
      const c = ESTADO_COLORS[p] ?? 'background:#e0e7ff;color:#3730a3';
      return `<span style="font-size:10px;padding:1px 8px;border-radius:99px;font-weight:700;${c}">${p}</span>`;
    }).join(' ');
  }

  function render(d: SlotData): void {
    const bg = d.isBlocked ? '#1e293b' : d.isEmpty ? '#334155' : '#3b0764';
    const accent = d.isBlocked ? '#475569' : d.isEmpty ? '#64748b' : '#7c3aed';

    pop.style.background = bg;
    pop.innerHTML = `
<div style="background:${accent};padding:8px 12px;display:flex;align-items:center;gap:6px;">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  <span style="color:#fff;font-weight:700;font-size:12px;flex:1">${d.hora}</span>
  ${d.esAG ? `<span style="background:#f59e0b;color:#451a03;font-size:9px;font-weight:800;border-radius:4px;padding:1px 6px;">⚡ AUTOGESTIÓN</span>` : ''}
</div>
<div style="padding:10px 12px;color:#fff;">
  <div style="opacity:.5;font-size:9px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px">${d.contrata}</div>
  <div style="font-weight:700;font-size:13px">👷 ${d.tecnico}</div>
  ${d.tipo ? `<div style="opacity:.6;font-size:10px;font-style:italic;margin-bottom:6px">${d.tipo}</div>` : `<div style="margin-bottom:6px"></div>`}
  ${d.isBlocked ? `<div style="opacity:.4;font-size:11px">Este horario está bloqueado</div>` : ''}
  ${d.isEmpty ? `<div style="opacity:.5;font-size:11px">Clic para asignar una visita</div>` : ''}
  ${!d.isBlocked && !d.isEmpty ? `
    <div style="height:1px;background:rgba(255,255,255,.12);margin:4px 0 8px"></div>
    ${d.codigo ? `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:5px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span style="font-family:monospace;font-size:12px;font-weight:600">${d.codigo}</span>
      ${makeBadge(d.estado)}
    </div>` : ''}
    ${d.ciudadFull ? `
    <div style="display:flex;align-items:flex-start;gap:5px;margin-bottom:4px">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-top:1px;flex-shrink:0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span style="font-size:11px;opacity:.85">${d.ciudadFull}</span>
    </div>` : ''}
    ${d.ts ? `
    <div style="font-size:10px;opacity:.4;margin-top:5px;display:flex;align-items:center;gap:4px">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ${d.ts}
    </div>` : ''}
  ` : ''}
</div>`;
    pop.style.display = 'block';
  }

  // ── Posicionamiento ───────────────────────────────────────────────────────
  function move(e: MouseEvent): void {
    const W = 310;
    const x = e.clientX + 20;
    const y = e.clientY - 10;
    pop.style.left = `${x + W > window.innerWidth ? e.clientX - W : x}px`;
    pop.style.top = `${Math.max(8, Math.min(y, window.innerHeight - 240))}px`;
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────
  let lastVex: HTMLElement | null = null;

  const onMove = (e: MouseEvent): void => {
    const t = e.target as HTMLElement | null;
    if (!t?.tagName) return;

    const multitaskingArea = t.closest('[data-multitasking-ready="true"]');
    const isCodeRow = t.classList.contains('font-semibold') || t.closest('.font-semibold');

    const isCopyButtons = t.closest('.custom-btns') || t.closest('.custom-copy-btns');

    if (
      t.id === 'wow-pop-v5' ||
      t.closest('#wow-nav, .wow-main-trigger') ||
      multitaskingArea ||
      isCodeRow ||
      isCopyButtons
    ) {
      pop.style.display = 'none';
      lastVex = null;
      return;
    }

    const vex = findVex(t);
    if (!vex) {
      pop.style.display = 'none';
      lastVex = null;
      return;
    }

    move(e);

    if (lastVex === vex) {
      if (pop.style.display === 'none') pop.style.display = 'block';
      return;
    }

    lastVex = vex;
    const d = extract(vex);
    if (d) render(d);
    else pop.style.display = 'none';
  };

  const onLeave = (): void => {
    pop.style.display = 'none';
    lastVex = null;
  };

  // ── Toggle ────────────────────────────────────────────────────────────────
  function activate(on: boolean): void {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseleave', onLeave);
    if (on) {
      document.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
    } else {
      pop.style.display = 'none';
    }
  }

  // Activo por defecto si la key no existe en storage
  try {
    chrome.storage.local.get('wow_mostrar_popover', (data: StorageData) => {
      const on = data['wow_mostrar_popover'] === undefined
        ? true                               // primera vez → activo
        : !!data['wow_mostrar_popover'];
      activate(on);
    });
    chrome.storage.onChanged.addListener((changes: StorageChanges, area: string) => {
      if (area === 'local' && 'wow_mostrar_popover' in changes) {
        activate(!!changes['wow_mostrar_popover'].newValue);
      }
    });
  } catch (_) {
    // Sin chrome.storage (consola directa) → activo siempre
    activate(true);
  }

})();


(function initTecnicoCopiaFacil(): void {
  // 1. Estilo global para evitar parpadeos de selección
  const style = document.createElement('style');
  style.innerHTML = `
        [data-copy-tecnico] {
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent;
        }
    `;
  document.head.appendChild(style);

  /**
   * SELECTOR MEJORADO:
   * 1. Busca dentro de un div que tenga la clase 'card' (el contenedor principal).
   * 2. Busca el div con clase 'ng-tns-' que sea hermano directo de un 'mat-divider'.
   * 3. Excluye los que ya procesamos.
   */
  const TECNICO_SELECTOR: string = 'div.card div.flex-col mat-divider + div[class*="ng-tns-"]:not([data-copy-tecnico])';

  const applyTecnicoUI = (): void => {
    const elements = document.querySelectorAll<HTMLDivElement>(TECNICO_SELECTOR);

    elements.forEach(el => {
      // Verificación de seguridad adicional: 
      // El técnico suele estar arriba de un div con clase 'text-xs' (Visita Técnica)
      const nextDiv = el.nextElementSibling;
      const esNombreTecnico = nextDiv && nextDiv.classList.contains('text-xs');

      if (!esNombreTecnico) return;

      el.setAttribute('data-copy-tecnico', 'true');

      // --- ESTILOS DE "BOTÓN ZINC" ---
      Object.assign(el.style, {
        cursor: 'pointer',
        borderRadius: '6px',
        padding: '2px 8px',
        margin: '2px -8px',
        transition: 'all 0.15s ease-in-out',
        display: 'inline-block',
        backgroundColor: '#f4f4f5',
        border: '1px solid #e4e4e7',
        color: '#27272a',
        fontSize: 'inherit' // Mantiene el tamaño de fuente original de la web
      });

      el.title = 'Clic para copiar nombre';

      el.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        // Limpieza profunda: extraemos solo el primer nodo de texto 
        // para evitar el "(Q0)" que está en un span
        let nombreTecnico = "";
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            nombreTecnico += node.textContent;
          }
        }
        nombreTecnico = nombreTecnico.trim();

        if (!nombreTecnico) return;

        navigator.clipboard.writeText(nombreTecnico).then(() => {
          // --- FEEDBACK VISUAL ---
          const originalBg = el.style.backgroundColor;
          const originalBorder = el.style.borderColor;

          el.style.backgroundColor = '#dcfce7';
          el.style.borderColor = '#10b981';
          el.style.transform = 'scale(0.96)';

          setTimeout(() => {
            el.style.backgroundColor = originalBg;
            el.style.borderColor = originalBorder;
            el.style.transform = 'scale(1)';
          }, 400);
        });
      });

      // Hovers dinámicos
      el.addEventListener('mouseenter', () => {
        el.style.backgroundColor = '#e4e4e7';
        el.style.borderColor = '#d4d4d8';
      });
      el.addEventListener('mouseleave', () => {
        el.style.backgroundColor = '#f4f4f5';
        el.style.borderColor = '#e4e4e7';
      });
    });
  };

  setInterval(applyTecnicoUI, 1500);
  applyTecnicoUI();

})();

(function (): void {
  // Interfaces para garantizar un tipado estricto
  interface ContactoEmpresa {
    NOMBRE?: string;
    'NRO DOCUMENTO'?: string;
    CELULAR?: string;
    EMAIL?: string;
    [key: string]: string | undefined;
  }

  interface ClienteData {
    [key: string]: string;
  }

  const globalWindow = window as any;

  if (globalWindow.modalObserver) {
    globalWindow.modalObserver.disconnect();
  }

  const injectCopyButton = (tabContent: HTMLElement): void => {
    const activeTabLabel = document.querySelector<HTMLElement>('.mat-tab-label-active .mat-tab-label-content');

    if (!activeTabLabel || activeTabLabel.innerText.trim() !== 'Información del cliente') {
      tabContent.querySelector('#btn-copiar-cliente')?.parentElement?.remove();
      return;
    }

    if (tabContent.querySelector('#btn-copiar-cliente')) return;

    // ── 1. Extraer TODOS los campos label → valor dinámicamente ──
    const data: ClienteData = {};
    const labelEls = tabContent.querySelectorAll<HTMLElement>('.label');

    labelEls.forEach((labelEl: HTMLElement) => {
      const key: string = labelEl.innerText.replace(':', '').trim().toUpperCase();
      const parent: HTMLElement | null = labelEl.parentElement;
      if (!parent) return;

      if (key === 'SERVICIOS CONTRATADOS') {
        const container: HTMLElement | null = parent.parentElement;
        if (container) {
          const flexRow = container.querySelector<HTMLElement>('.flex.w-full');
          if (flexRow) {
            const parts: string[] = Array.from(flexRow.querySelectorAll<HTMLElement>('div'))
              .map((d: HTMLElement) => d.innerText.trim())
              .filter((t: string) => t.length > 0);
            data[key] = parts.join(' | ');
          }
        }
        return;
      }

      const clone = parent.cloneNode(true) as HTMLElement;
      clone.querySelector('.label')?.remove();
      const val: string = clone.innerText
        .replace('Ver en Gmaps', '')
        .replace(/\s+/g, ' ')
        .trim();

      if (val && val !== '-') data[key] = val;
    });

    // ── 2. Identificar Unidad y configurar Diseño Adaptativo ──
    const unidad: string = (data['UNIDAD'] || '').toUpperCase();
    const isEmpresarial: boolean = unidad.includes('EMPRESARIAL');

    const brandColor: string = isEmpresarial ? '#662D91' : '#0078d7';
    const softBg: string = isEmpresarial ? 'rgba(102, 45, 145, 0.04)' : 'rgba(0, 120, 215, 0.04)';
    const buttonText: string = isEmpresarial ? 'Copiar información de cliente EMPRESARIAL' : 'Copiar información del cliente';

    // ── 3. Extraer subsecciones específicas si es Empresarial ──
    const extraerSeccionContacto = (headerText: string): ContactoEmpresa | null => {
      const headers: HTMLElement[] = Array.from(tabContent.querySelectorAll<HTMLElement>('h6'));
      const targetHeader = headers.find((h: HTMLElement) => h.innerText.trim().toUpperCase().includes(headerText.toUpperCase()));
      if (!targetHeader) return null;

      const container = targetHeader.nextElementSibling as HTMLElement | null;
      if (!container) return null;

      const labels = container.querySelectorAll<HTMLElement>('.label');
      const info: ContactoEmpresa = {};
      labels.forEach((lbl: HTMLElement) => {
        const key: string = lbl.innerText.replace('.', '').replace(':', '').trim().toUpperCase();
        const parent: HTMLElement | null = lbl.parentElement;
        if (parent) {
          const clone = parent.cloneNode(true) as HTMLElement;
          clone.querySelector('.label')?.remove();
          info[key] = clone.innerText.trim();
        }
      });
      return info;
    };

    const contactoInstalacion: ContactoEmpresa | null = isEmpresarial ? extraerSeccionContacto('Contacto de instalación') : null;
    const contactoAverias: ContactoEmpresa | null = isEmpresarial ? extraerSeccionContacto('Contacto de averías') : null;

    // ── 4. Construcción del Contenedor con Estilos Avanzados ──
    const wrapper: HTMLDivElement = document.createElement('div');
    wrapper.style.cssText = `
      margin: 16px 8px 20px 8px; 
      padding: 12px; 
      background-color: ${softBg}; 
      border: 2px dashed ${brandColor}80; 
      border-radius: 10px;
      transition: all 0.3s ease;
    `;

    const btn: HTMLButtonElement = document.createElement('button');
    btn.id = 'btn-copiar-cliente';

    // Icono dinámico: Reloj para Empresarial, Portapapeles estándar para Residencial
    const iconSvg = isEmpresarial
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px; transition: transform 0.2s;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px; transition: transform 0.2s;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

    btn.innerHTML = `${iconSvg}<span style="vertical-align: middle;">${buttonText}</span>`;

    Object.assign(btn.style, {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#ffffff', color: brandColor, border: `1.5px solid ${brandColor}`,
      padding: '10px 20px', borderRadius: '8px', width: '100%', cursor: 'pointer',
      fontSize: '13px', fontWeight: '700', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'inherit', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', letterSpacing: '0.3px'
    });

    // Hover Effects
    btn.onmouseenter = (): void => {
      btn.style.backgroundColor = brandColor;
      btn.style.color = '#ffffff';
      btn.style.boxShadow = `0 4px 12px ${brandColor}33`;
      const svg = btn.querySelector<HTMLElement>('svg');
      if (svg) svg.style.transform = 'scale(1.1) rotate(5deg)';
    };
    btn.onmouseleave = (): void => {
      btn.style.backgroundColor = '#ffffff';
      btn.style.color = brandColor;
      btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
      const svg = btn.querySelector<HTMLElement>('svg');
      if (svg) svg.style.transform = 'scale(1) rotate(0deg)';
    };

    btn.onclick = (e: MouseEvent): void => {
      e.preventDefault();

      let tipoVisita = '';
      const headerTipo = document.querySelector<HTMLElement>('#vex-quick-header div:nth-child(2) div:nth-child(3)');
      if (headerTipo) tipoVisita = headerTipo.innerText.trim().toUpperCase();

      const g = (k: string): string => data[k] || '-';

      let horarioAgendado = '—';
      const divHorario = document.querySelector<HTMLElement>('div[style*="color:#b45309"], div[style*="color: rgb(180, 83, 9)"]');
      if (divHorario) {
        horarioAgendado = divHorario.innerText.trim();
      }

      let text = '';
      text += `✅ SIGUIENTE\n${'─'.repeat(30)}\n`;

      if (isEmpresarial && tipoVisita.includes('INSTALACIÓN')) {
        text += `⚠️ *📢 (NO REPORTAR LA ORDEN SIN AUTORIZACION)*\n`;
      }

      text += `• TIPO DE VISITA: *${tipoVisita || '-'}*\n`;
      text += `• HORARIO AGENDADO: *${horarioAgendado}*\n`;
      text += `• ESTADO: *${g('ESTADO DEL REPORTE')}*\n`;
      text += `\n🧾 DATOS\n`;
      text += `• CÓDIGO: ${g('CÓDIGO DE CLIENTE')}\n`;
      text += `• ${g('TIPO DOCUMENTO')}: ${g('NRO DOCUMENTO')}\n`;
      text += `• UNIDAD: ${g('UNIDAD')}\n`;
      if (g('TIPO DE SERVICIO') !== '-') text += `• TIPO DE SERVICIO: ${g('TIPO DE SERVICIO')}\n`;

      text += `\n👤 CLIENTE\n`;
      text += `• NOMBRE: ${g('CLIENTE')}\n`;
      text += `• CELULAR: ${g('CELULAR')}\n`;
      if (g('CELULAR NRO 2') !== '-') text += `• CELULAR 2: ${g('CELULAR NRO 2')}\n`;
      if (g('WHATSAPP') !== '-') text += `• WHATSAPP: ${g('WHATSAPP')}\n`;
      if (g('T. FIJO') !== '-') text += `• T. FIJO: ${g('T. FIJO')}\n`;
      if (g('OPERADOR') !== '-') text += `• OPERADOR: ${g('OPERADOR')}\n`;
      if (g('NÚMERO A PORTAR') !== '-') text += `• N° A PORTAR: ${g('NÚMERO A PORTAR')}\n`;

      // Secciones Corporativas Extendidas
      if (isEmpresarial) {
        if (contactoInstalacion) {
          text += `\n🛠️ CONTACTO DE INSTALACIÓN\n`;
          text += `• NOMBRE: ${contactoInstalacion['NOMBRE'] || '-'}\n`;
          text += `• DOCUMENTO: ${contactoInstalacion['NRO DOCUMENTO'] || '-'}\n`;
          text += `• CELULAR: ${contactoInstalacion['CELULAR'] || '-'}\n`;
          text += `• EMAIL: ${contactoInstalacion['EMAIL'] || '-'}\n`;
        }
        if (contactoAverias) {
          text += `\n🚨 CONTACTO DE AVERÍAS\n`;
          text += `• NOMBRE: ${contactoAverias['NOMBRE'] || '-'}\n`;
          text += `• DOCUMENTO: ${contactoAverias['NRO DOCUMENTO'] || '-'}\n`;
          text += `• CELULAR: ${contactoAverias['CELULAR'] || '-'}\n`;
          text += `• EMAIL: ${contactoAverias['EMAIL'] || '-'}\n`;
        }
      }

      text += `\n📍 UBICACIÓN\n`;
      text += `• DIR. INSTALACIÓN: ${g('DIRECCIÓN INSTALACIÓN')}\n`;
      if (g('DIRECCIÓN COBERTURA') !== '-') text += `• DIR. COBERTURA: ${g('DIRECCIÓN COBERTURA')}\n`;
      text += `• DISTRITO: ${g('DISTRITO')}\n`;
      text += `• PROVINCIA: ${g('PROVINCIA')}\n`;
      text += `• DEPARTAMENTO: ${g('DEPARTAMENTO')}\n`;
      text += `\n📦 SERVICIO\n`;
      text += `• PLAN: ${g('SERVICIOS CONTRATADOS')}\n`;
      text += `\n📊 EXTRAS\n`;
      text += `• RIESGO FINANCIERO: ${g('RIESGO FINACIERO')}\n`;
      text += `• TIPO DE VENTA: ${g('TIPO DE VENTA')}\n`;
      text += `• INICIO VENTA: ${g('INICIO DE VENTA')} | CIERRE: ${g('CIERRE DE VENTA')}\n`;
      text += `• CONTRATO VOZ: ${g('CONTRATO DE VOZ')} | ZYTRUST: ${g('CONTRATO ZYTRUST')}\n`;

      navigator.clipboard.writeText(text.trim()).then((): void => {
        const oldHTML: string = btn.innerHTML;
        btn.style.backgroundColor = '#10b981';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#ffffff';
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span style="vertical-align: middle;">¡Información Copiada con Éxito!</span>
        `;
        wrapper.style.backgroundColor = 'rgba(16, 185, 129, 0.06)';
        wrapper.style.borderColor = '#10b981';

        setTimeout((): void => {
          btn.style.backgroundColor = '#ffffff';
          btn.style.borderColor = brandColor;
          btn.style.color = brandColor;
          btn.innerHTML = oldHTML;
          wrapper.style.backgroundColor = softBg;
          wrapper.style.borderColor = `${brandColor}80`;
        }, 2000);
      });
    };

    wrapper.appendChild(btn);
    tabContent.insertBefore(wrapper, tabContent.firstChild);
  };

  const observer: MutationObserver = new MutationObserver((): void => {
    const target = document.querySelector<HTMLElement>('mat-dialog-container .mat-tab-body-active .mat-tab-body-content');
    if (target) injectCopyButton(target);
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  globalWindow.modalObserver = observer;
})();

(function () {
  if ((window as any).visitObserver) {
    (window as any).visitObserver.disconnect();
  }

  const injectMiniCopyButton = (container: HTMLElement) => {
    const labels = container.querySelectorAll<HTMLElement>('.label');

    labels.forEach(labelEl => {
      if (labelEl.innerText.trim().includes('Observacion visita técnica') && !labelEl.querySelector('.btn-copy-mini')) {

        const btn = document.createElement('button');
        btn.className = 'btn-copy-mini';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

        Object.assign(btn.style, {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '12px',
          padding: '4px 8px',
          backgroundColor: '#662D91',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          verticalAlign: 'middle',
          transition: 'all 0.2s ease'
        });

        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const dataSpan = labelEl.parentElement?.querySelector('span.ng-star-inserted');
          if (dataSpan) {
            // 🛠 FORMATEO DINÁMICO: Reemplazamos los bullets por saltos de línea
            let textToCopy = (dataSpan as HTMLElement).innerText.trim()
              .replace(/•/g, '\n•') // Salto de línea antes de cada bullet
              .replace(/\s{2,}/g, ' '); // Limpiar espacios dobles

            navigator.clipboard.writeText(textToCopy).then(() => {
              const originalColor = btn.style.backgroundColor;
              btn.style.backgroundColor = '#10B981';
              setTimeout(() => { btn.style.backgroundColor = originalColor; }, 1000);
            });
          }
        };

        // 📐 FIX DE POSICIÓN: El label arriba, el texto abajo
        labelEl.style.display = 'flex';
        labelEl.style.alignItems = 'center';
        labelEl.style.marginBottom = '8px'; // Espacio antes del texto

        const dataSpan = labelEl.parentElement?.querySelector('span.ng-star-inserted') as HTMLElement;
        if (dataSpan) {
          dataSpan.style.display = 'block'; // Fuerza el salto de línea
          dataSpan.style.width = '100%';
          dataSpan.style.whiteSpace = 'pre-line'; // Respeta saltos de línea si existen
        }

        labelEl.appendChild(btn);
      }
    });
  };

  const observer = new MutationObserver(() => {
    const activeContent = document.querySelector<HTMLElement>('.mat-tab-body-active .mat-tab-body-content');
    if (activeContent) injectMiniCopyButton(activeContent);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  (window as any).visitObserver = observer;

})();


(function (): void {
  if ((window as any).__modalInfoInjected) return;
  (window as any).__modalInfoInjected = true;

  interface TecnicoInfo {
    nombre: string;
    tipoVisita: string;
    horario: string; // <-- Nueva propiedad agregada
  }

  const globalWindow = window as any;

  if (globalWindow.__modalInfoObserver) {
    globalWindow.__modalInfoObserver.disconnect();
  }

  function getTecnicoInfo(codigoCliente: string): TecnicoInfo | null {
    if (!codigoCliente) return null;

    // 1. Buscamos el slot que contiene el código del cliente
    const spans = document.querySelectorAll<HTMLElement>(
      '[data-multitasking-ready="true"] span.cursor-pointer'
    );

    for (const span of spans) {
      if (span.textContent?.trim() !== codigoCliente) continue;

      // Encontramos el componente de slot específico
      const slotComponent = span.closest<HTMLElement>('vex-calendario-slot');
      const row = span.closest<HTMLElement>('.card.p-5.grid.grid-cols-9');
      if (!slotComponent || !row) continue;

      // ── TRUCO PARA EL HORARIO: Indexación de Columnas ──
      // Obtenemos todos los hijos directos de la fila del técnico
      const hermanosFila = Array.from(row.children);
      // Buscamos en qué índice de columna cayó nuestro slot (0-indexed)
      const indexColumna = hermanosFila.indexOf(slotComponent);

      let horario = '—';
      if (indexColumna !== -1) {
        // Buscamos la cabecera de la agenda que tiene las horas (es la fila con la clase 'caption')
        const headerRow = document.querySelector<HTMLElement>('.card.p-5.grid.grid-cols-9.caption');
        if (headerRow) {
          const columnasCabecera = headerRow.children;
          // Si el índice existe en la cabecera, extraemos el rango (ej: "12:00 - 14:00")
          if (columnasCabecera[indexColumna]) {
            horario = (columnasCabecera[indexColumna] as HTMLElement).innerText.trim();
          }
        }
      }

      // Nombre del técnico
      const tecnicoEl = row.querySelector<HTMLElement>('[data-copy-tecnico="true"]');
      const nombre = tecnicoEl
        ? `${(tecnicoEl.childNodes[0] as Text)?.textContent?.trim() ?? ''} ${tecnicoEl.querySelector('span')?.textContent?.trim() ?? ''
          }`.trim()
        : '—';

      // Tipo de visita
      const slotContent = span.closest<HTMLElement>('[data-multitasking-ready="true"]')?.parentElement;
      const tipoVisita = slotContent?.querySelector<HTMLElement>('div:first-child')?.innerText?.trim() ?? '—';

      return { nombre, tipoVisita, horario };
    }

    return null;
  }

  function getVal(dialog: HTMLElement, labelText: string): string {
    const labels = dialog.querySelectorAll<HTMLElement>('.label');
    for (const label of labels) {
      if (!label.innerText.includes(labelText)) continue;
      let node: ChildNode | null = label.nextSibling;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          return node.textContent.trim();
        }
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).innerText?.trim()) {
          return (node as HTMLElement).innerText.trim();
        }
        node = node.nextSibling;
      }
      return label.parentElement?.innerText?.replace(label.innerText, '').trim() ?? '—';
    }
    return '—';
  }

  function col(label: string, value: string, color: string = '#222'): string {
    return `
      <div>
        <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">
          ${label}
        </div>
        <div style="font-weight:700;font-size:13px;color:${color};line-height:1.3">
          ${value}
        </div>
      </div>
    `;
  }

  function injectHeader(dialog: HTMLElement): void {
    if (dialog.querySelector('#vex-quick-header')) return;
    if (!dialog.innerText.includes('Cliente:')) return;

    const cliente = getVal(dialog, 'Cliente:');
    const codigo = getVal(dialog, 'Código de cliente:');
    const celular = getVal(dialog, 'Celular:');
    const distrito = getVal(dialog, 'Distrito:');
    const provincia = getVal(dialog, 'Provincia:');
    const depto = getVal(dialog, 'Departamento:');

    const ubicacion = [distrito, provincia, depto]
      .filter((v): v is string => v !== '—')
      .join(' / ') || '—';

    // Extraemos la información extendida que incluye el cálculo del horario
    const tecnicoInfo = getTecnicoInfo(codigo);
    const tecnicoNombre = tecnicoInfo?.nombre ?? '—';
    const tecnicoTipoVisita = tecnicoInfo?.tipoVisita ?? '—';
    const RangoHorario = tecnicoInfo?.horario ?? '—';

    const codigoCell = `${codigo} <span style="color:#bbb;font-weight:300">|</span> ${celular}`;

    const tecnicoCell = `
      <div>
        <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Técnico</div>
        <div style="font-weight:700;font-size:13px;color:#15803d;line-height:1.3">${tecnicoNombre}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px">${tecnicoTipoVisita}</div>
      </div>
    `;

    const header = document.createElement('div');
    header.id = 'vex-quick-header';
    header.style.cssText = `
      margin: 0 0 8px 0;
      padding: 10px 16px;
      background: #faf5ff;
      border-left: 4px solid #662D91;
      border-radius: 0 6px 6px 0;
      display: grid;
      grid-template-columns: 1.8fr 1.2fr 1.3fr 1.3fr 1.4fr; /* Ajustado de 4 a 5 columnas */
      gap: 12px;
      align-items: center;
      font-family: inherit;
      box-shadow: 0 1px 4px rgba(102,45,145,0.08);
    `;

    // Renderizado con la nueva columna de Horario integrada arriba
    header.innerHTML =
      col('Cliente', cliente, '#1a1a1a') +
      tecnicoCell +
      col('Código / Cel', codigoCell, '#662D91') +
      col('Horario Agendado', RangoHorario, '#b45309') + // Color ámbar oscuro estilizado para resaltar
      col('Ubicación', ubicacion, '#444');

    dialog.querySelector<HTMLElement>('.mat-dialog-title')
      ?.insertAdjacentElement('afterend', header);
  }

  const observer = new MutationObserver((): void => {
    const dialog = document.querySelector<HTMLElement>('mat-dialog-container');
    if (dialog) injectHeader(dialog);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  globalWindow.__modalInfoObserver = observer;

  const dialogExistente = document.querySelector<HTMLElement>('mat-dialog-container');
  if (dialogExistente) injectHeader(dialogExistente);
})();



((): void => {
  type Visita = {
    fecha: Date;
    fechaSolicitud: Date | null;
    tecnico: string;
    cuadrilla: string;
    tipo: string;
  };
  type Caso = 'verde' | 'ambar' | 'rojo-fuerte' | 'rojo-suave';
  type Theme = {
    border: string;
    headBg: string;
    headColor: string;
    diasColor: string;
    icon: string;
    label: string;
  };

  const BANNER_ID = 'garantia-banner-v2';
  const MESES: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  const THEMES: Record<Caso, Theme> = {
    verde: { border: '#3B6D11', headBg: '#EAF3DE', headColor: '#1A4A08', diasColor: '#1A4A08', icon: '✓', label: 'SIN REINCIDENCIA' },
    ambar: { border: '#BA7517', headBg: '#FFF3D6', headColor: '#633806', diasColor: '#BA7517', icon: '⚠', label: 'MISMO TÉCNICO' },
    'rojo-fuerte': { border: '#A32D2D', headBg: '#A32D2D', headColor: '#ffffff', diasColor: '#FF6B6B', icon: '✕', label: 'MISMA CUADRILLA' },
    'rojo-suave': { border: '#E24B4A', headBg: '#FDEDED', headColor: '#7B1F1F', diasColor: '#E24B4A', icon: '✕', label: 'REINCIDENCIA EXTERNA' },
  };

  function parseFecha(str: string): Date | null {
  if (!str) return null;

  const m = str.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})(?:\s+(\d+):(\d+)\s*(AM|PM)?)?/i);
  if (m) {
    const mes = MESES[m[2].toLowerCase()] ?? 0;
    let hh = m[4] ? Number(m[4]) : 0;
    const mm = m[5] ? Number(m[5]) : 0;
    const meridiem = m[6]?.toUpperCase();

    if (hh <= 12) {
      if (meridiem === 'PM' && hh !== 12) hh += 12;
      if (meridiem === 'AM' && hh === 12) hh = 0;
    }

    return new Date(Number(m[3]), mes, Number(m[1]), hh, mm, 0);
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str.substring(0, 10) + 'T00:00:00');
  }

  return null;
}

  function getField(card: Element, labelText: string): string {
    const labels = card.querySelectorAll<HTMLElement>('.label');
    for (const lbl of labels) {
      const txt = lbl.textContent?.trim() ?? '';
      if (!txt.startsWith(labelText)) continue;
      const span = lbl.parentElement?.querySelector<HTMLSpanElement>('span');
      if (span?.textContent?.trim()) return span.textContent.trim();
      let node: ChildNode | null = lbl.nextSibling;
      while (node) {
        const t = node.textContent?.trim() ?? '';
        if (t) return t;
        node = node.nextSibling;
      }
    }
    return '';
  }

  function isValidVisita(card: Element): boolean {
    const estado = getField(card, 'Estado:').toLowerCase();
    if (estado === 'anulado') return false;
    const tecnico = getField(card, 'Asignado a:').trim();
    if (!tecnico || tecnico.toLowerCase().includes('sin asignacion')) return false;
    return true;
  }

  function buildAlertaDilacion(fechaSolicitud: Date): HTMLDivElement {
    const horasDesde = (Date.now() - fechaSolicitud.getTime()) / 36e5;

    // Formato de tiempo transcurrido
    const fmtTiempo = (h: number): string => {
      if (h < 1) {
        const mins = Math.floor(h * 60);
        return `${mins}min`;
      }
      if (h < 24) {
        const hh = Math.floor(h);
        const mm = Math.floor((h - hh) * 60);
        return mm > 0 ? `${hh}h ${mm}min` : `${hh}h`;
      }
      return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;
    };

    // Determinar nivel
    type Nivel = {
      nivel: number;
      label: string;
      bg: string;
      color: string;
      badge: string;
      mostrarRegenerar: boolean;
    };

    const getNivel = (h: number): Nivel => {
      if (h <= 2) return {
        nivel: 1,
        label: 'Excelente',
        bg: '#dcfce7',
        color: '#14532d',
        badge: '#86efac',
        mostrarRegenerar: false,
      };
      if (h <= 24) return {
        nivel: 2,
        label: 'Buena',
        bg: '#fef9c3',
        color: '#713f12',
        badge: '#fde047',
        mostrarRegenerar: false,
      };
      if (h <= 48) return {
        nivel: 3,
        label: 'Moderada',
        bg: '#fed7aa',
        color: '#7c2d12',
        badge: '#fb923c',
        mostrarRegenerar: false,
      };
      if (h <= 72) return {
        nivel: 4,
        label: 'Medianamente grave',
        bg: '#fca5a5',
        color: '#7f1d1d',
        badge: '#f87171',
        mostrarRegenerar: false,
      };
      // > 72h
      return {
        nivel: 5,
        label: 'Crítica',
        bg: '#fecaca',
        color: '#7f1d1d',
        badge: '#ef4444',
        mostrarRegenerar: true,
      };
    };

    const n = getNivel(horasDesde);
    const tiempoStr = fmtTiempo(horasDesde);

    const alerta = document.createElement('div');
    alerta.style.cssText = `
    background: ${n.bg};
    color: ${n.color};
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    letter-spacing: .2px;
  `;

    const regenerarBadge = n.mostrarRegenerar
      ? `<span style="background:rgba(255,255,255,0.35);border-radius:4px;padding:2px 8px;font-size:10px;white-space:nowrap">
        ⚠️ REGENERAR ORDEN
       </span>`
      : '';

    alerta.innerHTML = `
    <span style="display:flex;align-items:center;gap:6px">
      <span style="font-size:14px">⏰</span>
      Solicitud hace <b>${tiempoStr}</b>
      &nbsp;·&nbsp;
      <span style="background:${n.badge};color:${n.color};border-radius:3px;padding:1px 6px;font-size:10px">
        N${n.nivel} — ${n.label}
      </span>
    </span>
    ${regenerarBadge}
  `;

    return alerta;
  }

  function buildBanner(caso: Caso, visitas: Visita[], dias: number | null): HTMLDivElement {
    const t = THEMES[caso];
    const v2 = visitas[1] ?? null;
    const div = document.createElement('div');
    div.id = BANNER_ID;
    div.style.cssText = `
      margin: 8px 0 12px 0;
      border: 2px solid ${t.border};
      border-radius: 8px;
      overflow: hidden;
      font-family: inherit;
      font-size: 13px;
    `;

    // ── Header principal ──
    const head = document.createElement('div');
    head.style.cssText = `
      background: ${t.headBg};
      color: ${t.headColor};
      padding: 8px 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    const labelExtra = caso === 'rojo-fuerte' && v2
      ? ` — DEBES MOVER ESTA GARANTÍA A "${v2.tecnico}"`
      : '';
    head.innerHTML = `<span style="font-size:16px">${t.icon}</span> GARANTÍA — ${t.label}${labelExtra}`;
    div.appendChild(head);

    const fechaSolicitudV1 = visitas[0].fechaSolicitud;
    if (fechaSolicitudV1) {
      div.appendChild(buildAlertaDilacion(fechaSolicitudV1));
    }

    // ── Body ──
    const body = document.createElement('div');
    body.style.cssText = `padding: 10px 14px; background: #fff;`;

    const fmt = (d: Date | null): string =>
      d
        ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
        : '-';

    const rows = visitas.slice(0, 2).map((v, i) => `
      <tr style="background:${i === 0 ? '#f5f5f5' : '#fff'}">
        <td style="padding:4px 8px;font-weight:${i === 0 ? '700' : '400'}">${i === 0 ? '▶ Actual' : 'Anterior'}</td>
        <td style="padding:4px 8px">${fmt(v.fecha)}</td>
        <td style="padding:4px 8px">${v.tecnico}</td>
        <td style="padding:4px 8px">${v.cuadrilla}</td>
      </tr>
    `).join('');

    const notaDias = dias !== null && visitas[0].fechaSolicitud && visitas[1]
      ? `F. Visita anterior (${fmt(visitas[1].fecha)}) vs F. Solicitud actual (${fmt(visitas[0].fechaSolicitud)})`
      : '';

    body.innerHTML = `
      ${dias !== null ? `
        <div style="margin-bottom:4px;color:#555">
          Días entre visitas: <b style="color:${t.diasColor}">${dias} días</b>
        </div>
        ${notaDias ? `<div style="margin-bottom:8px;color:#999;font-size:11px">${notaDias}</div>` : ''}
      ` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#eee;color:#555;font-size:11px;text-transform:uppercase">
            <th style="padding:4px 8px;text-align:left">Visita</th>
            <th style="padding:4px 8px;text-align:left">Fecha</th>
            <th style="padding:4px 8px;text-align:left">Técnico</th>
            <th style="padding:4px 8px;text-align:left">Cuadrilla</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    div.appendChild(body);
    return div;
  }

  function applyGarantiaBanner(): void {
    const activeTabLabel = document.querySelector<HTMLElement>(
      '.mat-tab-label-active .mat-tab-label-content'
    );
    if (!activeTabLabel || activeTabLabel.textContent?.trim() !== 'Lista de visitas') return;

    const tabGroup = document.querySelector<HTMLElement>(
      'mat-dialog-container mat-tab-group'
    );
    if (!tabGroup) return;
    if (tabGroup.querySelector('#' + BANNER_ID)) return;

    const bodyWrapper = tabGroup.querySelector<HTMLElement>('.mat-tab-body-wrapper');
    if (!bodyWrapper) return;

    const tabContent = document.querySelector<HTMLElement>(
      'mat-dialog-container .mat-tab-body-active .mat-tab-body-content'
    );
    if (!tabContent) return;

    const visitas: Visita[] = [];

    tabContent.querySelectorAll('.bg-white.shadow').forEach(card => {
      const el = card as Element;
      if (!isValidVisita(el)) return;

      const tecnico = getField(el, 'Asignado a:');
      const cuadrilla = getField(el, 'Cuadrilla:');
      const tipo = getField(el, 'Tipo:');
      const fechaStr = getField(el, 'F. Visita:') || getField(el, 'F. completado:');
      const fecha = parseFecha(fechaStr);
      const fechaSolicitud = parseFecha(getField(el, 'F. Solicitud:'));

      if (fecha && tecnico) {
        visitas.push({ fecha, fechaSolicitud, tecnico, cuadrilla, tipo });
      }
    });

    if (!visitas.length) return;

    const tieneInstalacion = visitas.some(
      v => v.tipo.toLowerCase().includes('instalación de servicio') ||
        v.tipo.toLowerCase().includes('instalacion de servicio')
    );
    const tieneOtraVisita = visitas.some(
      v => !v.tipo.toLowerCase().includes('instalación de servicio') &&
        !v.tipo.toLowerCase().includes('instalacion de servicio')
    );
    if (!tieneInstalacion || !tieneOtraVisita) return;

    visitas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const v1 = visitas[0];
    const v2 = visitas[1] ?? null;

    const dias = v2 && v1.fechaSolicitud
      ? Math.round((v1.fechaSolicitud.getTime() - v2.fecha.getTime()) / 86400000)
      : null;

    let caso: Caso;
    if (!v2 || dias === null || dias > 30) {
      caso = 'verde';
    } else if (v1.tecnico.trim().toLowerCase() === v2.tecnico.trim().toLowerCase()) {
      caso = 'ambar';
    } else if (
      (v1.cuadrilla ?? '').trim().toLowerCase() ===
      (v2.cuadrilla ?? '').trim().toLowerCase()
    ) {
      caso = 'rojo-fuerte';
    } else {
      caso = 'rojo-suave';
    }

    const banner = buildBanner(caso, visitas, dias);
    tabGroup.insertBefore(banner, bodyWrapper);
  }

  const w = window as Window & { _garantiaObserver?: MutationObserver };
  if (w._garantiaObserver) w._garantiaObserver.disconnect();

  const observer = new MutationObserver(() => applyGarantiaBanner());
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  w._garantiaObserver = observer;

  applyGarantiaBanner();
})();

((): void => {
  const HIGHLIGHT_ID = 'garantia-highlight-active';
  const MESES: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  function parseFecha(str: string): Date | null {
    if (!str) return null;
    const m = str.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i);
    if (m) return new Date(Number(m[3]), MESES[m[2].toLowerCase()] ?? 0, Number(m[1]));
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str.substring(0, 10) + 'T00:00:00');
    return null;
  }

  function getFieldFromCard(card: Element, labelText: string): string {
    const labels = card.querySelectorAll<HTMLElement>('.label');
    for (const lbl of labels) {
      if (!(lbl.textContent?.trim() ?? '').startsWith(labelText)) continue;
      const span = lbl.parentElement?.querySelector<HTMLSpanElement>('span');
      if (span?.textContent?.trim()) return span.textContent.trim();
      let node: ChildNode | null = lbl.nextSibling;
      while (node) {
        const t = node.textContent?.trim() ?? '';
        if (t) return t;
        node = node.nextSibling;
      }
    }
    return '';
  }

  function isValidCard(card: Element): boolean {
    // Ignorar anuladas
    const estado = getFieldFromCard(card, 'Estado:').toLowerCase();
    if (estado === 'anulado') return false;

    // Ignorar sin asignación
    const tecnico = getFieldFromCard(card, 'Asignado a:').trim();
    if (!tecnico || tecnico.toLowerCase().includes('sin asignacion')) return false;

    return true;
  }

  const w = window as Window & { _highlightObserver?: MutationObserver };

  function applyHighlight(): void {
    w._highlightObserver?.disconnect();

    try {
      const activeTabLabel = document.querySelector<HTMLElement>(
        '.mat-tab-label-active .mat-tab-label-content'
      );
      if (!activeTabLabel || activeTabLabel.textContent?.trim() !== 'Lista de visitas') return;

      const tabContent = document.querySelector<HTMLElement>(
        'mat-dialog-container .mat-tab-body-active .mat-tab-body-content'
      );
      if (!tabContent) return;

      // Limpiar highlight previo
      tabContent.querySelectorAll<HTMLElement>(`[data-${HIGHLIGHT_ID}]`).forEach(el => {
        el.style.borderLeftColor = '#d1d5db';
        el.style.background = '';
        el.removeAttribute(`data-${HIGHLIGHT_ID}`);
        el.querySelector(`#${HIGHLIGHT_ID}-badge`)?.remove();
      });

      const cards = Array.from(tabContent.querySelectorAll<HTMLElement>('.bg-white.shadow'));
      const candidates: { card: HTMLElement; fechaSolicitud: Date }[] = [];

      const now = new Date();

      for (const card of cards) {
        // ← Filtros: no anuladas, no sin asignación
        if (!isValidCard(card)) continue;

        // ← Solo visitas que NO sean instalación
        const tipo = getFieldFromCard(card, 'Tipo:').toLowerCase();
        if (
          tipo.includes('instalación de servicio') ||
          tipo.includes('instalacion de servicio')
        ) continue;

        // ← Ordenar por F. Solicitud más cercana a hoy
        const solicitudStr = getFieldFromCard(card, 'F. Solicitud:');
        const fechaSolicitud = parseFecha(solicitudStr);
        if (!fechaSolicitud) continue;

        candidates.push({ card, fechaSolicitud });
      }

      if (!candidates.length) return;

      // La más cercana al día de hoy (menor diferencia absoluta)
      candidates.sort((a, b) =>
        Math.abs(a.fechaSolicitud.getTime() - now.getTime()) -
        Math.abs(b.fechaSolicitud.getTime() - now.getTime())
      );

      const { card: latest } = candidates[0];

      if (latest.hasAttribute(`data-${HIGHLIGHT_ID}`)) return;

      latest.style.borderLeftColor = '#16a34a';
      latest.style.background = '#f0fdf4';
      latest.setAttribute(`data-${HIGHLIGHT_ID}`, 'true');

      const badge = document.createElement('div');
      badge.id = `${HIGHLIGHT_ID}-badge`;
      badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        float: right;
        margin: 0 0 6px 6px;
        background: #dcfce7;
        color: #15803d;
        border: 1px solid #86efac;
        border-radius: 99px;
        padding: 2px 10px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .4px;
      `;
      badge.textContent = '▶ VISITA MÁS RECIENTE';
      latest.insertBefore(badge, latest.firstChild);

    } finally {
      w._highlightObserver?.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  }

  if (w._highlightObserver) w._highlightObserver.disconnect();
  w._highlightObserver = new MutationObserver(() => applyHighlight());
  applyHighlight();
})();

(() => {
  // Interfaces para extender elementos del DOM si fuera necesario
  // o simplemente usamos casting para mayor velocidad en el build.

  const getCurrentTime = (): string =>
    new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

  const getDepartamento = (): string => {
    const sel = document.querySelector('mat-select[formcontrolname="departament_code"] .mat-select-value-text span') as HTMLElement | null;
    return sel?.textContent?.trim() || 'TODOS';
  };

  const getCode = (slot: HTMLElement): string => {
    const sp = slot.querySelector('span.cursor-pointer') as HTMLElement | null;
    return sp?.textContent?.trim() || 'SIN CODIGO';
  };

  /**
   * Busca al técnico basándose en la jerarquía de la fila (.card)
   */
  const getTecnicoRelativo = (btn: HTMLButtonElement): string => {
    const fila = btn.closest('.card') as HTMLElement | null;
    if (!fila) return 'NO ENCONTRADO';

    const elTecnico = fila.querySelector('[data-copy-tecnico="true"]') as HTMLElement | null;
    if (!elTecnico) return 'SIN ASIGNAR';

    // Clonamos para manipular el texto sin afectar la UI real
    const temp = elTecnico.cloneNode(true) as HTMLElement;
    const badge = temp.querySelector('span');
    if (badge) badge.remove();

    return temp.textContent?.trim() || 'SIN NOMBRE';
  };

  const makeBtn = (label: string, reporte: string, color: string, slot: HTMLElement): HTMLButtonElement => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.type = 'button'; // Evita comportamientos de submit por defecto
    btn.style.cssText = `background:${color};color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:0.62rem;cursor:pointer;font-weight:700;transition:opacity 0.15s;`;

    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const codigo = getCode(slot);
      const tecnico = getTecnicoRelativo(btn);
      const depto = getDepartamento();

      const text = [
        `*CODIGO:* ${codigo}`,
        `*DEPARTAMENTO:* ${depto}`,
        `*TECNICO:* ${tecnico.toUpperCase()}`,
        `*HORA:* ${getCurrentTime()}`,
        `*REPORTE:* ${reporte}`,
        `*OBSERVACIÓN:* `,
      ].join('\n');

      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'OK';
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = color;
        }, 1000);
      }).catch(err => console.error('Clipboard error:', err));
    });

    return btn;
  };

  const inject = (): void => {
    const slots = document.querySelectorAll('vex-calendario-slot');

    slots.forEach(node => {
      const slot = node as HTMLElement;
      if (slot.querySelector('.custom-btns')) return;

      const innerSlot = slot.querySelector('.slot-pendiente, .slot-urgente, .slot-programado, .slot-en-proceso') as HTMLElement | null;
      if (!innerSlot) return;

      const codigo = getCode(slot);
      if (codigo === 'SIN CODIGO') return;

      // ─── Leer el tipo de servicio ─────────────────────────────
      const tipoEl = innerSlot.querySelector<HTMLElement>('div > div:first-child');
      const tipoTexto = tipoEl?.textContent?.trim().toLowerCase() ?? '';

      const esInstalacion = tipoTexto.includes('instalac');
      // ─────────────────────────────────────────────────────────

      const container = document.createElement('div');
      container.className = 'custom-btns';
      container.style.cssText = 'display:flex;gap:4px;margin-top:6px;justify-content:center;border-top:1px solid rgba(0,0,0,0.05);padding-top:4px;';

      if (esInstalacion) {
        // Solo instalaciones tienen IT / SC / DS
        container.appendChild(makeBtn('IT', 'IMPOSIBILIDAD TÉCNICA', '#C71256', slot));
        container.appendChild(makeBtn('SC', 'SIN CONTACTO', '#6366f1', slot));
        container.appendChild(makeBtn('DS', 'DESISTE', '#f59e0b', slot));
      }
      // Si no es instalación, container queda vacío → no lo agregues
      if (container.children.length === 0) return;

      innerSlot.appendChild(container);
    });
  };

  inject();

  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
    if (hasAddedNodes) {
      inject();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();

(async function injectUbigeosToUI(): Promise<void> {
  const dataStorage = await chrome.storage.local.get(['listTechnicians']) as { listTechnicians?: TecnicoResumen[] };
  const tecnicosData: TecnicoResumen[] = dataStorage.listTechnicians || [];

  if (tecnicosData.length === 0) {
    console.warn('⚠️ No se encontró data de técnicos en el storage.');
    return;
  }

  const tecnicoCards: NodeListOf<HTMLDivElement> = document.querySelectorAll('div.card.p-5.grid.grid-cols-9');

  tecnicoCards.forEach((card: HTMLDivElement) => {
    const nameContainer = card.querySelector<HTMLDivElement>('[data-copy-tecnico="true"]');
    if (!nameContainer) return;

    const rawName: string = nameContainer.textContent?.trim() || "";
    const cleanName: string = rawName.split(' (')[0].trim().toUpperCase();

    const match: TecnicoResumen | undefined = tecnicosData.find(
      (t: TecnicoResumen) => t.nombre.toUpperCase() === cleanName
    );

    if (match) {
      if (card.querySelector('.wow-ui-ubigeos')) return;

      const ubigeoBox: HTMLDivElement = document.createElement('div');
      ubigeoBox.className = 'wow-ui-ubigeos';

      const boxStyles: Partial<CSSStyleDeclaration> = {
        marginTop: '10px',
        padding: '8px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#475569',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        lineHeight: '1.4',
        pointerEvents: 'auto'
      };
      Object.assign(ubigeoBox.style, boxStyles);

      // Título
      const title: HTMLDivElement = document.createElement('div');
      title.innerHTML = `<strong>📍 UBIGEOS ASIGNADOS:</strong>`;
      title.style.color = '#0f172a';
      title.style.marginBottom = '4px';
      title.style.fontSize = '10px';
      ubigeoBox.appendChild(title);

      const uniqueZones: string[] = [...new Set(match.zonasBase)];
      uniqueZones.forEach((zona: string) => {
        const zoneItem: HTMLDivElement = document.createElement('div');
        zoneItem.textContent = `• ${zona}`;
        zoneItem.style.paddingLeft = '4px';
        ubigeoBox.appendChild(zoneItem);
      });

      if (nameContainer.parentElement) {
        nameContainer.parentElement.appendChild(ubigeoBox);
      }
    }
  });

})();

// (function () {

//   function getHoraDesdeBtn(btn: HTMLButtonElement): string {
//     const SLOTS: Record<number, string> = {
//       1: '06:30 - 08:00',
//       2: '08:00 - 10:00',
//       3: '10:00 - 12:00',
//       4: '12:00 - 14:00',
//       5: '14:00 - 16:00',
//       6: '16:00 - 18:00',
//     };

//     const vex = btn.closest('vex-calendario-slot') as HTMLElement | null;
//     if (!vex) return '—';

//     const parent = vex.parentElement;
//     if (!parent) return '—';

//     const row: HTMLElement = parent.className?.includes('col-span-2')
//       ? (parent.parentElement as HTMLElement)
//       : parent;

//     const kids = Array.from(row.children) as HTMLElement[];
//     let col = kids.indexOf(vex);
//     if (col === -1) {
//       const cp2 = vex.parentElement;
//       if (cp2) col = kids.indexOf(cp2);
//     }

//     return SLOTS[col] ?? (col >= 7 ? 'Adicional' : '—');
//   }

//   function limpiarYFormatearTipo(texto: string | null | undefined): string {
//     if (!texto) return '';

//     return texto
//       .trim()
//       .normalize('NFD')
//       .replace(/[\u0300-\u036f]/g, '')
//       .replace(/[ñÑ]/g, 'n')
//       .replace(/[\s\-_]+/g, '_')
//       .replace(/[^a-zA-Z0-9_]/g, '')
//       .toUpperCase();
//   }

//   const ORDERS: { [key: string]: string } = {
//     "CAMBIO_DE_TELEFONO": "CAMBIO_DE_TELEFONO",
//     "CONTROL_DE_CALIDAD": "CONTROL_DE_CALIDAD",
//     "INSTALACION_DE_REPETIDOR": "INSTALACION_DE_REPETIDOR",
//     "INSTALACION_DE_REPETIDOR_POR_POSICIONAMIENTO": "INSTALACION_DE_REPETIDOR_POR_POSICIONAMIENTO",
//     "INSTALACION_DE_SERVICIO": "INSTALACION_DE_SERVICIO",
//     "INSTALACION_DE_TELEFONO": "INSTALACION_DE_TELEFONO",
//     "MUDANZA_CON_COSTO": "MUDANZA_CON_COSTO",
//     "MUDANZA_EXTERNA_CON_COSTO": "MUDANZA_EXTERNA_CON_COSTO",
//     "MUDANZA_EXTERNA_SIN_COSTO": "MUDANZA_EXTERNA_SIN_COSTO",
//     "MUDANZA_SIN_COSTO": "MUDANZA_SIN_COSTO",
//     "NOC_INFRAESTRUCTURA": "NOC_INFRAESTRUCTURA",
//     "PREVENTIVO": "PREVENTIVO",
//     "RECABLEADO_ACOMETIDA_DROP": "RECABLEADO_ACOMETIDA_DROP",
//     "REORDENAMIENTO_ACOMETIDA_DROP": "REORDENAMIENTO_ACOMETIDA_DROP",
//     "RETENCIONES": "RETENCIONES",
//     "RETENCIONES_SOPORTE_TECNICO_ESPECIALIZADO": "RETENCIONES_SOPORTE_TECNICO_ESPECIALIZADO",
//     "SOPORTE_TECNICO_CON_COSTO": "SOPORTE_TECNICO_CON_COSTO",
//     "SOPORTE_TECNICO_SIN_COSTO": "SOPORTE_TECNICO_SIN_COSTO"
//   };

//   const endpoint = 'http://localhost:5678/webhook-test/3e2759ae-4e91-4934-9c32-fe68eb69c63e';


//   const getData = async (body: any) => {
//     const token = localStorage.getItem('token') || '';
//     try {
//       const response = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ ...body, token })
//       });

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   }

//   function getTecnicoDesdeBtn(btn: HTMLButtonElement): string {
//     const fila = btn.closest('.card') as HTMLElement | null;
//     if (!fila) return 'NO ENCONTRADO';
//     const el = fila.querySelector('[data-copy-tecnico="true"]') as HTMLElement | null;
//     if (!el) return 'SIN ASIGNAR';
//     const temp = el.cloneNode(true) as HTMLElement;
//     temp.querySelector('span')?.remove();
//     return temp.textContent?.trim().split(' (')[0].trim().toUpperCase() || 'SIN NOMBRE';
//   }

//   function addWhatsAppButtons() {
//     document.querySelectorAll('.custom-btns').forEach(container => {
//       if (container.querySelector('.btn-wsp')) return;

//       const btn = document.createElement('button');
//       btn.type = 'button';
//       btn.className = 'btn-wsp';
//       btn.textContent = 'WSP';
//       btn.style.cssText = `
//         background: #25D366; color: #fff; border: none;
//         border-radius: 4px; padding: 2px 8px; font-size: 0.62rem;
//         cursor: pointer; font-weight: 700; transition: opacity 0.15s;
//       `;

//       btn.addEventListener('click', async function () {
//         const codigoEl = container.closest('.relative')?.querySelector('span.cursor-pointer') as HTMLElement | null;
//         const codigo = codigoEl?.textContent?.trim() || 'N/A';

//         const tipoEl = container.closest('.relative')?.querySelector('.slot-pendiente > div > div:first-child') as HTMLElement | null;
//         const tipo = tipoEl?.textContent?.trim() || 'N/A';

//         const hora = getHoraDesdeBtn(btn);
//         const nombre = getTecnicoDesdeBtn(btn);

//         btn.textContent = '...';
//         btn.disabled = true;
//         btn.style.opacity = '0.6';

//         let idRealSGC: number | null = null;
//         try {
//           const rawData = localStorage.getItem('listTechnicians');
//           if (rawData) {
//             const listaTecnicos = JSON.parse(rawData);

//             const servicioEncontrado = listaTecnicos
//               .flatMap((t: any) => t.servicios)
//               .find((s: any) => s.codigo === codigo);

//             if (servicioEncontrado) {
//               idRealSGC = servicioEncontrado.id;
//             }
//           }
//         } catch (error) {
//           console.error('Error al recuperar idRealSGC desde localStorage:', error);
//         }
//         const body = {
//           id: idRealSGC,
//           codigo,
//           nombre: nombre.replaceAll("\\s{2,}", " ").toUpperCase(),
//           tipo: ORDERS[limpiarYFormatearTipo(tipo)] || 'OTRO',
//           hora
//         };

//         await getData(body);

//         setTimeout(() => {
//           const notify = () => new Notification('✅ Orden enviada — WOW Multitasking', {
//             body: `${nombre} ha sido notificado vía WhatsApp sobre el cliente ${codigo} (${tipo})`,
//             icon: 'https://sgc.wowperu.pe/assets/img/demo/wow-peru-logo-2024-blanco.svg',
//           });

//           if (Notification.permission === 'granted') {
//             notify();
//           } else if (Notification.permission !== 'denied') {
//             Notification.requestPermission().then(p => p === 'granted' && notify());
//           }

//           btn.textContent = '✓ WSP';
//           btn.style.opacity = '1';
//           btn.disabled = false;
//           setTimeout(() => { btn.textContent = 'WSP'; }, 2000);
//         }, 3000);
//       });

//       container.appendChild(btn);
//     });
//   }

//   addWhatsAppButtons();
//   new MutationObserver(addWhatsAppButtons).observe(document.body, { childList: true, subtree: true });
// })();