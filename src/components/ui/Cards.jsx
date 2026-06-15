import { useState } from "react";
export function KpiCard({ title, value, subtitle, icon, tone = "dark" }) {
  const tones = {
    dark: "from-slate-950 to-slate-800 text-white",
    blue: "from-blue-700 to-blue-500 text-white",
    green: "from-emerald-700 to-emerald-500 text-white",
    orange: "from-orange-600 to-amber-500 text-white",
  };

  return (
    <div className={`min-w-0 max-w-full rounded-[1.35rem] bg-gradient-to-br ${tones[tone] || tones.dark} p-4 shadow-lg shadow-slate-200 sm:rounded-[1.6rem] sm:p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 sm:text-sm sm:normal-case sm:tracking-normal">{title}</p>
          <p className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">{value}</p>
          <p className="mt-1 text-xs opacity-75">{subtitle}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/15 p-3">{icon}</div>
      </div>
    </div>
  );
}

export function MetricCard({ title, value, rawValue, subtitle, icon, color, editable, onValueChange }) {
  const colors = {
    yellow: "bg-[#ffcc13] text-[#7a4100]",
    purple: "bg-[#b979f2] text-white",
    brown: "bg-[#812d14] text-white",
    red: "bg-[#e32227] text-white",
    blue: "bg-[#2563eb] text-white",
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(rawValue ?? value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setEditValue(rawValue ?? value);
  }

  const handleEdit = () => {
    if (editable) setIsEditing(true);
  };
  const handleBlur = () => {
    setIsEditing(false);
    if (onValueChange) onValueChange(editValue);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (onValueChange) onValueChange(editValue);
    } else if (e.key === "Escape") {
      setEditValue(rawValue ?? value);
      setIsEditing(false);
    }
  };

  return (
    <div className={`relative min-h-[170px] min-w-0 max-w-full overflow-hidden rounded-[1.35rem] ${colors[color] || colors.red} p-5 shadow-lg shadow-slate-200 sm:rounded-[1.6rem] sm:p-6`}>
      <div className="absolute right-4 top-4 rounded-xl bg-white/15 p-3 sm:right-5 sm:top-5">{icon}</div>
      <p className="max-w-[78%] text-[0.68rem] font-black uppercase tracking-[0.2em] opacity-80 sm:text-xs sm:tracking-[0.24em]">{title}</p>
      <div className="mt-10 flex justify-center">
        {editable && isEditing ? (
          <input
            type="number"
            className="text-center text-3xl font-black tracking-tight sm:text-4xl md:text-5xl rounded bg-white/80 text-black px-2 py-1 outline-none"
            value={editValue}
            autoFocus
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ width: "90px" }}
          />
        ) : (
          <p
            className="break-words text-center text-3xl font-black tracking-tight sm:text-4xl md:text-5xl cursor-pointer select-none"
            onClick={handleEdit}
            title={editable ? "Haz clic para editar" : undefined}
          >
            {value}
          </p>
        )}
      </div>
      <div className="my-3 border-t border-dashed border-current opacity-25" />
      <p className="text-sm font-semibold opacity-70">{subtitle}</p>
    </div>
  );
}