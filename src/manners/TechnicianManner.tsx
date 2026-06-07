import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, MapPin, Users, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface SlotData {
    hora: string;
    hasOrder: boolean;
    slot: Element;
}
interface Technician {
    contrata: string;
    tecnico: string;
    tipo: string;
    slots: SlotData[];
    row: Element;
}
interface Props {
    onClose: () => void;
}

const SLOTS: string[] = [
    '06:30 - 08:00',
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
];

export default function TechnicianNavigator({ onClose }: Props) {
    const [codigoInput, setCodigoInput] = useState("");
    const [codigoNotFound, setCodigoNotFound] = useState(false);
    const [tecnicoInput, setTecnicoInput] = useState("");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [technicians, setTechnicians] = useState<Technician[]>([]);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputTecnicoRef = useRef<HTMLInputElement>(null);
    const currentHighlight = useRef<Element | null>(null);

    // ── Highlight ──────────────────────────────────────────────────────────────
    const clearHighlight = useCallback(() => {
        if (currentHighlight.current) {
            currentHighlight.current.classList.remove("wow-highlight-row", "wow-highlight-card");
            currentHighlight.current = null;
        }
    }, []);

    const highlightEl = useCallback((el: Element, type: "row" | "card") => {
        clearHighlight();
        el.classList.add(type === "row" ? "wow-highlight-row" : "wow-highlight-card");
        currentHighlight.current = el;
        setTimeout(() => {
            el.classList.remove("wow-highlight-row", "wow-highlight-card");
            if (currentHighlight.current === el) currentHighlight.current = null;
        }, 3000);
    }, [clearHighlight]);

    // ── Navigation ─────────────────────────────────────────────────────────────
    const navigateTo = useCallback((slot: Element, hasOrder: boolean) => {
        const target = hasOrder
            ? slot.querySelector('[class*="slot-"]')
            : slot.querySelector(".bg-base.border-dashed");
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        setTimeout(() => highlightEl(target, "card"), 400);
    }, [highlightEl]);

    const navigateToRow = useCallback((row: Element) => {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => highlightEl(row, "row"), 400);
    }, [highlightEl]);

    // ── Read DOM ───────────────────────────────────────────────────────────────
    const getTechnicians = useCallback((): Technician[] => {
        const rows = document.querySelectorAll(".card.grid-cols-9");
        const result: Technician[] = [];
        rows.forEach((row) => {
            const infoDiv = row.children[0];
            if (!infoDiv) return;
            const contrata = infoDiv.querySelector(".uppercase.font-medium")?.textContent?.trim();
            if (!contrata) return;
            let tecnico = "—";
            let tipo = "";
            const allDivs = Array.from(infoDiv.querySelectorAll("div"));
            for (const div of allDivs) {
                if ((div.className || "").startsWith("ng-tns") && tecnico === "—") {
                    const clone = div.cloneNode(true) as Element;
                    clone.querySelector("span")?.remove();
                    tecnico = clone.textContent?.trim() ?? "—";
                }
                const cls = (div.className || "").trim();
                const txt = div.textContent?.trim() ?? "";
                if (cls === "text-xs" && txt.startsWith("(") && txt.endsWith(")")) tipo = txt;
            }
            const slots: SlotData[] = [];
            Array.from(row.children).forEach((child, i) => {
                if (i === 0) return;
                if (child.tagName !== "VEX-CALENDARIO-SLOT") return;
                const hora = SLOTS[i - 1];
                if (!hora) return;
                const hasOrder = !!child.querySelector('[class*="slot-"]');
                slots.push({ hora, hasOrder, slot: child });
            });
            result.push({ contrata, tecnico, tipo, slots, row });
        });
        return result;
    }, []);

    // ── Search by code ─────────────────────────────────────────────────────────
    const searchByCode = useCallback((codigo: string): boolean => {
        const containers = document.querySelectorAll('[data-multitasking-ready="true"]');
        for (const container of Array.from(containers)) {
            const span = container.querySelector('span');
            if (span && span.textContent?.trim() === codigo.trim()) {
                const card = span.closest('[class*="slot-"]');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    setTimeout(() => highlightEl(card, 'card'), 400);
                    return true;
                }
            }
        }
        return false;
    }, [highlightEl]);

    useEffect(() => { setTechnicians(getTechnicians()); }, [getTechnicians]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                !inputTecnicoRef.current?.contains(e.target as Node)
            ) setDropdownVisible(false);
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    const filteredTechnicians = tecnicoInput
        ? technicians.filter(t =>
            t.tecnico.toLowerCase().includes(tecnicoInput.toLowerCase()) ||
            t.contrata.toLowerCase().includes(tecnicoInput.toLowerCase())
        ) : [];

    const handleSearchCodigo = () => {
        const found = searchByCode(codigoInput);
        setCodigoNotFound(!found);
        if (found) onClose();
    };

    const handleSelectTechnician = (t: Technician) => {
        setTecnicoInput(t.tecnico);
        setDropdownVisible(false);
        navigateToRow(t.row);
        setSelectedTechnician(t);
    };

    const handleSlotClick = (slot: Element, hasOrder: boolean) => {
        navigateTo(slot, hasOrder);
        onClose();
    };

    // ── Slot button ────────────────────────────────────────────────────────────
    const SlotButton = ({ hora, hasOrder, slot }: SlotData) => (
        <button
            onClick={() => handleSlotClick(slot, hasOrder)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
            style={{
                background: hasOrder ? '#ede9fe' : '#f3f4f6',
                color: hasOrder ? '#6d28d9' : '#9ca3af',
                border: hasOrder ? '1px solid #ddd6fe' : '1px solid #e5e7eb',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = hasOrder ? '#7c3aed' : '#d1d5db';
                (e.currentTarget as HTMLButtonElement).style.color = 'white';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = hasOrder ? '#ede9fe' : '#f3f4f6';
                (e.currentTarget as HTMLButtonElement).style.color = hasOrder ? '#6d28d9' : '#9ca3af';
                (e.currentTarget as HTMLButtonElement).style.borderColor = hasOrder ? '#ddd6fe' : '#e5e7eb';
            }}
        >
            {hora}
        </button>
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            className="flex flex-col overflow-hidden font-sans bg-white rounded-2xl"
            style={{
                boxShadow: 'rgba(74, 0, 128, 0.25) 0px 24px 48px, rgba(0, 0, 0, 0.15) 0px 4px 12px',
                maxHeight: 'min(640px,calc(100vh-160px))',
            }}
        >
            <div
                className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                style={{ background: '#1a1a1a' }}
            >
                <div className="flex items-center gap-3">
                    <img
                        src="https://sgc.wowperu.pe/assets/img/demo/wow-peru-logo-2024-blanco.svg"
                        alt="WOW"
                        className="w-10 h-10 object-contain"
                    />
                    <div>
                        <h2 className="font-bold text-sm text-white tracking-tight leading-none">
                            Navegador de Técnicos
                        </h2>
                        <p className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>WOW Multitasking</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                    <X size={14} color="white" strokeWidth={2.5} />
                </button>
            </div>

            {/* ── Input area — igual que HeadbandManner ── */}
            <div className="px-4 py-4 flex-shrink-0 space-y-4" style={{ borderBottom: '1px solid #f0e6ff', background: '#fdf8ff' }}>

                {/* Buscar por código */}
                <div>
                    <p className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: '#7c3aed' }}>
                        Buscar por código de orden
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ej: 20260356945"
                            value={codigoInput}
                            onChange={e => { setCodigoInput(e.target.value); setCodigoNotFound(false); }}
                            onKeyDown={e => e.key === "Enter" && handleSearchCodigo()}
                            className="flex-1 rounded-xl px-3 py-2 text-xs outline-none transition-all"
                            style={{ border: '1.5px solid #ddd6fe', background: 'white', color: '#1a1f2e' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#ddd6fe'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <button
                            onClick={handleSearchCodigo}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #4a0080, #6d28d9)', boxShadow: '0 2px 8px rgba(74,0,128,0.35)' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            <Search size={12} />
                            Ir
                        </button>
                    </div>
                    {codigoNotFound && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                            <AlertCircle size={12} />
                            Código no encontrado
                        </div>
                    )}
                </div>

                {/* Buscar por técnico */}
                <div>
                    <p className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: '#7c3aed' }}>
                        Buscar por técnico
                    </p>
                    <div className="flex gap-2">
                        <input
                            ref={inputTecnicoRef}
                            type="text"
                            placeholder="Escribe nombre o contrata..."
                            value={tecnicoInput}
                            onChange={e => {
                                setTecnicoInput(e.target.value);
                                setDropdownVisible(true);
                                setSelectedTechnician(null);
                            }}
                            className="flex-1 rounded-xl px-3 py-2 text-xs outline-none transition-all"
                            style={{ border: '1.5px solid #ddd6fe', background: 'white', color: '#1a1f2e' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; if (tecnicoInput) setDropdownVisible(true); }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#ddd6fe'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <button
                            onClick={() => setShowAll(v => !v)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                                background: showAll ? '#ede9fe' : '#f3f0ff',
                                color: '#6d28d9',
                                border: '1.5px solid #ddd6fe',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Users size={11} />
                            {showAll ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {showAll ? "Ocultar" : "Ver todos"}
                        </button>
                    </div>

                    {/* Dropdown */}
                    {dropdownVisible && tecnicoInput && (
                        <div
                            ref={dropdownRef}
                            className="mt-2 rounded-xl overflow-hidden"
                            style={{ border: '1.5px solid #ede9fe', maxHeight: 200, overflowY: 'auto', background: 'white', boxShadow: '0 4px 12px rgba(74,0,128,0.08)' }}
                        >
                            {filteredTechnicians.length === 0 ? (
                                <div className="px-3 py-3 text-xs" style={{ color: '#9ca3af' }}>
                                    Sin resultados
                                </div>
                            ) : filteredTechnicians.map((t, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelectTechnician(t)}
                                    className="px-3 py-2.5 cursor-pointer transition-colors"
                                    style={{ borderBottom: '1px solid #f5f0ff' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                >
                                    <div className="text-xs font-semibold" style={{ color: '#1f2937' }}>{t.tecnico}</div>
                                    <div className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>
                                        {t.contrata} {t.tipo}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Results body ── */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3" style={{ background: '#faf7ff', maxHeight: 340 }}>

                {/* Card técnico seleccionado */}
                {selectedTechnician && (
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{ border: '1.5px solid #ede9fe', boxShadow: '0 1px 4px rgba(74,0,128,0.06)' }}
                    >
                        <div className="px-3 py-2.5 flex items-center gap-2.5" style={{ background: '#222222' }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#6d28d9' }}>
                                <MapPin size={13} color="white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-white truncate">{selectedTechnician.tecnico}</div>
                                <div className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>
                                    {selectedTechnician.contrata} {selectedTechnician.tipo}
                                </div>
                            </div>
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                                style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}
                            >
                                {selectedTechnician.slots.filter(s => s.hasOrder).length} órdenes
                            </span>
                        </div>
                        <div className="px-3 py-2.5 flex flex-wrap gap-1.5" style={{ background: '#f5f3ff' }}>
                            {selectedTechnician.slots.map((s, i) => (
                                <SlotButton key={i} {...s} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Estado vacío */}
                {!selectedTechnician && !showAll && (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#f3f0ff' }}>
                            <Search size={22} style={{ color: '#c4b5fd' }} />
                        </div>
                        <p className="text-xs" style={{ color: '#a78bfa' }}>Busca un técnico o código de orden</p>
                        <p className="text-[10px] mt-1" style={{ color: '#c4b5fd' }}>Enter para buscar rápido</p>
                    </div>
                )}

                {/* Lista completa */}
                {showAll && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>
                            Todos los técnicos ({technicians.length})
                        </p>
                        {technicians.map((t, i) => (
                            <div
                                key={i}
                                className="rounded-xl overflow-hidden"
                                style={{ border: '1.5px solid #ede9fe', boxShadow: '0 1px 4px rgba(74,0,128,0.04)' }}
                            >
                                <div
                                    className="px-3 py-2 cursor-pointer transition-colors"
                                    style={{ background: 'white' }}
                                    onClick={() => handleSelectTechnician(t)}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                >
                                    <div className="text-xs font-semibold" style={{ color: '#1f2937' }}>{t.tecnico}</div>
                                    <div className="text-[10px] mt-0.5" style={{ color: '#a78bfa' }}>
                                        {t.contrata} {t.tipo}
                                    </div>
                                </div>
                                <div
                                    className="px-3 py-2 flex flex-wrap gap-1.5"
                                    style={{ background: '#faf7ff', borderTop: '1px solid #f0e6ff' }}
                                >
                                    {t.slots.map((s, j) => (
                                        <SlotButton key={j} {...s} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}