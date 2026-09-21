import { createRoot } from 'react-dom/client';
import { DateTimeFixed } from '../pluggins/DateTimeFixed/DateTimeFixed';
import SpeedDeal from '../components/SpeedDeal/SpeedDeal';
import { UIProvider } from '../context/UIContext';
import { createElement } from 'react';
import { Toaster } from "sileo";
import { InterceptorService } from '../services/interceptor.service';
import { TechnicianService } from '../services/technician.service';
import { MultitaskingProvider } from '../context/MultitaskingContext';
import { CacheCodesService } from '../services/cache-codes.service';

console.log("[WOW Main] Inicializando Content Script Principal...");

const dataLocal = localStorage.getItem('listTechnicians');
if (dataLocal) {
  try {
    const datosCache = JSON.parse(dataLocal);
    setTimeout(() => {
      TechnicianService.addUbigeos(datosCache);
    }, 300);
  } catch (e) {
    console.error("[WOW Main] Error al leer el caché local:", e);
  }
}

window.addEventListener('WOW_DATA_INTERCEPTED', async (event: Event) => {
  console.log("[WOW Main] 🔥 Evento 'WOW_DATA_INTERCEPTED' detectado en tiempo real!");
  const customEvent = event as CustomEvent;

  CacheCodesService.appendFromApi(customEvent.detail); 
  const datosProcesados = TechnicianService.processTechniciansJson(customEvent.detail);

  if (datosProcesados.length === 0) return;

  chrome.storage.local.set({ listTechnicians: datosProcesados });
  localStorage.setItem('listTechnicians', JSON.stringify(datosProcesados));

  TechnicianService.addUbigeos(datosProcesados);
});

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

InterceptorService.inject();

const root = createRoot(container);
root.render(
  createElement(
    UIProvider,
    null,
    createElement(
      MultitaskingProvider,
      null,
      createElement(Toaster, { position: 'top-center' }),
      createElement(DateTimeFixed),
      createElement(SpeedDeal)
    )
  )
);