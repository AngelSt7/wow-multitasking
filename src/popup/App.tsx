import { useState, useEffect } from 'react'
import '../index.css'
import {
  Zap, Search,
  Triangle, AlignRight,
  MousePointerClick, PinIcon,
  Share2,
  LogIn,
} from 'lucide-react'
import type { SwitchId, SwitchItem, UserPreferences } from '../interfaces'
import { useChromeStorage } from '../hooks/useGoogleStorage'
import { Button } from '@heroui/react'

type SpeedDialPosition = 'corner' | 'vertical'
type SpeedDialMode = 'onPress' | 'alwaysOpen'

interface MultitaskingPrefs {
  position: SpeedDialPosition
  mode: SpeedDialMode
}

const MULTITASKING_KEY = 'multitasking'
const defaultMultitasking: MultitaskingPrefs = { position: 'corner', mode: 'onPress' }

function loadMultitaskingFromChrome(): Promise<MultitaskingPrefs> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn(`⚠️ [Popup] Chrome Storage API no disponible`);
      resolve(defaultMultitasking);
      return;
    }

    try {
      chrome.storage.local.get(MULTITASKING_KEY, (result) => {
        const raw = result[MULTITASKING_KEY] as Partial<MultitaskingPrefs> | undefined
        if (!raw) { resolve(defaultMultitasking); return }
        resolve({
          position: raw.position === 'vertical' ? 'vertical' : 'corner',
          mode: raw.mode === 'alwaysOpen' ? 'alwaysOpen' : 'onPress',
        })
      })
    } catch (error: any) {
      if (error?.message?.includes('Extension context invalidated')) {
        console.warn(`⚠️ [Popup] Contexto de extensión invalidado.`);
      } else {
        console.error(`❌ [Popup] Error cargando multitasking prefs:`, error);
      }
      resolve(defaultMultitasking);
    }
  })
}

function saveMultitaskingToChrome(prefs: MultitaskingPrefs): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn(`⚠️ [Popup] Chrome Storage API no disponible`);
      resolve();
      return;
    }

    try {
      chrome.storage.local.set({ [MULTITASKING_KEY]: prefs }, resolve)
    } catch (error: any) {
      if (error?.message?.includes('Extension context invalidated')) {
        console.warn(`⚠️ [Popup] Contexto de extensión invalidado al guardar.`);
      } else {
        console.error(`❌ [Popup] Error guardando multitasking prefs:`, error);
      }
      resolve();
    }
  })
}

const switches: SwitchItem[] = [
  { id: 'fast', icon: Zap, name: 'Fijar fecha', desc: 'Fijar fechas en ventana' },
  // { id: 'dark', icon: Moon, name: 'Detalle Boleta', desc: 'Ventana de detalles' },
  // { id: 'stats', icon: BarChart2, name: 'Mapa SGC', desc: 'Mini mapa SGC' },
  { id: 'popover', icon: Search, name: 'Vista rápida', desc: 'Popover con info de slots' },
]

const defaultPrefs: UserPreferences = {
  fast: false, multi: false, notif: false,
  dark: false, stats: false, popover: false,
}

const positionOptions = [
  { value: 'corner' as SpeedDialPosition, label: 'Esquina', Icon: Triangle },
  { value: 'vertical' as SpeedDialPosition, label: 'Vertical', Icon: AlignRight },
]

const modeOptions = [
  { value: 'onPress' as SpeedDialMode, label: 'Al presionar', Icon: MousePointerClick },
  { value: 'alwaysOpen' as SpeedDialMode, label: 'Siempre abierto', Icon: PinIcon },
]

type MODE = "BETA" | "OFFICIAL"

function TabGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; Icon: React.ElementType }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest px-1">{label}</p>
      <div className="flex gap-1.5">
        {options.map(({ value: val, label: lbl, Icon }) => {
          const isActive = value === val
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5
                          border transition-all duration-200 cursor-pointer
                          ${isActive
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                  : 'bg-[#222] border-[#2c2c2c] text-[#555] hover:bg-[#262626] hover:text-[#888]'
                }`}
            >
              <Icon size={13} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[11.5px] font-semibold">{lbl}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function App() {

  const mode: MODE = "OFFICIAL"

  const { getItem, setItem } = useChromeStorage()

  const [active, setActive] = useState<UserPreferences>(defaultPrefs)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [mtPrefs, setMtPrefs] = useState<MultitaskingPrefs>(defaultMultitasking)

  const [userName, setUserName] = useState<string>('')
  const [shareState, setShareState] = useState<'idle' | 'waiting' | 'paired'>('idle')
  const [shareToken, setShareToken] = useState<string>('')
  const [joinedUser, setJoinedUser] = useState<string>('')

  const [joinToken, setJoinToken] = useState<string>('')
  const [joinError, setJoinError] = useState<string>('')


  const handleJoin = async () => {
    setJoinError('')
    if (!joinToken || joinToken.length < 4) {
      setJoinError('Ingresa un token válido')
      return
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return
    try {
      const response = await fetch(`http://localhost:3000/shared-session/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: userName, token: joinToken }),
      })
      const json = await response.json()
      if (!response.ok) { setJoinError(json.message || 'Token inválido'); return }
      chrome.tabs.sendMessage(tab.id, { type: 'APPLY_SESSION_DATA', data: json.data.session.sessionData })
      setJoinToken('')
    } catch {
      setJoinError('No se pudo conectar al servidor')
    }
  }

  useEffect(() => {
    const init = async () => {
      const [saved, mt] = await Promise.all([
        getItem<UserPreferences>('userPrefs'),
        loadMultitaskingFromChrome(),
      ])
      if (saved) {
        setActive(saved)
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ wow_mostrar_popover: saved.popover ?? false })
        }
      }
      setMtPrefs(mt)

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_USER_NAME' }, (res) => {
          console.log("name", res.name, res)
          if (!chrome.runtime.lastError && res?.name) {
            setUserName(res.name)
          }
        })
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

  useEffect(() => {
    if (isLoaded) saveMultitaskingToChrome(mtPrefs)
  }, [mtPrefs, isLoaded])

  const handleShare = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    console.log(`[Popup] Solicitando datos de sesión al content script...`)

    chrome.tabs.sendMessage(tab.id, { type: 'GET_SESSION_DATA' }, async (res) => {
      if (chrome.runtime.lastError || !res?.data) return

      const response = await fetch('http://localhost:3000/shared-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: userName,
          sessionData: res.data,
          participants: [],
        }),
      })

      const json = await response.json()
      const token: string = json.data.token

      setShareToken(token)
      setShareState('waiting')

      const ws = new WebSocket('wss://http://localhost:3000')  

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.event === 'participant_joined') {
          setJoinedUser(msg.participantName)
          setShareState('paired')
          ws.close()
        }
      }
    })
  }


  const toggle = (id: SwitchId) =>
    setActive(prev => ({ ...prev, [id]: !prev[id] }))

  const setPosition = (position: SpeedDialPosition) =>
    setMtPrefs(prev => ({ ...prev, position }))

  const setMode = (mode: SpeedDialMode) =>
    setMtPrefs(prev => ({ ...prev, mode }))

  if (!isLoaded) return <div className="bg-[#1a1a1a] w-85 h-150" />

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
          {switches.map((sw) => {
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
                <div className={`w-10 h-5.5 rounded-full transition-all relative flex-shrink-0
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

        {mode !== "OFFICIAL" && (
          <>
            <div className="border-t border-[#2a2a2a] mx-3" />


            <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-2">
              Compartir sesión
            </p>
            <div className="px-3 pb-4 flex flex-col gap-2">
              <div className="bg-[#222] border border-[#2c2c2c] rounded-xl px-4 py-3 flex flex-col gap-3">

                {userName && (
                  <p className="text-[#555] text-[10.5px]">
                    Sesión de <span className="text-orange-400 font-semibold">{userName}</span>
                  </p>
                )}

                {shareState === 'idle' && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Share2 size={15} className="text-orange-400" strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="text-[#ddd] text-sm font-medium">Compartir sesión activa</p>
                        <p className="text-[#555] text-[10.5px]">Genera un token para que otro usuario se una</p>
                      </div>
                    </div>
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 rounded-[10px] py-2.5
                     border border-orange-500/40 bg-orange-500/10 text-orange-400
                     text-xs font-bold tracking-wide cursor-pointer
                     hover:bg-orange-500/20 hover:border-orange-500/60 transition-all duration-150 active:scale-[0.98]"
                    >
                      <Share2 size={14} strokeWidth={2} />
                      Compartir sesión
                    </button>
                  </>
                )}

                {shareState === 'waiting' && (
                  <div className="flex flex-col items-center gap-3 py-1">
                    <p className="text-[#888] text-[10.5px]">Comparte este token</p>
                    <div className="bg-[#1a1a1a] border border-orange-500/30 rounded-xl px-6 py-3">
                      <span className="text-orange-400 font-mono font-black text-2xl tracking-[0.2em]">
                        {shareToken}
                      </span>
                    </div>
                    <p className="text-[#555] text-[10px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
                      Esperando que alguien se una...
                    </p>
                    <button
                      onClick={() => setShareState('idle')}
                      className="text-[#444] text-[10px] hover:text-[#666] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {shareState === 'paired' && (
                  <div className="flex flex-col items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <span className="text-green-400 text-lg">✓</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[#ddd] text-sm font-semibold">¡Emparejado!</p>
                      <p className="text-[#555] text-[10.5px] mt-0.5">
                        <span className="text-green-400 font-medium">{joinedUser}</span> se unió a tu sesión
                      </p>
                    </div>
                    <button
                      onClick={() => { setShareState('idle'); setShareToken(''); setJoinedUser('') }}
                      className="text-[#444] text-[10px] hover:text-[#666] transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                )}

              </div>
            </div>


            {/* ─── Unirse a sesión ─────────────────────────────────── */}
            <div className="border-t border-[#2a2a2a] mx-3" />
            <p className="text-[#555] text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-2">
              Unirse a sesión
            </p>
            <div className="px-3 pb-4 flex flex-col gap-2">
              <div className="bg-[#222] border border-[#2c2c2c] rounded-xl px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <LogIn size={15} className="text-orange-400" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[#ddd] text-sm font-medium">Unirme a una sesión</p>
                    <p className="text-[#555] text-[10.5px]">Ingresa el token que te compartieron</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={8}
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="ABC123"
                    className="flex-1 bg-[#1a1a1a] border border-[#2c2c2c] rounded-lg px-3 py-2
                   text-orange-400 font-mono font-black text-lg tracking-[0.2em] text-center
                   outline-none focus:border-orange-500/50 transition-colors placeholder:text-[#333]
                   placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:font-normal"
                  />
                  <button
                    onClick={handleJoin}
                    className="flex items-center gap-1.5 rounded-[10px] px-3 py-2.5
                   border border-orange-500/40 bg-orange-500/10 text-orange-400
                   text-xs font-bold tracking-wide cursor-pointer whitespace-nowrap
                   hover:bg-orange-500/20 hover:border-orange-500/60 transition-all duration-150 active:scale-[0.98]"
                  >
                    <LogIn size={13} strokeWidth={2} />
                    Unirme
                  </button>
                </div>
                {joinError && (
                  <p className="text-red-400 text-[10px] text-center">{joinError}</p>
                )}
              </div>
            </div>
          </>
        )}

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