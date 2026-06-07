import { createRoot } from 'react-dom/client';
import { DateTimeFixed } from '../pluggins/DateTimeFixed/DateTimeFixed';
import SpeedDeal from '../components/SpeedDeal/SpeedDeal';
import { UIProvider } from '../context/UIContext';
import type { TecnicoResumen } from '../types/wow';
import { createElement } from 'react';

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

function injectInterceptor() {
  console.log("[WOW Extension] Una creación de Ángel Santa Cruz 🧙‍♂️✨");
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('assets/interceptor.js');
  script.dataset.extensionId = chrome.runtime.id;
  (document.head || document.documentElement).appendChild(script);
}

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
            distrito: v.ubigeo.district,
            estado: v.state.description,
          };
        })
    }
  });
};

const paintUbigeos = (tecnicosData: TecnicoResumen[]) => {
  if (tecnicosData.length === 0) return;

  const tecnicoCards = document.querySelectorAll<HTMLDivElement>('div.card.p-5.grid.grid-cols-9');
  if (tecnicoCards.length === 0) return; 

  tecnicoCards.forEach((card) => {
    if (card.querySelector('.wow-ui-ubigeos')) return;

    const nameContainer = card.querySelector<HTMLDivElement>('[data-copy-tecnico="true"]');
    if (!nameContainer) return;

    const rawName = nameContainer.textContent?.trim() ?? '';
    const cleanName = rawName.split(' (')[0].replace(/\s+/g, ' ').trim().toUpperCase();

    const match = tecnicosData.find(t => t.nombre.toUpperCase() === cleanName);
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
      pointerEvents: 'auto',
      lineHeight: '1.5',
    });

    const uniqueZones = [...new Set(match.zonasBase)];
    ubigeoBox.innerHTML = `
      <div style="font-weight:700;font-size:9px;color:#15803d;margin-bottom:3px;">📍 UBIGEOS:</div>
      ${uniqueZones.map(z => `<div>• ${z}</div>`).join('')}
    `;

    nameContainer.parentElement?.appendChild(ubigeoBox);
  });
};

let observerStarted = false;

const startObserver = (tecnicosData: TecnicoResumen[]) => {
  if (observerStarted) return;
  observerStarted = true;

  const observer = new MutationObserver(() => {
    paintUbigeos(tecnicosData);
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

window.addEventListener('WOW_DATA_INTERCEPTED', ((event: CustomEvent) => {
  const datosProcesados = procesarJsonTecnicos(event.detail);

  chrome.storage.local.set({ listTechnicians: datosProcesados });

  localStorage.setItem('listTechnicians', JSON.stringify(datosProcesados));

  paintUbigeos(datosProcesados);

  startObserver(datosProcesados);

  setTimeout(() => paintUbigeos(datosProcesados), 800);
  setTimeout(() => paintUbigeos(datosProcesados), 2000);
}) as EventListener);

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

const root = createRoot(container);
root.render(
  createElement(
    UIProvider,
    null,
    createElement(DateTimeFixed),
    createElement(SpeedDeal)
  )
);