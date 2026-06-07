// content-instaladores.ts
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import Prueba from '../components/Pruea/Prueba';

const injectGlobalStyles = async (): Promise<void> => {
  if (document.getElementById('heroui-global-styles')) return;
  const cssUrl = chrome.runtime.getURL('assets/hero.css');
  const cssText = await (await fetch(cssUrl)).text();
  const style = document.createElement('style');
  style.id = 'heroui-global-styles';
  style.textContent = cssText;
  document.head.appendChild(style);
};

const injectAnimateCSS = async (): Promise<void> => {
  if (document.getElementById('animate-css')) return;
  try {
    const cssText = await (await fetch('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css')).text();
    const style = document.createElement('style');
    style.id = 'animate-css';
    style.textContent = cssText;
    document.head.appendChild(style); // como <style> no como <link>, garantiza que esté listo
  } catch (e) {
    console.warn('[HeroUI] animate.css no pudo cargarse', e);
  }
};

let mounting = false;

const findAgregarBtn = (): HTMLButtonElement | undefined => {
  const spans = Array.from(document.querySelectorAll<HTMLSpanElement>('span'));
  const span = spans.find(s => s.textContent?.trim() === 'Agregar días');
  return span?.closest<HTMLButtonElement>('button') ?? undefined;
};

const mountComponent = async (): Promise<void> => {
  if (mounting) return;
  if (document.getElementById('heroui-configuracion-root')) return;

  const agregarBtn = findAgregarBtn();
  if (!agregarBtn) return;

  mounting = true;
  console.log('[HeroUI] Botón encontrado, montando...');

  try {
    await injectGlobalStyles();
    await injectAnimateCSS(); // await para que esté listo antes de montar

    const host = document.createElement('div');
    host.id = 'heroui-configuracion-root';
    host.style.cssText = 'display:inline-flex;align-items:center;position:relative;';

    const cssUrl = chrome.runtime.getURL('assets/hero.css');
    const cssText = await (await fetch(cssUrl)).text();
    const style = document.createElement('style');
    style.textContent = cssText;
    host.appendChild(style);

    const mountPoint = document.createElement('div');
    host.appendChild(mountPoint);

    agregarBtn.insertAdjacentElement('afterend', host);

    const root = createRoot(mountPoint);
    root.render(createElement(Prueba));

    console.log('[HeroUI] Montado OK');
    observer.disconnect();
  } catch (error) {
    console.error('[HeroUI] Error:', error);
    mounting = false;
  }
};

const observer = new MutationObserver(mountComponent);
observer.observe(document.body, { childList: true, subtree: true });

mountComponent();