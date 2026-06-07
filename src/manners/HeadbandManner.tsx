import { X, Search, Trash2, ClipboardCopy, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";

interface Props {
  onClose: () => void;
}
interface CintilloResult {
  cintillo: string;
  data?: CintilloItem[];
  error?: string;
}
interface CintilloItem {
  client_service_group_code?: string;
  client_service_group_cintillo_cintillo?: string;
  config_description?: string;
  fecha_susp_baja?: string;
  client_service_group_nodo_nodo?: string;
  client_service_group_nodo_nap?: string;
  client_service_group_nodo_port?: string;
  _cintillo_buscado?: string;
}

function isOlderThan3Months(dateStr?: string) {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) >= 1000 * 60 * 60 * 24 * 90;
}

function getStatusStyle(estado?: string, fechaSuspBaja?: string) {
  if (!estado) return { bg: 'bg-zinc-100', text: 'text-zinc-600', label: '—' };
  const e = estado.toLowerCase();
  if (e === 'inactivo') return { bg: 'bg-green-100', text: 'text-green-800', label: 'Inactivo' };
  if (e === 'activo') return { bg: 'bg-red-100', text: 'text-red-800', label: 'Activo' };
  if (e === 'suspendido') {
    if (isOlderThan3Months(fechaSuspBaja))
      return { bg: 'bg-green-100', text: 'text-green-800', label: 'Susp. +3m' };
    return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspendido' };
  }
  return { bg: 'bg-zinc-100', text: 'text-zinc-600', label: estado };
}

async function fetchCintillo(token: string, cintillo: string): Promise<CintilloResult> {
  try {
    const resp = await fetch(
      `https://api.wowperu.pe/api/v1/visitas-tecnicas/instaladores/cintillo?buscar=${encodeURIComponent(cintillo)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!resp.ok) return { cintillo, error: `HTTP ${resp.status}` };
    const json = await resp.json();
    return { cintillo, data: json?.aData?.data || [] };
  } catch (err: any) {
    return { cintillo, error: err.message };
  }
}

function GreenSpinner({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="7" fill="none" stroke="#d1fae5" strokeWidth="2.5" />
        <circle
          cx="9" cy="9" r="7"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="44"
          strokeDashoffset="11"
          style={{
            transformOrigin: '9px 9px',
            animation: 'spin 0.75s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
      <span className="text-[11px] font-semibold" style={{ color: '#16a34a' }}>
        {done} de {total} completados…
      </span>
    </div>
  );
}

function CopyRow({ rowText, className, children }: { rowText: string; className?: string; children: React.ReactNode }) {
  const [flash, setFlash] = useState(false);

  const handleDoubleClick = () => {
    navigator.clipboard.writeText(rowText).then(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    });
  };

  return (
    <tr
      onDoubleClick={handleDoubleClick}
      title="Doble clic para copiar fila"
      className={className}
      style={{
        cursor: 'copy',
        outline: flash ? '2px solid #16a34a' : undefined,
        outlineOffset: '-1px',
        transition: 'outline 0.15s',
        background: flash ? 'rgba(22,163,74,0.15)' : undefined,
        userSelect: 'none',
      }}
    >
      {flash
        ? <td colSpan={6} style={{ padding: '6px 8px', color: '#15803d', fontWeight: 700, fontSize: 11, borderBottom: '1px solid #f5f0ff' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={12} style={{ color: '#16a34a' }} /> Fila copiada al portapapeles
          </span>
        </td>
        : children
      }
    </tr>
  );
}

function CopyGreenNodeBtn({ items, node }: { items: (CintilloItem & { _cintillo_buscado: string })[]; node: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const lines = items.map(item => {
      const { label } = getStatusStyle(item.config_description, item.fecha_susp_baja);
      return [
        item.client_service_group_code || '',
        item.client_service_group_cintillo_cintillo || item._cintillo_buscado || '',
        label,
        item.fecha_susp_baja || '',
        node,
        item.client_service_group_nodo_nap || '',
        item.client_service_group_nodo_port || '',
      ].join('\t');
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copiar ${items.length} disponible${items.length !== 1 ? 's' : ''}`}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
      style={{
        background: copied ? '#15803d' : '#dcfce7',
        color: copied ? 'white' : '#15803d',
        border: '1px solid #86efac',
      }}
    >
      {copied ? <CheckCircle2 size={11} /> : <ClipboardCopy size={11} />}
      {copied ? '¡Copiado!' : `${items.length} disponible${items.length !== 1 ? 's' : ''}`}
    </button>
  );
}

export default function HeadbandManner({ onClose }: Props) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<CintilloResult[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const globalResults = useRef<CintilloResult[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;

    if (rawValue.includes('[') && rawValue.includes(']')) {
      const regex = /:\s(\d+)/g;
      const matches = Array.from(rawValue.matchAll(regex)).map(m => m[1]);

      if (matches.length > 0) {
        setInput(matches.join('\n'));
        return;
      }
    }

    setInput(rawValue);
  };

  const searchAll = async () => {
    const cintillos = [...new Set(input.split('\n').map(s => s.trim()).filter(Boolean))];
    if (!cintillos.length) return;
    const token = localStorage.getItem('token');
    if (!token) { alert('No se encontró el token. Asegúrate de estar logueado.'); return; }

    setLoading(true);
    setDone(0);
    setTotal(cintillos.length);
    setResults([]);
    setStatus('');

    const BATCH = 5;
    const allResults: CintilloResult[] = [];
    let doneCount = 0;

    for (let i = 0; i < cintillos.length; i += BATCH) {
      const batch = cintillos.slice(i, i + BATCH);
      const res = await Promise.all(batch.map(c => fetchCintillo(token, c).then(r => {
        doneCount++;
        setDone(doneCount);
        return r;
      })));
      allResults.push(...res);
    }

    // Al final de searchAll, reemplaza setStatus('done') y setLoading(false) por:
    globalResults.current = allResults;
    setResults(allResults);
    setStatus('done');
    setLoading(false);

    const notify = () => {
      const verdes = allResults.reduce((acc, { data }) => {
        return acc + (data?.filter(item => {
          const { label } = getStatusStyle(item.config_description, item.fecha_susp_baja);
          return label === 'Inactivo' || label === 'Susp. +3m';
        }).length || 0);
      }, 0);
      new Notification('✅ Búsqueda completada — WOW Multitasking', {
        body: `${allResults.length} cintillos procesados · ${verdes} disponibles, revisa la pestaña!`,
        icon: 'https://sgc.wowperu.pe/assets/img/demo/wow-peru-logo-2024-blanco.svg',
      });
    };

    if (Notification.permission === 'granted') {
      notify();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => { if (p === 'granted') notify(); });
    }
  };

  const copyAll = () => {
    const lines = ['Cód.Servicio\tCintillo\tEstado\tF.Susp/Baja\tNodo\tNAP\tPuerto'];
    globalResults.current.forEach(({ data }) => {
      data?.forEach(item => {
        lines.push([
          item.client_service_group_code || '',
          item.client_service_group_cintillo_cintillo || '',
          item.config_description || '',
          item.fecha_susp_baja || '',
          item.client_service_group_nodo_nodo || '',
          item.client_service_group_nodo_nap || '',
          item.client_service_group_nodo_port || '',
        ].join('\t'));
      });
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const limpiar = () => {
    setInput('');
    setResults([]);
    setDone(0);
    setTotal(0);
    setStatus('');
    globalResults.current = [];
  };

  const byNode: Record<string, (CintilloItem & { _cintillo_buscado: string })[]> = {};
  const noResults: { cintillo: string; error?: string }[] = [];

  results.forEach(({ cintillo, data, error }) => {
    if (error || !data?.length) { noResults.push({ cintillo, error }); return; }
    data.forEach(item => {
      const node = item.client_service_group_nodo_nodo || 'SIN NODO';
      if (!byNode[node]) byNode[node] = [];
      byNode[node].push({ ...item, _cintillo_buscado: cintillo });
    });
  });

  const totalProcessed = results.length;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden flex flex-col font-sans"
      style={{
        boxShadow: '0 24px 48px rgba(74,0,128,0.25), 0 4px 12px rgba(0,0,0,0.15)',
        maxHeight: 'min(640px,calc(100vh-160px))',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center gap-5">
          <img
            src="https://sgc.wowperu.pe/assets/img/demo/wow-peru-logo-2024-blanco.svg"
            alt="WOW"
            className="w-12 h-12 object-contain"
          />
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight leading-none">Buscador Masivo de Cintillos</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>WOW Multitasking</p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}>
          <X size={14} color="white" strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #f0e6ff', background: '#fdf8ff' }}>
        <p className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: '#7c3aed' }}>
          Pega los cintillos — uno por línea
        </p>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => handleInputChange(e)}
            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') searchAll(); }}
            placeholder={"00168014\n260813\n138787"}
            className="flex-1 h-20 rounded-xl px-3 py-2 text-xs font-mono resize-none outline-none transition-all"
            style={{ border: '1.5px solid #ddd6fe', background: 'white', color: '#1a1f2e' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#ddd6fe'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={searchAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #e05c00, #c44f00)', boxShadow: '0 2px 8px rgba(224,92,0,0.35)' }}
            >
              <Search size={13} />
              {loading ? 'Buscando...' : 'Buscar todos'}
            </button>
            <button
              onClick={limpiar}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: '#f3f0ff', color: '#7c3aed', border: '1.5px solid #ddd6fe' }}
            >
              <Trash2 size={13} />
              Limpiar
            </button>
            {results.length > 0 && (
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: copied ? '#16a34a' : 'linear-gradient(135deg, #4a0080, #6d28d9)', boxShadow: '0 2px 8px rgba(74,0,128,0.3)' }}
              >
                {copied ? <CheckCircle2 size={13} /> : <ClipboardCopy size={13} />}
                {copied ? 'Copiado!' : 'Copiar tabla'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-2.5 min-h-[22px]">
          {loading && (
            <>
              <div className="rounded-full h-1.5 mb-2 overflow-hidden" style={{ background: '#ede9fe' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${total ? Math.round((done / total) * 100) : 0}%`, background: 'linear-gradient(90deg, #7c3aed, #e05c00)' }}
                />
              </div>
              <GreenSpinner done={done} total={total} />
            </>
          )}

          {!loading && status === 'done' && totalProcessed > 0 && (
            <div className="flex justify-center mt-1">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}
              >
                <CheckCircle2 size={13} strokeWidth={2.5} />
                {totalProcessed} cintillo{totalProcessed !== 1 ? 's' : ''} procesado{totalProcessed !== 1 ? 's' : ''}
              </div>
            </div>
          )}

        </div>
      </div>

      <div
        className="overflow-y-auto px-4 py-3 space-y-3"
        style={{ background: '#faf7ff', maxHeight: 340 }}
      >
        {results.length === 0 && !loading && (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#f3f0ff' }}>
              <Search size={22} style={{ color: '#c4b5fd' }} />
            </div>
            <p className="text-xs" style={{ color: '#a78bfa' }}>Ingresa los cintillos y presiona "Buscar todos"</p>
            <p className="text-[10px] mt-1" style={{ color: '#c4b5fd' }}>Ctrl + Enter para buscar rápido</p>
          </div>
        )}

        {Object.keys(byNode).sort().map(node => {
          const verdesEnNodo = byNode[node].filter(item => {
            const { label } = getStatusStyle(item.config_description, item.fecha_susp_baja);
            return label === 'Inactivo' || label === 'Susp. +3m';
          });

          return (
            <div key={node} className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #ede9fe', boxShadow: '0 1px 4px rgba(74,0,128,0.06)' }}>
              <div className="px-3 py-2 flex justify-between items-center" style={{ background: '#222222' }}>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#e05c00' }}>
                    <Zap size={14} color="white" fill="white" />
                  </div>
                  {node}
                </span>
                <div className="flex items-center gap-2">
                  {verdesEnNodo.length > 0 && (
                    <CopyGreenNodeBtn items={verdesEnNodo} node={node} />
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                    {byNode[node].length} reg.
                  </span>
                </div>
              </div>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr style={{ background: '#f5f0ff' }}>
                    {['Cód. Servicio', 'Cintillo', 'Estado', 'F. Susp/Baja', 'NAP', 'Puerto'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold" style={{ color: '#6d28d9', borderBottom: '1px solid #ede9fe' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byNode[node].map((item, i) => {
                    const { bg, text, label } = getStatusStyle(item.config_description, item.fecha_susp_baja);
                    const bStyle = { borderBottom: '1px solid #f5f0ff' };
                    return (
                      <CopyRow
                        key={i}
                        rowText={[
                          item.client_service_group_code || '',
                          item.client_service_group_cintillo_cintillo || item._cintillo_buscado || '',
                          label,
                          item.fecha_susp_baja || '',
                          item.client_service_group_nodo_nap || '',
                          item.client_service_group_nodo_port || '',
                        ].join('\t')}
                        className={`${bg} ${i % 2 === 1 ? 'opacity-90' : ''}`}
                      >
                        <td className={`px-2 py-1.5 font-semibold ${text}`} style={bStyle}>{item.client_service_group_code || '—'}</td>
                        <td className={`px-2 py-1.5 ${text}`} style={bStyle}>{item.client_service_group_cintillo_cintillo || item._cintillo_buscado}</td>
                        <td className={`px-2 py-1.5 font-bold ${text}`} style={bStyle}>{label}</td>
                        <td className={`px-2 py-1.5 ${text}`} style={bStyle}>{item.fecha_susp_baja || '—'}</td>
                        <td className={`px-2 py-1.5 text-center ${text}`} style={bStyle}>{item.client_service_group_nodo_nap || '—'}</td>
                        <td className={`px-2 py-1.5 text-center ${text}`} style={bStyle}>{item.client_service_group_nodo_port || '—'}</td>
                      </CopyRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
        {noResults.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #fecaca' }}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ background: '#1a1f2e' }}>
              <AlertCircle size={13} color="#f87171" />
              <span className="text-xs font-bold text-white">Sin resultados ({noResults.length})</span>
            </div>
            <div className="px-3 py-2 space-y-0.5" style={{ background: '#fff5f5' }}>
              {noResults.map(({ cintillo, error }) => (
                <p key={cintillo} className="text-[11px] text-red-700">
                  • {cintillo}{error ? ` — ${error}` : ' — sin registros'}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}