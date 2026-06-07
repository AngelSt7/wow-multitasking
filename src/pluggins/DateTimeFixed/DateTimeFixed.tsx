import { useState, useEffect, useCallback } from 'react';
import { useChromeStorage } from '../../hooks/useGoogleStorage';
import type { UserPreferences } from '../../interfaces';
import '../../App.css';

export const DateTimeFixed = () => {
  const [info, setInfo] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const { getItem } = useChromeStorage();

  const getTextoSelect = useCallback((formcontrolname: string) => {
    const sel = document.querySelector(`mat-select[formcontrolname="${formcontrolname}"]`);
    if (!sel) return null;

    const txt = sel.querySelector('.mat-select-value-text span')?.textContent?.trim();
    return txt && txt !== 'TODOS' ? txt : null;
  }, []);

  const actualizarDatos = useCallback(() => {
    const input = document.querySelector('input[formcontrolname="fecha"]') as HTMLInputElement;

    if (!input?.value) {
      setInfo(prev => prev !== "Seleccione una fecha" ? "Seleccione una fecha" : prev);
      return;
    }

    try {
      const [mes, dia, anio] = input.value.split('/');
      const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));

      const fechaStr = fecha.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      const departamento = getTextoSelect('departament_code');
      const provincia = getTextoSelect('district_code');

      let partes = [`📅 ${fechaStr}`];
      if (departamento) partes.push(`📍 ${departamento}`);
      if (provincia) partes.push(`${provincia}`);

      const nuevaInfo = partes.join(' | ');

      setInfo(prev => prev !== nuevaInfo ? nuevaInfo : prev);
    } catch (e) {
      console.error("Error procesando fecha:", e);
    }
  }, [getTextoSelect]);

  useEffect(() => {
    const checkStatus = async () => {
      const prefs = await getItem<UserPreferences>('userPrefs');
      const shouldShow = !!prefs?.fast;
      setIsVisible(prev => prev !== shouldShow ? shouldShow : prev);
    };

    checkStatus();

    const storageListener = (changes: any, area: string) => {
      if (area === 'local' && changes.userPrefs) {
        const newPrefs = changes.userPrefs.newValue as UserPreferences;
        const shouldShow = !!newPrefs?.fast;
        setIsVisible(prev => prev !== shouldShow ? shouldShow : prev);
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    const timer = window.setInterval(() => {
      actualizarDatos();
    }, 500);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      window.clearInterval(timer);
    };
  }, [actualizarDatos, getItem]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-4 left-4 z-[99999] pointer-events-none flex items-center gap-1 bg-[#6200ee] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold shadow-2xl border-l-4 border-[#ff6d00] capitalize font-sans transition-all duration-300"
      style={{ minWidth: '200px' }}
    >
      {info}
    </div>
  );
};