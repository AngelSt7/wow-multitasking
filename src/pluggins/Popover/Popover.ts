import { ALLOWED_ROUTES_POPOVER } from "./allowedRoutes";

const TIME_SLOTS = [
  '06:30 - 08:00', '08:00 - 10:00', '10:00 - 12:00',
  '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00',
];

const popover = document.createElement('div');
popover.id = 'wow-popover';
popover.style.cssText = `
  position: fixed; background: #4a0080; color: white;
  padding: 8px 12px; border-radius: 8px; font-size: 12px;
  pointer-events: none; z-index: 99999; display: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 260px; line-height: 1.5;
`;
document.body.appendChild(popover);

let prefActive = false;
let routeActive = false;
let listening = false;

const isRouteOk = () => window.location.href.startsWith(ALLOWED_ROUTES_POPOVER[0]);

function syncListeners() {
  const should = prefActive && routeActive;
  if (should && !listening) {
    document.addEventListener('mousemove', onMouseMove);
    listening = true;
  } else if (!should && listening) {
    document.removeEventListener('mousemove', onMouseMove);
    popover.style.display = 'none';
    listening = false;
  }
}

function onRouteChange() {
  routeActive = isRouteOk();
  syncListeners();
}

// ── Detectar navegación SPA (Angular usa pushState) ──────────
const _push = history.pushState.bind(history);
history.pushState = (...args) => { _push(...args); onRouteChange(); };
window.addEventListener('popstate', onRouteChange);

// ── Storage ──────────────────────────────────────────────────
// Verificar disponibilidad de Chrome antes de usar Storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  try {
    chrome.storage.local.get('userPrefs', (data: { userPrefs?: { popover?: boolean } }) => {
      prefActive = !!data.userPrefs?.popover;
      routeActive = isRouteOk(); // init
      syncListeners();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.userPrefs) {
        prefActive = !!(changes.userPrefs.newValue as { popover?: boolean })?.popover;
        syncListeners();
      }
    });
  } catch (error: any) {
    if (error?.message?.includes('Extension context invalidated')) {
      console.warn(`⚠️ [Popover] Contexto de extensión invalidado. Recarga la página para reiniciar.`);
    } else {
      console.error(`⚠️ [Popover] Error accediendo a chrome.storage:`, error);
    }
  }
} else {
  console.warn(`⚠️ [Popover] Chrome Storage API no disponible`);
}

// ── DOM helpers ──────────────────────────────────────────────
function getSlotInfo(el: HTMLElement) {
  const slot = el.closest('vex-calendario-slot');
  if (!slot) return null;
  const row = slot.parentElement;
  if (!row) return null;
  const children = Array.from(row.children);
  const hora = TIME_SLOTS[children.indexOf(slot) - 1] || '—';
  const infoDiv = children[0] as HTMLElement;
  const contrata = infoDiv?.querySelector('.uppercase.font-medium')?.textContent?.trim() || '—';
  let tecnico = '—', tipo = '';
  for (const div of infoDiv?.querySelectorAll('div') ?? []) {
    if ((div.className || '').startsWith('ng-tns') && tecnico === '—') {
      const clone = div.cloneNode(true) as HTMLElement;
      clone.querySelector('span')?.remove();
      tecnico = clone.textContent?.trim() || '—';
    }
    const txt = div.textContent?.trim() || '';
    if (div.classList.contains('text-xs') && txt.startsWith('(')) tipo = txt;
  }
  return { hora, contrata, tecnico, tipo };
}

function getCardExtras(card: HTMLElement) {
  const ciudad = card.querySelector('[ng-reflect-message*=" - "]')?.textContent?.trim() || null;
  const esAutoGestion = !!card.closest('.relative')?.querySelector('.bg-gray-900');
  return { ciudad, esAutoGestion };
}

// ── Mouse handler ────────────────────────────────────────────
const onMouseMove = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('#wow-nav') || target.closest('.wow-copy-btn') || target.closest('.font-semibold')) {
    popover.style.display = 'none'; return;
  }
  const card = target.closest('[class*="slot-"]') as HTMLElement;
  const asignar = target.closest('.bg-base.border-dashed') as HTMLElement;
  if (!card && !asignar) { popover.style.display = 'none'; return; }
  const info = getSlotInfo(card || asignar);
  if (!info) { popover.style.display = 'none'; return; }
  const { hora, tecnico, tipo } = info;
  const { ciudad, esAutoGestion } = card ? getCardExtras(card) : { ciudad: null, esAutoGestion: false };
  popover.style.background = card ? '#4a0080' : '#5a6070';
  popover.innerHTML = `
    <div style="font-weight:bold;margin-bottom:4px;">🕐 ${hora}</div>
    <div style="font-weight:600;">👷 ${tecnico}</div>
    ${tipo ? `<div style="opacity:0.75;font-size:11px;">${tipo}</div>` : ''}
    ${ciudad ? `<div style="margin-top:5px;font-size:11px;opacity:0.85;">📍 ${ciudad}</div>` : ''}
    ${esAutoGestion ? `<div style="margin-top:4px;font-size:11px;background:rgba(255,255,255,0.15);border-radius:4px;padding:2px 6px;display:inline-block;">⚙️ Autogestión</div>` : ''}
  `;
  popover.style.display = 'block';
  popover.style.left = (e.clientX + 15) + 'px';
  popover.style.top = (e.clientY - 10) + 'px';
};