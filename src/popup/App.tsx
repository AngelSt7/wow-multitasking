import { useState, useEffect } from 'react'
import '../index.css'
import { Triangle, AlignRight, MousePointerClick, PinIcon, Share2 } from 'lucide-react'
import type { SwitchId, UserPreferences } from '../interfaces'
import { useChromeStorage } from '../hooks/useGoogleStorage'
import { Switches } from '../constants/items'
import { TabGroup } from '../components/TabGroup/TabGroup'
import { useMultitasking } from '../context/MultitaskingContext'

type SpeedDialPosition = 'corner' | 'vertical'
type SpeedDialMode = 'onPress' | 'alwaysOpen'

const defaultPrefs: UserPreferences = {
  fast: false, multi: false, notif: false,
  dark: false, stats: false, popover: false,
  visor: false, autoSearchPronto: false
}

const positionOptions = [
  { value: 'corner' as SpeedDialPosition, label: 'Esquina', Icon: Triangle },
  { value: 'vertical' as SpeedDialPosition, label: 'Vertical', Icon: AlignRight },
]

const modeOptions = [
  { value: 'onPress' as SpeedDialMode, label: 'Al presionar', Icon: MousePointerClick },
  { value: 'alwaysOpen' as SpeedDialMode, label: 'Siempre abierto', Icon: PinIcon },
]

function App() {

const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "success">("idle");
  const [userName, setUserName] = useState<string>('')
  
  const { getItem, setItem } = useChromeStorage()
  const { mtPrefs, updateMultitaskingPrefs, isPrefsLoaded } = useMultitasking();

  const [active, setActive] = useState<UserPreferences>(defaultPrefs)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  useEffect(() => {
    const init = async () => {
      const saved = await getItem<UserPreferences>('userPrefs')
      if (saved) {
        setActive(saved)
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ wow_mostrar_popover: saved.popover ?? false })
        }
      }

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'GET_USER_NAME' }, (res) => {
            if (!chrome.runtime.lastError && res?.name) {
              setUserName(res.name)
            }
          })
        }
      }
      setIsLoaded(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    setItem('userPrefs', active)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ wow_mostrar_popover: active.popover })
    }
  }, [active, isLoaded])

  const toggle = (id: SwitchId) => {
    setActive(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const setPosition = (position: SpeedDialPosition) =>
    updateMultitaskingPrefs({ position })

  const setMode = (mode: SpeedDialMode) =>
    updateMultitaskingPrefs({ mode })

  const getSession = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("No se encontró la pestaña activa");
    }

    return chrome.tabs.sendMessage(tab.id, {
      type: "SHARE_SESSION",
    });
  };

  const shareSession = async () => {
    const response = await getSession();

    if (!response?.success) {
      throw new Error(
        response?.error ?? "Error compartiendo sesión"
      );
    }

    const url = new URL(
      "https://sgc.wowperu.pe/auth/login"
    );

    url.searchParams.set(
      "sessionId",
      response.code
    );

    const shareUrl = url.toString();

    await navigator.clipboard.writeText(
      shareUrl
    );

    return shareUrl;
  };

  const handleShare = async () => {
    try {
      setShareStatus("loading");

      await shareSession();

      setShareStatus("success");

      setTimeout(() => {
        setShareStatus("idle");
      }, 2000);
    } catch {
      setShareStatus("idle");
    }
  };

  if (!isLoaded || !isPrefsLoaded) return <div className="bg-[#1a1a1a] w-85 h-150" />

  return (
    <div className="flex flex-col items-center justify-center w-full bg-transparent">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-85 overflow-hidden border border-[#2a2a2a] shadow-xl">

        <div className="flex items-center gap-3 p-5 border-b border-[#2a2a2a]">
          <img
            src="https://sgc.wowperu.pe/assets/img/demo/wow-peru-logo-2024-blanco.svg"
            alt="WOW"
            className="w-12 h-12 object-contain"
          />
          <div className="flex-1">
            <h1 className="text-white font-black text-lg leading-tight">WOW Multitasking</h1>
            <p className="text-[#888] text-xs mt-0.5">Gestión avanzada de tareas</p>
          </div>
          <span className="text-[10px] font-bold text-orange-400 border border-orange-400/30 bg-orange-400/10 px-2 py-1 rounded-full">
            BETA
          </span>
        </div>

        <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-2">
          Funciones
        </p>
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          {Switches.map((sw) => {
            const Icon = sw.icon as React.ElementType
            return (
              <div
                key={sw.id}
                onClick={() => toggle(sw.id)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer border transition-all duration-200
                  ${active[sw.id]
                    ? 'bg-orange-500/10 border-orange-500/40'
                    : 'bg-[#222] border-[#2c2c2c] hover:bg-[#262626]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                    className={active[sw.id] ? 'text-orange-400' : 'text-[#555]'}
                  />
                  <div>
                    <p className="text-[#ddd] text-sm font-medium">{sw.name}</p>
                    <p className="text-[#555] text-[10.5px]">{sw.desc}</p>
                  </div>
                </div>
                <div className={`w-10 h-5.5 rounded-full transition-all relative shrink-0
                  ${active[sw.id] ? 'bg-orange-500' : 'bg-[#333]'}`}>
                  <div className={`absolute top-0.75 w-4 h-4 rounded-full transition-all duration-300
                    ${active[sw.id] ? 'left-5.25 bg-white shadow-sm' : 'left-0.75 bg-[#666]'}`} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-[#2a2a2a] mx-3" />

        <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-2">
          Botón Multitarea
        </p>
        <div className="px-3 pb-4 flex flex-col gap-3">
          <TabGroup
            label="Posición"
            options={positionOptions}
            value={mtPrefs.position}
            onChange={setPosition}
          />
          <TabGroup
            label="Modo"
            options={modeOptions}
            value={mtPrefs.mode}
            onChange={setMode}
          />
        </div>

        <div className="border-t border-[#2a2a2a] mx-3" />


        <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-2">
          Compartir sesión
        </p>
        <div className="px-3 pb-4 flex flex-col gap-2">
          <div className="bg-[#222] border border-[#2c2c2c] rounded-xl px-4 py-3 flex flex-col gap-3">

            <p className="text-[#555] text-[10.5px]">
              Sesión de <span className="text-orange-400 font-semibold">{userName}</span>
            </p>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Share2 size={15} className="text-orange-400" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[#ddd] text-sm font-medium">Compartir sesión activa</p>
                <p className="text-[#555] text-[10.5px]">Comparte tu sesión actual con otros usuarios</p>
              </div>
            </div>
            <button
              onClick={async () => await handleShare()}
              className="w-full flex items-center justify-center gap-2 rounded-[10px] py-2.5
                     border border-orange-500/40 bg-orange-500/10 text-orange-400
                     text-xs font-bold tracking-wide cursor-pointer
                     hover:bg-orange-500/20 hover:border-orange-500/60 transition-all duration-150 active:scale-[0.98]"
            >
              <Share2 size={14} strokeWidth={2} />
              {shareStatus === "loading" && "Compartiendo..."}
              {shareStatus === "success" && "✓ Copiado"}
              {shareStatus === "idle" && "Compartir sesión"}
            </button>

          </div>
        </div>


        <div className="flex justify-between items-center px-5 py-3 border-t border-[#222]">
          <span className="text-[#444] text-[11px]">
            Estado: <span className="text-green-400 font-semibold tracking-wide">● ONLINE</span>
          </span>
          <span className="text-[#333] text-[10px] font-mono tracking-tighter">v0.1.0-TS</span>
        </div>

      </div>
    </div>
  )
}

export default App