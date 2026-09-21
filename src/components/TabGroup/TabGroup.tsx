export function TabGroup<T extends string>({
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
