import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/useAuth";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard, MetricCard } from "./ui/Cards";
import { EditModal } from "./ui/EditModal";
import {
  IconPlus, IconUsers, IconRadio, IconMegaphone, IconNetwork, IconDownload, IconSearch,
  IconCalendar, IconTrash, IconBarChart, IconClipboard, IconActivity, IconZap, IconShare,
  IconComment, IconUserPlus, IconMessage, IconPhone, IconLink, IconFileText, IconEye,
  IconMousePointer, IconSettings, IconX, IconForNetwork
} from "./ui/Icons";
import {
  CATALOGOS_BASE, CONTACTO_DIRECTO_BASE, uid, today, safeArray, mergeCatalogos,
  createForm, createPautaForm, toNumber, getScreenshotExtension, rowFromDb, rowToDb,
  pautaFromDb, pautaToDb, catalogosFromDb, catalogosToDb, conclusionesFromDb, fmt,
  fmtMoney, fmtPct, getOnda, groupBy, downloadCsv,
  SCREENSHOTS_BUCKET, MAX_SCREENSHOT_SIZE, CHART_COLORS
} from "../utils/helpers";

const VISTA_PROYECTO_ID = import.meta.env.VITE_VISTA_PROYECTO_ID ?? "";

function MiniKpi({ title, value, icon }) {
  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-xs">{title}</p>
        <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">{icon}</div>
      </div>
      <p className="break-words text-xl font-black text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function OndaHero({ value = 0 }) {
  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white px-5 py-8 shadow-sm sm:rounded-[2rem] sm:px-6 sm:py-10 md:px-10 md:py-14">
      <div className="absolute right-[-90px] top-[-90px] h-48 w-48 rounded-full border-[16px] border-red-100 sm:h-52 sm:w-52 sm:border-[18px]" />
      <div className="absolute right-[12px] top-[-62px] h-32 w-32 rounded-full border-[12px] border-yellow-100 sm:right-[60px] sm:top-[-50px] sm:h-36 sm:w-36 sm:border-[14px]" />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-[#ffcc13] text-[#7a4100] sm:h-11 sm:w-11">
          <IconEye className="h-6 w-6" />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-[#d7193f] sm:text-sm sm:tracking-[0.3em]">ONDA EXPANSIVA</span>
      </div>
      <div className="relative mt-8 text-center sm:mt-10">
        <p className="break-words text-5xl font-black tracking-tight text-[#d7193f] sm:text-6xl md:text-8xl">{fmt(value)}</p>
        <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm md:text-base md:tracking-[0.2em]">TOTAL DE ONDA EXPANSIVA REGISTRADA</p>
      </div>
    </section>
  );
}

function ToggleChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full min-w-0 items-center justify-start gap-2 rounded-full px-4 py-2 text-left text-sm font-black transition sm:w-auto sm:justify-center sm:text-center ${active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-400" : "bg-slate-300"}`} />
      {label}
    </button>
  );
}

function SectionTitle({ icon, title, badge }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-red-50 p-3 text-[#d7193f]">{icon}</div>
        <h2 className="text-base font-black uppercase tracking-[0.16em] text-slate-900 sm:text-xl sm:tracking-[0.18em]">{title}</h2>
      </div>
      {badge || null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-black text-slate-700">
      {label}
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input">
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-slate-500 focus:bg-white"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="min-w-0 max-w-full rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-3">
        <h3 className="text-base font-black text-slate-950 sm:text-lg">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ContactoDirectoSection({ data }) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <SectionTitle
        icon={<IconNetwork className="h-5 w-5" />}
        title="Contacto Directo"
        badge={
          <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-2 text-sm sm:w-auto sm:justify-start">
            <span className="text-slate-500">Días de campaña:</span>
            <span className="rounded-xl border border-slate-200 px-4 py-1 text-xl font-black text-slate-800 sm:text-2xl">{data.diasCampana}</span>
          </div>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <DirectCard
          title="SMS"
          icon={<IconMessage className="h-5 w-5" />}
          labelA="Envíos diarios"
          valueA={fmt(data.sms.enviosDiarios)}
          labelB="Frecuencia"
          valueB={data.sms.frecuencia || "Sin definir"}
          footerLabel={`Total enviados x ${data.diasCampana} días`}
          footerValue={fmt(data.sms.total)}
          totalLabel="Costo total"
          totalValue={fmtMoney(data.sms.costoTotal)}
        />
        <DirectCard
          title="Llamadas Voz"
          icon={<IconPhone className="h-5 w-5" />}
          labelA="Llamadas realizadas"
          valueA={fmt(data.llamadas.realizadas)}
          labelB="Frecuencia"
          valueB={data.llamadas.frecuencia || "Sin definir"}
          footerLabel={`Total llamadas x ${data.diasCampana} días`}
          footerValue={fmt(data.llamadas.total)}
          totalLabel="Costo total"
          totalValue={fmtMoney(data.llamadas.costoTotal)}
        />
      </div>
    </section>
  );
}

function DirectCard({ title, icon, labelA, valueA, labelB, valueB, footerLabel, footerValue, totalLabel, totalValue }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-red-50 p-3.5 text-[#d7193f]">{icon}</div>
        <h3 className="text-lg font-black text-slate-900 sm:text-xl">{title}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">{labelA}</p>
          <p className="mt-2 break-words text-2xl font-black text-[#2b1719] sm:text-3xl">{valueA}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">{labelB}</p>
          <p className="mt-2 break-words text-lg font-black text-[#2b1719] sm:text-xl">{valueB}</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-[#f5f0e8] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-slate-500 sm:text-base">{footerLabel}</span>
          <span className="break-words text-xl font-black text-[#2b1719] sm:text-2xl">{footerValue}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base text-slate-500 sm:text-lg">{totalLabel}</span>
        <span className="break-words text-xl font-black text-[#2b1719] sm:text-2xl">{totalValue}</span>
      </div>
    </div>
  );
}

function ContenidoPautadoSection({ rows, form, catalogos, onChange, onAdd, onDelete, resumen, readOnly = false }) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <SectionTitle icon={<IconMegaphone className="h-5 w-5" />} title="Contenido Pautado" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MiniKpi title="Piezas pautadas" value={fmt(rows.length)} icon={<IconLink className="h-4 w-4" />} />
        <MiniKpi title="Alcance total" value={fmt(resumen.alcance)} icon={<IconNetwork className="h-4 w-4" />} />
        <MiniKpi title="Costo total" value={fmtMoney(resumen.costo)} icon={<IconBarChart className="h-4 w-4" />} />
        <MiniKpi title="Interacciones" value={fmt(resumen.interacciones)} icon={<IconZap className="h-4 w-4" />} />
        <MiniKpi title="CTR promedio" value={fmtPct(resumen.ctr)} icon={<IconMousePointer className="h-4 w-4" />} />
        <MiniKpi title="Visualizaciones" value={fmt(resumen.visualizaciones)} icon={<IconEye className="h-4 w-4" />} />
      </div>

      {!readOnly && (
        <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-4 sm:rounded-[1.8rem]">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-white p-3 text-[#d7193f] shadow-sm"><IconLink className="h-5 w-5" /></div>
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Links</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[140px_minmax(180px,1fr)_150px_repeat(5,minmax(105px,1fr))_120px]">
            <input type="date" value={form.fecha} onChange={(event) => onChange("fecha", event.target.value)} className="input" />
            <input type="url" value={form.url} onChange={(event) => onChange("url", event.target.value)} className="input md:col-span-2 xl:col-span-1" placeholder="https://..." />
            <select value={form.medio} onChange={(event) => onChange("medio", event.target.value)} className="input">
              {catalogos.mediosPauta.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input type="number" min="0" value={form.alcance} onChange={(event) => onChange("alcance", event.target.value)} className="input" placeholder="Alcance" />
            <input type="number" min="0" value={form.costo} onChange={(event) => onChange("costo", event.target.value)} className="input" placeholder="Costo" />
            <input type="number" min="0" value={form.interacciones} onChange={(event) => onChange("interacciones", event.target.value)} className="input" placeholder="Interacciones" />
            <input type="number" min="0" step="0.1" value={form.ctr} onChange={(event) => onChange("ctr", event.target.value)} className="input" placeholder="CTR" />
            <input type="number" min="0" value={form.visualizaciones} onChange={(event) => onChange("visualizaciones", event.target.value)} className="input" placeholder="Visualizaciones" />
            <button type="button" onClick={onAdd} className="btn-danger whitespace-nowrap"><IconPlus className="h-4 w-4" /> Agregar</button>
          </div>
        </div>
      )}

      <div className="-mx-4 mt-6 overflow-x-auto border-y border-slate-200 sm:mx-0 sm:rounded-2xl sm:border">
        <table className="w-full min-w-[320px] sm:min-w-[1100px] lg:min-w-full text-left text-sm">
          <thead>
            <tr className="bg-white text-xs uppercase tracking-wide text-slate-700">
              <th className="px-4 py-4">Fecha</th>
              <th className="px-4 py-4">URL</th>
              <th className="px-4 py-4">Medio</th>
              <th className="px-4 py-4 text-right">Alcance</th>
              <th className="px-4 py-4 text-right">Costo</th>
              <th className="px-4 py-4 text-right">Interacciones</th>
              <th className="px-4 py-4 text-right">CTR</th>
              <th className="px-4 py-4 text-right">Visualizaciones</th>
              {!readOnly && <th className="px-4 py-4"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 8 : 9} className="px-4 py-10 text-center text-sm font-bold text-slate-400">No hay links registrados.</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-t border-slate-100`}>
                  <td className="px-4 py-4 font-bold">{row.fecha}</td>
                  <td className="max-w-[360px] truncate px-4 py-4">
                    <a href={row.url} target="_blank" rel="noreferrer" className="font-medium text-[#d7193f] hover:underline">{row.url}</a>
                  </td>
                  <td className="px-4 py-4"><span className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700">{row.medio}</span></td>
                  <td className="px-4 py-4 text-right font-semibold">{fmt(row.alcance)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmtMoney(row.costo)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmt(row.interacciones)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmtPct(row.ctr)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmt(row.visualizaciones)}</td>
                  {!readOnly && (
                    <td className="px-4 py-4 text-right">
                      <button type="button" onClick={() => onDelete(row.id)} className="inline-flex items-center rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar contenido pautado">
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConclusionesSection({ rows, dateStart, dateEnd, selectedDate, draft, openConfig, onToggleConfig, onDateChange, onDraftChange, onSave, readOnly = false }) {
  const label = dateStart && dateEnd ? `Periodo ${dateStart} a ${dateEnd}` : dateStart ? `Desde ${dateStart}` : dateEnd ? `Hasta ${dateEnd}` : "Todas las fechas";

  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <SectionTitle
        icon={<IconFileText className="h-5 w-5" />}
        title="Conclusiones Generales"
        badge={!readOnly ? <button type="button" onClick={onToggleConfig} className="btn-tab"><IconSettings className="h-4 w-4" /> Configurar por fecha</button> : null}
      />
      <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-500">{label}</div>
      {!readOnly && openConfig && (
        <div className="mb-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
            <Field label="Fecha de conclusiones">
              <input type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="input" />
            </Field>
            <Field label="Conclusiones">
              <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} className="input min-h-28" placeholder="Escribe una conclusión por línea para esta fecha." />
            </Field>
            <button type="button" onClick={onSave} className="btn-primary">Guardar conclusiones</button>
          </div>
        </div>
      )}
      <div className="grid gap-4">
        {rows.length === 0 ? (
          <EmptyState text="No hay conclusiones registradas para el periodo seleccionado." />
        ) : (
          rows.map((item, index) => (
            <div key={`${index}-${item}`} className="flex flex-col gap-4 rounded-[1.35rem] border border-slate-200 bg-[#fffdfb] px-5 py-6 sm:flex-row sm:items-center sm:gap-5 sm:rounded-[1.6rem] sm:px-6 sm:py-7">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg font-black text-[#d7193f] sm:h-11 sm:w-11 sm:text-xl">{index + 1}</div>
              <p className="text-base text-slate-900 sm:text-xl md:text-2xl">{item}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FilterPanel({ query, setQuery, responsable, setResponsable, red, setRed, accion, setAccion, catalogos, placeholder, dateStart, setDateStart, dateEnd, setDateEnd, clearDateFilters }) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,180px)_minmax(0,180px)_minmax(0,220px)]">
        <div className="relative min-w-0">
          <span className="pointer-events-none absolute left-4 top-3.5 text-slate-400"><IconSearch className="h-4 w-4" /></span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-slate-500 focus:bg-white" />
        </div>
        <FilterSelect value={responsable} onChange={setResponsable} options={["Todos", ...catalogos.responsables]} />
        <FilterSelect value={red} onChange={setRed} options={["Todas", ...catalogos.redes]} />
        <FilterSelect value={accion} onChange={setAccion} options={["Todas", ...catalogos.acciones]} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Fecha inicial">
          <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="input" />
        </Field>
        <Field label="Fecha final">
          <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="input" />
        </Field>
        <button type="button" onClick={clearDateFilters} className="btn-tab">Limpiar fechas</button>
      </div>
    </section>
  );
}

function RegistroForm({ form, handleChange, handleSubmit, catalogos }) {
  const [esVideo, setEsVideo] = useState(false);
  const [reproducciones, setReproducciones] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  const fileInputRef = useRef(null);

  const previewUrl = useMemo(() => {
    return screenshot ? URL.createObjectURL(screenshot) : null;
  }, [screenshot]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setScreenshot(file);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      setScreenshot(file);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const saved = await handleSubmit({
      ...form,
      esVideo,
      reproducciones: esVideo ? reproducciones : "",
      screenshot,
    });

    if (!saved) return;

    setEsVideo(false);
    setReproducciones("");
    setScreenshot(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <IconPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Registrar acción diaria</h2>
          <p className="text-sm text-slate-500">Formulario único para que cada CM diligencie sus acciones del día.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Field label="Fecha">
          <input type="date" value={form.fecha} onChange={(event) => handleChange("fecha", event.target.value)} className="input" required />
        </Field>

        <Field label="Responsable">
          <Select value={form.responsable} onChange={(value) => handleChange("responsable", value)} options={catalogos.responsables} />
        </Field>

        <Field label="Acción">
          <Select value={form.accion} onChange={(value) => handleChange("accion", value)} options={catalogos.acciones} />
        </Field>

        <Field label="Red / Medio">
          <Select value={form.red} onChange={(value) => handleChange("red", value)} options={catalogos.redes} />
        </Field>

        <Field label="Campaña">
          <Select value={form.tema} onChange={(value) => handleChange("tema", value)} options={catalogos.campanas} />
        </Field>

        <Field label="Estado en Grupos">
          <Select value={form.estado} onChange={(value) => handleChange("estado", value)} options={catalogos.estadosGrupo} />
        </Field>

        <Field label="Hashtag 1">
          <input value={form.hashtag1} onChange={(event) => handleChange("hashtag1", event.target.value)} className="input" placeholder="#" />
        </Field>

        <Field label="Hashtag 2">
          <input value={form.hashtag2} onChange={(event) => handleChange("hashtag2", event.target.value)} className="input" placeholder="#" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Nombre del medio / perfil / grupo">
          <input value={form.perfilGrupo} onChange={(event) => handleChange("perfilGrupo", event.target.value)} className="input" placeholder="Ej: Semana, El Tiempo, grupo X" required />
        </Field>

        <Field label="Perfil de difusión">
          <input value={form.perfilDifusion} onChange={(event) => handleChange("perfilDifusion", event.target.value)} className="input" placeholder="Ej: Perfil A, Influenciador, canal oficial" />
        </Field>

        <Field label="Link perfil / grupo">
          <input type="url" value={form.linkPerfil} onChange={(event) => handleChange("linkPerfil", event.target.value)} className="input" placeholder="https://..." />
        </Field>

        <Field label="Link de la publicación">
          <input type="url" value={form.linkPublicacion} onChange={(event) => handleChange("linkPublicacion", event.target.value)} className="input" placeholder="https://..." />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        <Field label="Alcance">
          <input type="number" min="0" value={form.alcance} onChange={(event) => handleChange("alcance", event.target.value)} className="input" placeholder="0" required />
        </Field>

        <Field label="Me gusta">
          <input type="number" min="0" value={form.meGusta} onChange={(event) => handleChange("meGusta", event.target.value)} className="input" placeholder="0" />
        </Field>

        <Field label="Comentarios">
          <input type="number" min="0" value={form.comentarios} onChange={(event) => handleChange("comentarios", event.target.value)} className="input" placeholder="0" />
        </Field>

        <Field label="Compartidos">
          <input type="number" min="0" value={form.compartidos} onChange={(event) => handleChange("compartidos", event.target.value)} className="input" placeholder="0" />
        </Field>

        <Field label="Retweets">
          <input type="number" min="0" value={form.retweets} onChange={(event) => handleChange("retweets", event.target.value)} className="input" placeholder="0" />
        </Field>

        <Field label="Historias">
          <input type="number" min="0" value={form.historias} onChange={(event) => handleChange("historias", event.target.value)} className="input" placeholder="0" />
        </Field>

        <Field label="Seguidores">
          <input type="number" min="0" value={form.seguidores} onChange={(event) => handleChange("seguidores", event.target.value)} className="input" placeholder="0" />
        </Field>

        {esVideo && (
          <Field label="Reproducciones">
            <input type="number" min="0" value={reproducciones} onChange={(event) => setReproducciones(event.target.value)} className="input" placeholder="0" required />
          </Field>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input type="checkbox" id="esVideo" checked={esVideo} onChange={() => setEsVideo((value) => !value)} />
        <label htmlFor="esVideo" className="font-bold">¿Es video?</label>
      </div>

      <div
        className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 transition-colors sm:min-h-[140px]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleScreenshotChange} />

        {screenshot && previewUrl ? (
          <div className="flex flex-col items-center">
            <img src={previewUrl} alt="Vista previa del screenshot" className="mb-2 max-h-32 rounded-lg border" />
            <span className="text-xs font-bold text-slate-700">{screenshot.name}</span>
          </div>
        ) : (
          <span className="text-slate-400">Arrastra aquí la imagen o haz clic para seleccionar un archivo</span>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
        <Field label="Mención">
          <input value={form.mencion} onChange={(event) => handleChange("mencion", event.target.value)} className="input" placeholder="@" />
        </Field>

        <Field label="Notas">
          <textarea value={form.notas} onChange={(event) => handleChange("notas", event.target.value)} className="input min-h-24" placeholder="Observaciones de la acción" />
        </Field>
      </div>

      <button type="submit" className="mt-5 w-full rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:scale-[1.01] sm:w-auto">
        Guardar acción y alimentar dashboard
      </button>
    </form>
  );
}
function ConsolidadoTable({ rows, removeRow, onEditRow }) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Consolidado de acciones</h2>
          <p className="text-sm text-slate-500">
            Base maestra lista para exportar, auditar o conectar a Looker Studio.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
          <IconCalendar className="h-4 w-4" /> {fmt(rows.length)} registros
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto border-y border-slate-200 sm:mx-0 sm:rounded-2xl sm:border">
        <table className="w-full min-w-[320px] sm:min-w-[1000px] lg:min-w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-950 text-xs uppercase tracking-wide text-white">
              <th className="px-3 py-3">Fecha</th>
              <th className="px-3 py-3">Responsable</th>
              <th className="px-3 py-3">Acción</th>
              <th className="px-3 py-3">Red</th>
              <th className="px-3 py-3">Medio / perfil / grupo</th>
              <th className="px-3 py-3">Campaña</th>
              <th className="px-3 py-3 text-right">Alcance</th>
              <th className="px-3 py-3 text-right">Reproducciones Video</th>
              <th className="px-3 py-3 text-right">Seguidores</th>
              <th className="px-3 py-3">Estado en Grupos</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                >
                  No hay acciones registradas.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } border-b border-slate-100 hover:bg-blue-50/60`}
                >
                  <td className="px-3 py-3 font-bold">{row.fecha}</td>
                  <td className="px-3 py-3">{row.responsable}</td>
                  <td className="px-3 py-3">{row.accion}</td>

                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 font-bold">
                      <IconForNetwork red={row.red} />
                      {row.red}
                    </span>
                  </td>

                  <td className="px-3 py-3">{row.perfilGrupo}</td>
                  <td className="px-3 py-3">{row.tema}</td>
                  <td className="px-3 py-3 text-right">{fmt(row.alcance)}</td>

                  <td className="px-3 py-3 text-right text-base font-black text-blue-700">
                    {fmt(getOnda(row))}
                  </td>

                  <td className="px-3 py-3 text-right">{fmt(row.seguidores)}</td>

                  <td className="px-3 py-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                      {row.estado}
                    </span>
                  </td>

                  <td className="flex justify-end gap-2 px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEditRow?.(row)}
                      className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                      title="Editar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 001.213-1.213l1-4a4 4 0 01.828-1.414z"
                        />
                      </svg>
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConfiguracionSection({ catalogos, onRename, onAdd, onRemove, onReset, configMessage }) {
  const sections = [
    ["Responsables", "Agrega, elimina o cambia nombres como CM 1 por el nombre real del Community Manager.", "responsables"],
    ["Acciones", "Personaliza las acciones que el equipo puede seleccionar al registrar una actividad.", "acciones"],
    ["Red / Medio", "Administra las redes o medios disponibles para el registro orgánico.", "redes"],
    ["Campañas", "Crea o elimina campañas para clasificar cada acción diaria.", "campanas"],
    ["Estado en Grupos", "Configura los estados para saber si una publicación está activa, pendiente, publicada o descartada.", "estadosGrupo"],
    ["Medios de Contenido Pautado", "Administra los medios usados en la sección de contenido pautado.", "mediosPauta"],
  ];

  return (
    <section className="grid gap-5">
      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[1.8rem]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Configuración</h2>
            <p className="mt-1 text-sm text-slate-500">Administra los selectores que aparecen en Registrar, filtros y contenido pautado.</p>
          </div>
          <button type="button" onClick={onReset} className="btn-tab">Restaurar base</button>
        </div>
        {configMessage && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">{configMessage}</div>}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map(([title, description, category]) => (
          <CatalogManager key={category} title={title} description={description} items={catalogos[category]} category={category} onRename={onRename} onAdd={onAdd} onRemove={onRemove} />
        ))}
      </div>
    </section>
  );
}

function CatalogItemEditor({ item, index, category, onRename, onRemove }) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    // Solo actualizar draft si cambió el item
    if (draft !== item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(item);
    }
  }, [item, draft]);

  function commitDraft() {
    const nextValue = draft.trim();
    if (!nextValue) {
      setDraft(item);
      return;
    }
    if (nextValue !== item) void onRename(category, index, nextValue);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <input
        value={draft}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className="input"
      />
      <button type="button" onClick={() => onRemove(category, item)} className="rounded-2xl border border-red-100 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-50">Eliminar</button>
    </div>
  );
}

function CatalogManager({ title, description, items, category, onRename, onAdd, onRemove }) {
  const [newItem, setNewItem] = useState("");

  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[1.8rem]">
      <div className="mb-4">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <CatalogItemEditor
            key={`${category}-${item}-${index}`}
            item={item}
            index={index}
            category={category}
            onRename={onRename}
            onRemove={onRemove}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          className="input"
          placeholder={`Nuevo valor para ${title.toLowerCase()}`}
        />

        <button
          type="button"
          onClick={() => {
            onAdd(category, newItem);
            setNewItem("");
          }}
          className="btn-primary"
        >
          <IconPlus className="h-4 w-4" /> Agregar
        </button>
      </div>
    </div>
  );
}

export default function OndaExpansivaApp() {
  const { isCM, isVisualizador, user, logout } = useAuth();
  const isReadOnly = !isCM;
  const [catalogos, setCatalogos] = useState(() => mergeCatalogos(CATALOGOS_BASE));
  const [proyectos, setProyectos] = useState([]);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [rows, setRows] = useState([]);
  const [pautaRows, setPautaRows] = useState([]);
  // Eliminadas declaraciones duplicadas de form y pautaForm
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");
  // Persistencia del formulario de registro
  const getInitialForm = () => {
    try {
      const saved = localStorage.getItem("ondaexp_form");
      if (saved) return JSON.parse(saved);
    } catch {
      // Si el almacenamiento local falla, usamos el formulario base.
    }
    return createForm(CATALOGOS_BASE);
  };
  const [form, setForm] = useState(getInitialForm);
  // Persistencia del formulario de pauta
  const getInitialPautaForm = () => {
    try {
      const saved = localStorage.getItem("ondaexp_pautaform");
      if (saved) return JSON.parse(saved);
    } catch {
      // Si el almacenamiento local falla, usamos el formulario base.
    }
    return createPautaForm(CATALOGOS_BASE);
  };
  const [pautaForm, setPautaForm] = useState(getInitialPautaForm);

  const [query, setQuery] = useState("");
  const [responsable, setResponsable] = useState("Todos");
  const [red, setRed] = useState("Todas");
  const [accion, setAccion] = useState("Todas");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [vista, setVista] = useState(() => {
    try {
      return localStorage.getItem("ondaexp_vista") || "dashboard";
    } catch {
      return "dashboard";
    }
  });

  useEffect(() => {
    if (!isCM && vista !== "dashboard") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVista("dashboard");
      try {
        localStorage.setItem("ondaexp_vista", "dashboard");
      } catch {
        // La vista en memoria queda actualizada aunque localStorage no esté disponible.
      }
    }
  }, [isCM, vista]);

  const [mostrarContactoDirecto, setMostrarContactoDirecto] = useState(true);
  const [mostrarContenidoPautado, setMostrarContenidoPautado] = useState(true);
  const [mostrarConclusiones, setMostrarConclusiones] = useState(true);

  const [conclusionesPorFecha, setConclusionesPorFecha] = useState({});
  const [mostrarConfigConclusiones, setMostrarConfigConclusiones] = useState(false);
  const [fechaConclusiones, setFechaConclusiones] = useState(today());
  const [borradorConclusiones, setBorradorConclusiones] = useState("");

  const [csvStatus, setCsvStatus] = useState("");
  const [configMessage, setConfigMessage] = useState("");
  const [editRow, setEditRow] = useState(null);
  const csvTimeoutRef = useRef(null);

  const proyectoFiltro = isCM ? proyectoActivo : VISTA_PROYECTO_ID;

  const withProyectoActivo = useCallback((query) => {
    return proyectoFiltro ? query.eq("proyecto_id", proyectoFiltro) : query;
  }, [proyectoFiltro]);

  useEffect(() => {
    let mounted = true;

    async function cargarProyectosUsuario() {
      if (!isCM || !user?.id) {
        if (mounted) {
          setProyectos([]);
          setProyectoActivo(null);
        }
        return;
      }

      const { data, error } = await supabase
        .from("usuarios_proyectos")
        .select(`
          rol,
          proyectos (
            id,
            nombre,
            slug
          )
        `);

      if (error) {
        if (mounted) {
          setSyncStatus(`Error cargando proyectos: ${error.message}`);
          setProyectos([]);
          setProyectoActivo(null);
        }
        return;
      }

      const lista = safeArray(data)
        .map((item) => {
          const proyecto = Array.isArray(item.proyectos) ? item.proyectos[0] : item.proyectos;
          return proyecto ? { ...proyecto, rol: item.rol } : null;
        })
        .filter(Boolean);

      if (mounted) {
        setProyectos(lista);
        setProyectoActivo((actual) => (lista.some((proyecto) => proyecto.id === actual) ? actual : lista[0]?.id ?? null));
      }
    }

    cargarProyectosUsuario();

    return () => {
      mounted = false;
    };
  }, [isCM, user?.id]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout = null;

    async function loadDashboardData() {
      if (isCM && !proyectoFiltro) {
        setRows([]);
        setPautaRows([]);
        setConclusionesPorFecha({});
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSyncStatus("");

      const [accionesResult, pautaResult, catalogosResult, conclusionesResult] = await Promise.all([
        withProyectoActivo(supabase.from("acciones").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false })),
        withProyectoActivo(supabase.from("pauta").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false })),
        withProyectoActivo(supabase.from("catalogos").select("*").order("categoria", { ascending: true })),
        withProyectoActivo(supabase.from("conclusiones").select("*").order("fecha", { ascending: true })),
      ]);

      const error = accionesResult.error || pautaResult.error || catalogosResult.error || conclusionesResult.error;

      if (error) {
        if (mounted) {
          setSyncStatus(`Error cargando datos de Supabase: ${error.message}`);
          setIsLoading(false);
        }
        return;
      }

      const nextCatalogos = catalogosFromDb(catalogosResult.data);

      if (mounted) {
        setCatalogos(nextCatalogos);
        setRows(safeArray(accionesResult.data).map(rowFromDb));
        setPautaRows(safeArray(pautaResult.data).map(pautaFromDb));
        setConclusionesPorFecha(conclusionesFromDb(conclusionesResult.data));
        setIsLoading(false);
      }
    }

    loadDashboardData();

    const scheduleRefresh = () => {
      if (refreshTimeout) window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => {
        if (mounted) void loadDashboardData();
      }, 250);
    };

    const realtimeFilter = proyectoFiltro ? `proyecto_id=eq.${proyectoFiltro}` : "";
    const changeOptions = (table) => ({
      event: "*",
      schema: "public",
      table,
      ...(realtimeFilter ? { filter: realtimeFilter } : {}),
    });
    const channel = supabase
      .channel(`dashboard-live-${proyectoFiltro || "global"}`)
      .on("postgres_changes", changeOptions("acciones"), scheduleRefresh)
      .on("postgres_changes", changeOptions("pauta"), scheduleRefresh)
      .on("postgres_changes", changeOptions("catalogos"), scheduleRefresh)
      .on("postgres_changes", changeOptions("conclusiones"), scheduleRefresh)
      .subscribe();

    return () => {
      mounted = false;
      if (refreshTimeout) window.clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [isCM, proyectoFiltro, withProyectoActivo]);

  useEffect(() => {
    return () => {
      if (csvTimeoutRef.current) clearTimeout(csvTimeoutRef.current);
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      const searchable = Object.values(row).join(" ").toLowerCase();
      return (
        (!q || searchable.includes(q)) &&
        (responsable === "Todos" || row.responsable === responsable) &&
        (red === "Todas" || row.red === red) &&
        (accion === "Todas" || row.accion === accion) &&
        (!dateStart || String(row.fecha || "") >= dateStart) &&
        (!dateEnd || String(row.fecha || "") <= dateEnd)
      );
    });
  }, [rows, query, responsable, red, accion, dateStart, dateEnd]);

  const filteredPautaRows = useMemo(
    () => pautaRows.filter((row) => (!dateStart || String(row.fecha || "") >= dateStart) && (!dateEnd || String(row.fecha || "") <= dateEnd)),
    [pautaRows, dateStart, dateEnd]
  );

  const resumenPeriodo = useMemo(() => {
    const comentarios = filteredRows.reduce((sum, row) => sum + toNumber(row.comentarios), 0);
    const compartidos = filteredRows.reduce((sum, row) => sum + toNumber(row.compartidos) + toNumber(row.retweets) + toNumber(row.historias), 0);
    const interaccionesCaptadas = filteredRows.reduce(
      (sum, row) => sum + toNumber(row.meGusta) + toNumber(row.comentarios) + toNumber(row.compartidos) + toNumber(row.retweets) + toNumber(row.historias),
      0
    );
    const seguidoresCaptados = filteredRows.reduce((sum, row) => sum + toNumber(row.seguidores), 0);
    // Reproducción de Video: solo suma las reproducciones de filas donde esVideo === true
    const reproduccionesVideo = filteredRows.reduce((sum, row) => (row.esVideo ? sum + toNumber(row.reproducciones) : sum), 0);
    // Onda Expansiva mantiene la lógica original para otros tipos de contenido
    const ondaExpansiva = filteredRows.reduce((sum, row) => sum + getOnda(row), 0);

    return { ondaExpansiva, reproduccionesVideo, interaccionesCaptadas, compartidos, comentarios, seguidoresCaptados };
  }, [filteredRows]);

  const [editableMetrics, setEditableMetrics] = useState({
    interaccionesCaptadas: 0,
    compartidos: 0,
    comentarios: 0,
    accionesTropa: 0,
    seguidoresCaptados: 0,
  });
  const [overriddenMetrics, setOverriddenMetrics] = useState(new Set());

  useEffect(() => {
    setEditableMetrics(m => ({
      ...m,
      ...(!overriddenMetrics.has("interaccionesCaptadas") && { interaccionesCaptadas: resumenPeriodo.interaccionesCaptadas || 0 }),
      ...(!overriddenMetrics.has("compartidos") && { compartidos: resumenPeriodo.compartidos || 0 }),
      ...(!overriddenMetrics.has("comentarios") && { comentarios: resumenPeriodo.comentarios || 0 }),
      ...(!overriddenMetrics.has("accionesTropa") && { accionesTropa: filteredRows.length || 0 }),
      ...(!overriddenMetrics.has("seguidoresCaptados") && { seguidoresCaptados: resumenPeriodo.seguidoresCaptados || 0 }),
    }));
  // overriddenMetrics excluido intencionalmente: el efecto solo re-sincroniza cuando cambian los datos, no cuando el usuario edita un campo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumenPeriodo, filteredRows]);

  const handleResetMetrics = () => {
    setOverriddenMetrics(new Set());
    setEditableMetrics({
      interaccionesCaptadas: resumenPeriodo.interaccionesCaptadas || 0,
      compartidos: resumenPeriodo.compartidos || 0,
      comentarios: resumenPeriodo.comentarios || 0,
      accionesTropa: filteredRows.length || 0,
      seguidoresCaptados: resumenPeriodo.seguidoresCaptados || 0,
    });
  };

  const kpis = useMemo(
    () => ({
      totalOnda: resumenPeriodo.reproduccionesVideo,
      contenidos: filteredRows.filter((row) => row.accion === "Creación de contenido").length,
      difundidos: filteredRows.filter((row) => row.accion !== "Creación de contenido").length,
      redesActivas: new Set(filteredRows.map((row) => row.red)).size,
    }),
    [filteredRows, resumenPeriodo.reproduccionesVideo]
  );


  const accionesPorRed = useMemo(() => groupBy(filteredRows, "red"), [filteredRows]);
  const ondaPorCm = useMemo(() => groupBy(filteredRows, "responsable", getOnda), [filteredRows]);
  const accionesPorTipo = useMemo(() => groupBy(filteredRows, "accion"), [filteredRows]);
  const ondaPorFecha = useMemo(
    () => groupBy(filteredRows, "fecha", getOnda).sort((a, b) => String(a.name).localeCompare(String(b.name))).map((item) => ({ fecha: item.name, onda: item.value })),
    [filteredRows]
  );

  const pautaResumen = useMemo(() => {
    const alcance = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.alcance), 0);
    const costo = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.costo), 0);
    const interacciones = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.interacciones), 0);
    const visualizaciones = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.visualizaciones), 0);
    const ctr = filteredPautaRows.length ? filteredPautaRows.reduce((sum, row) => sum + toNumber(row.ctr), 0) / filteredPautaRows.length : 0;

    return { alcance, costo, interacciones, visualizaciones, ctr };
  }, [filteredPautaRows]);

  const conclusionesPeriodo = useMemo(
    () =>
      Object.entries(conclusionesPorFecha)
        .filter(([fecha]) => (!dateStart || fecha >= dateStart) && (!dateEnd || fecha <= dateEnd))
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
        .flatMap(([, items]) => safeArray(items)),
    [conclusionesPorFecha, dateStart, dateEnd]
  );

  async function persistCatalogos(nextCatalogos) {
    if (isCM && !proyectoActivo) {
      setSyncStatus("Selecciona un proyecto antes de guardar catálogos.");
      return false;
    }

    setCatalogos(nextCatalogos);

    const { error } = await supabase
      .from("catalogos")
      .upsert(catalogosToDb(nextCatalogos, proyectoActivo), { onConflict: proyectoActivo ? "proyecto_id,categoria" : "categoria" });

    if (error) {
      setSyncStatus(`Error guardando catálogos: ${error.message}`);
      return false;
    }

    return true;
  }

  async function deleteRow(id) {
    // Obtener el registro para saber si tiene screenshot
    const rowToDelete = rows.find((r) => r.id === id);

    if (rowToDelete?.screenshotPath) {
      try {
        await supabase.storage
          .from(SCREENSHOTS_BUCKET)
          .remove([rowToDelete.screenshotPath]);
      } catch {
        // Continuar con la eliminación del registro aunque falle el storage
      }
    }

    const { error } = await withProyectoActivo(supabase.from("acciones").delete().eq("id", id));

    if (error) {
      setSyncStatus(`Error eliminando acción: ${error.message}`);
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    setSyncStatus("Acción eliminada correctamente.");
  }

  async function deletePautaRow(id) {
    const { error } = await withProyectoActivo(supabase.from("pauta").delete().eq("id", id));

    if (error) {
      setSyncStatus(`Error eliminando pauta: ${error.message}`);
      return;
    }

    setPautaRows((prev) => prev.filter((row) => row.id !== id));
    setSyncStatus("Contenido pautado eliminado correctamente.");
  }

  async function renameCatalogItem(category, index, value) {
    const cleanValue = value.trim();
    if (!cleanValue || !catalogos[category]?.[index]) return;

    const oldValue = catalogos[category][index];
    const nextItems = catalogos[category].map((item, itemIndex) => (itemIndex === index ? cleanValue : item));
    const nextCatalogos = { ...catalogos, [category]: Array.from(new Set(nextItems)) };
    const fieldMap = { responsables: "responsable", acciones: "accion", redes: "red", campanas: "tema", estadosGrupo: "estado" };

    const ok = await persistCatalogos(nextCatalogos);
    if (!ok) return;

    if (fieldMap[category]) {
      const field = fieldMap[category];
      setRows((prev) => prev.map((row) => (row[field] === oldValue ? { ...row, [field]: cleanValue } : row)));
      const { error } = await withProyectoActivo(supabase.from("acciones").update({ [field]: cleanValue }).eq(field, oldValue));
      if (error) {
        setSyncStatus(`Error actualizando acciones: ${error.message}`);
        return;
      }
    }

    if (category === "mediosPauta") {
      setPautaRows((prev) => prev.map((row) => (row.medio === oldValue ? { ...row, medio: cleanValue } : row)));
      const { error } = await withProyectoActivo(supabase.from("pauta").update({ medio: cleanValue }).eq("medio", oldValue));
      if (error) {
        setSyncStatus(`Error actualizando pauta: ${error.message}`);
        return;
      }
    }

    setForm((prev) => (fieldMap[category] && prev[fieldMap[category]] === oldValue ? { ...prev, [fieldMap[category]]: cleanValue } : prev));
    setPautaForm((prev) => (category === "mediosPauta" && prev.medio === oldValue ? { ...prev, medio: cleanValue } : prev));
    setConfigMessage("Configuración actualizada.");
    setSyncStatus("Configuración guardada en Supabase.");
  }

  async function addCatalogItem(category, value) {
    const cleanValue = value.trim();
    if (!cleanValue || !catalogos[category]) return;

    const nextCatalogos = { ...catalogos, [category]: Array.from(new Set([...catalogos[category], cleanValue])) };
    const ok = await persistCatalogos(nextCatalogos);
    if (!ok) return;

    setConfigMessage("Elemento agregado.");
    setSyncStatus("Catálogo actualizado en Supabase.");
  }

  async function removeCatalogItem(category, value) {
    if (!catalogos[category] || catalogos[category].length <= 1) return;

    const nextItems = catalogos[category].filter((item) => item !== value);
    const fallback = nextItems[0] || "";
    const nextCatalogos = { ...catalogos, [category]: nextItems };
    const fieldMap = { responsables: "responsable", acciones: "accion", redes: "red", campanas: "tema", estadosGrupo: "estado" };

    const ok = await persistCatalogos(nextCatalogos);
    if (!ok) return;

    if (fieldMap[category]) {
      const field = fieldMap[category];
      setRows((prev) => prev.map((row) => (row[field] === value ? { ...row, [field]: fallback } : row)));
      const { error } = await withProyectoActivo(supabase.from("acciones").update({ [field]: fallback }).eq(field, value));
      if (error) {
        setSyncStatus(`Error actualizando acciones: ${error.message}`);
        return;
      }
    }

    if (category === "mediosPauta") {
      setPautaRows((prev) => prev.map((row) => (row.medio === value ? { ...row, medio: fallback } : row)));
      const { error } = await withProyectoActivo(supabase.from("pauta").update({ medio: fallback }).eq("medio", value));
      if (error) {
        setSyncStatus(`Error actualizando pauta: ${error.message}`);
        return;
      }
    }

    setForm((prev) => (fieldMap[category] && prev[fieldMap[category]] === value ? { ...prev, [fieldMap[category]]: fallback } : prev));
    setPautaForm((prev) => (category === "mediosPauta" && prev.medio === value ? { ...prev, medio: fallback } : prev));
    setConfigMessage("Elemento eliminado.");
    setSyncStatus("Catálogo actualizado en Supabase.");
  }

  async function resetCatalogos() {
    const ok = await persistCatalogos(CATALOGOS_BASE);
    if (!ok) return;

    setForm(createForm(CATALOGOS_BASE));
    setPautaForm(createPautaForm(CATALOGOS_BASE));
    setConfigMessage("Configuración restaurada.");
    setSyncStatus("Configuración base restaurada.");
  }

  function handleConclusionDateChange(value) {
    setFechaConclusiones(value);
    setBorradorConclusiones(safeArray(conclusionesPorFecha[value]).join("\n"));
  }

  async function handleSaveConclusiones() {
    const items = borradorConclusiones.split("\n").map((item) => item.trim()).filter(Boolean);
    const next = { ...conclusionesPorFecha };

    if (items.length) {
      const payload = {
        fecha: fechaConclusiones,
        conclusiones: items,
        ...(proyectoActivo ? { proyecto_id: proyectoActivo } : {}),
      };
      const { error } = await supabase
        .from("conclusiones")
        .upsert(payload, { onConflict: proyectoActivo ? "proyecto_id,fecha" : "fecha" });
      if (error) {
        setSyncStatus(`Error guardando conclusiones: ${error.message}`);
        return;
      }
      next[fechaConclusiones] = items;
    } else {
      let query = supabase.from("conclusiones").delete().eq("fecha", fechaConclusiones);
      if (proyectoActivo) query = query.eq("proyecto_id", proyectoActivo);
      const { error } = await query;
      if (error) {
        setSyncStatus(`Error eliminando conclusiones: ${error.message}`);
        return;
      }
      delete next[fechaConclusiones];
    }

    setConclusionesPorFecha(next);
    setSyncStatus("Conclusiones guardadas correctamente.");
  }

  function handleVistaChange(nextVista) {
    setVista(nextVista);
    setCsvStatus("");

    try {
      localStorage.setItem("ondaexp_vista", nextVista);
    } catch {
      // La vista en memoria queda actualizada aunque localStorage no esté disponible.
    }

    if (typeof window !== "undefined") {
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }
  }

  function handleCsvExport() {
    const ok = downloadCsv(filteredRows);
    setCsvStatus(ok ? `CSV generado con ${filteredRows.length} registros.` : "No se pudo generar el CSV en este entorno.");

    if (typeof window !== "undefined") {
      if (csvTimeoutRef.current) window.clearTimeout(csvTimeoutRef.current);
      csvTimeoutRef.current = window.setTimeout(() => {
        setCsvStatus("");
        csvTimeoutRef.current = null;
      }, 4000);
    }
  }

  async function compressImage(file, maxWidth = 1200, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("No se pudo comprimir la imagen"));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => {
          reject(new Error("No se pudo cargar la imagen"));
        };
      };
      reader.onerror = () => {
        reject(new Error("Error al leer el archivo"));
      };
    });
  }

  async function handleSubmit(payload = form) {
    if (isCM && !proyectoActivo) {
      setSyncStatus("Selecciona un proyecto antes de guardar una acción.");
      return false;
    }

    const rowId = uid();
    let screenshotUrl = "";
    let screenshotDriveId = "";
    let screenshotPath = "";

    // Si hay screenshot (File), subir a Supabase Storage
    if (payload.screenshot instanceof File) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.user) {
        setSyncStatus("Tu sesión de Supabase no está activa. Cierra sesión, vuelve a entrar e intenta guardar la imagen otra vez.");
        return false;
      }

      if (!payload.screenshot.type.startsWith("image/")) {
        setSyncStatus("El archivo seleccionado debe ser una imagen.");
        return false;
      }

      if (payload.screenshot.size > MAX_SCREENSHOT_SIZE) {
        setSyncStatus("La imagen supera el límite de 10 MB.");
        return false;
      }

      try {
        setSyncStatus("Comprimiendo y subiendo imagen...");

        let fileToUpload = payload.screenshot;

        // Comprimir imagen si es muy grande
        if (payload.screenshot.size > 1024 * 1024) {
          try {
            fileToUpload = await compressImage(payload.screenshot, 1200, 0.8);
          } catch {
            // Continuar con la imagen original si falla la compresión
          }
        }

        // Generar nombre único del archivo
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileExt = getScreenshotExtension(fileToUpload);
        const fileName = `${timestamp}-${randomStr}.${fileExt}`;
        const filePath = `${rowId}/${fileName}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SCREENSHOTS_BUCKET)
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            contentType: fileToUpload.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Error al subir screenshot: ${uploadError.message}`);
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from(SCREENSHOTS_BUCKET)
          .getPublicUrl(filePath);

        screenshotUrl = urlData.publicUrl;
        screenshotDriveId = uploadData.id;
        screenshotPath = filePath;
      } catch (err) {
        setSyncStatus(`Error al guardar la imagen: ${err.message}`);
        return false;
      }
    }

    const newRow = {
      ...payload,
      id: rowId,
      proyectoId: proyectoActivo,
      alcance: toNumber(payload.alcance),
      meGusta: toNumber(payload.meGusta),
      comentarios: toNumber(payload.comentarios),
      compartidos: toNumber(payload.compartidos),
      retweets: toNumber(payload.retweets),
      historias: toNumber(payload.historias),
      seguidores: toNumber(payload.seguidores),
      reproducciones: toNumber(payload.reproducciones),
      screenshotUrl,
      screenshotDriveId,
      screenshotPath,
      screenshot: undefined, // No guardar el File
    };

    const { data, error } = await supabase.from("acciones").insert(rowToDb(newRow)).select().single();

    if (error) {
      if (screenshotPath) {
        await supabase.storage.from(SCREENSHOTS_BUCKET).remove([screenshotPath]);
      }
      setSyncStatus(`Error guardando acción: ${error.message}`);
      return false;
    }

    const cleanForm = createForm(catalogos);

    setRows((prev) => [rowFromDb(data), ...prev]);
    setForm(cleanForm);

    try {
      localStorage.setItem("ondaexp_form", JSON.stringify(cleanForm));
    } catch {
      // El registro ya quedó guardado aunque no se pueda persistir el borrador local.
    }

    setVista("dashboard");
    setSyncStatus("Acción guardada correctamente.");
    return true;
  }

  async function handleSaveEdit(updatedRow) {
    const normalizedRow = {
      ...updatedRow,
      alcance: toNumber(updatedRow.alcance),
      meGusta: toNumber(updatedRow.meGusta),
      comentarios: toNumber(updatedRow.comentarios),
      compartidos: toNumber(updatedRow.compartidos),
      retweets: toNumber(updatedRow.retweets),
      historias: toNumber(updatedRow.historias),
      seguidores: toNumber(updatedRow.seguidores),
    };

    const { data, error } = await withProyectoActivo(
      supabase.from("acciones").update(rowToDb(normalizedRow)).eq("id", normalizedRow.id).select()
    ).single();

    if (error) {
      setSyncStatus(`Error actualizando acción: ${error.message}`);
      return;
    }

    setRows((prev) => prev.map((row) => (row.id === normalizedRow.id ? rowFromDb(data) : row)));
    setEditRow(null);
    setSyncStatus("Acción actualizada correctamente.");
  }

  async function handleAddPauta() {
    if (!pautaForm.url.trim()) return;
    if (isCM && !proyectoActivo) {
      setSyncStatus("Selecciona un proyecto antes de guardar contenido pautado.");
      return;
    }

    const newRow = {
      id: uid(),
      proyectoId: proyectoActivo,
      fecha: pautaForm.fecha || today(),
      url: pautaForm.url.trim(),
      medio: pautaForm.medio,
      alcance: toNumber(pautaForm.alcance),
      costo: toNumber(pautaForm.costo),
      interacciones: toNumber(pautaForm.interacciones),
      ctr: toNumber(pautaForm.ctr),
      visualizaciones: toNumber(pautaForm.visualizaciones),
    };

    const { data, error } = await supabase.from("pauta").insert(pautaToDb(newRow)).select().single();

    if (error) {
      setSyncStatus(`Error guardando pauta: ${error.message}`);
      return;
    }

    const cleanPautaForm = createPautaForm(catalogos);

    setPautaRows((prev) => [pautaFromDb(data), ...prev]);
    setPautaForm(cleanPautaForm);

    try {
      localStorage.setItem("ondaexp_pautaform", JSON.stringify(cleanPautaForm));
    } catch {
      // El registro ya quedó guardado aunque no se pueda persistir el borrador local.
    }

    setSyncStatus("Contenido pautado guardado correctamente.");
  }

  const clearDateFilters = () => {
    setDateStart("");
    setDateEnd("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      try {
        localStorage.setItem("ondaexp_form", JSON.stringify(next));
      } catch {
        // El estado de React conserva el borrador aunque localStorage no esté disponible.
      }

      return next;
    });
  };

  const handlePautaChange = (field, value) => {
    setPautaForm((prev) => {
      const next = { ...prev, [field]: value };

      try {
        localStorage.setItem("ondaexp_pautaform", JSON.stringify(next));
      } catch {
        // El estado de React conserva el borrador aunque localStorage no esté disponible.
      }

      return next;
    });
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f5f7fb] text-slate-900">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 sm:tracking-[0.2em]">
                <IconActivity className="h-3.5 w-3.5" /> Plataforma de gestión diaria
              </div>
              <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Bunker Tigre</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
                {isVisualizador
                  ? "Dashboard público de seguimiento en tiempo real del impacto de la distribución del contenido en redes sociales."
                  : "Registro diario de acciones, difusión por red y consolidado ejecutivo para medir alcance e impacto por Community Manager."}
              </p>
              {isCM && (
                <div className="mt-4 max-w-sm">
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.15em] text-slate-500" htmlFor="proyecto-activo">
                    Proyecto
                  </label>
                  <select
                    id="proyecto-activo"
                    value={proyectoActivo || ""}
                    onChange={(event) => setProyectoActivo(event.target.value || null)}
                    className="input"
                    disabled={proyectos.length === 0}
                  >
                    {proyectos.length === 0 ? (
                      <option value="">Sin proyectos asignados</option>
                    ) : (
                      proyectos.map((proyecto) => (
                        <option key={proyecto.id} value={proyecto.id}>
                          {proyecto.nombre}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
            <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end lg:max-w-xl xl:max-w-none">
              {isCM && <button type="button" onClick={() => handleVistaChange("dashboard")} className={`btn-tab ${vista === "dashboard" ? "btn-tab-active" : ""}`}><IconBarChart className="h-4 w-4" /> Dashboard</button>}
              {isCM && (
                <>
                  <button type="button" onClick={() => handleVistaChange("registro")} className={`btn-tab ${vista === "registro" ? "btn-tab-active" : ""}`}><IconPlus className="h-4 w-4" /> Registrar</button>
                  <button type="button" onClick={() => handleVistaChange("tabla")} className={`btn-tab ${vista === "tabla" ? "btn-tab-active" : ""}`}><IconClipboard className="h-4 w-4" /> Consolidado</button>
                  <button type="button" onClick={() => handleVistaChange("configuracion")} className={`btn-tab ${vista === "configuracion" ? "btn-tab-active" : ""}`}><IconSettings className="h-4 w-4" /> Configuración</button>
                  <button type="button" onClick={handleCsvExport} className="btn-primary"><IconDownload className="h-4 w-4" /> CSV</button>
                </>
              )}
              {isCM && (
                <button type="button" onClick={logout} className="btn-tab text-red-600 hover:border-red-200 hover:bg-red-50" title={`Salir (${user?.email || ""})`}>
                  <IconX className="h-4 w-4" /> Salir
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full min-w-0 max-w-7xl gap-5 px-0 py-5 sm:gap-6 sm:py-6">
        {csvStatus && <div className="dashboard-shell rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{csvStatus}</div>}
        {isLoading && <div className="dashboard-shell rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">Cargando datos desde Supabase...</div>}
        {isCM && !isLoading && proyectos.length === 0 && <div className="dashboard-shell rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">Este usuario no tiene proyectos asignados.</div>}
        {syncStatus && <div className="dashboard-shell rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">{syncStatus}</div>}

        {vista === "dashboard" && (
          <div className="dashboard-shell grid gap-5 sm:gap-6">
            {isCM && (
              <section className="w-full min-w-0 max-w-full rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
                <div className="mb-4">
                  <h2 className="text-base font-black uppercase tracking-[0.15em] text-slate-900 sm:text-lg">Control de secciones</h2>
                  <p className="mt-1 text-sm text-slate-500">Activa o desactiva las secciones del dashboard según la necesidad del reporte.</p>
                </div>
                <div className="grid min-w-0 gap-3 sm:flex sm:flex-wrap">
                  <ToggleChip active={mostrarContactoDirecto} onClick={() => setMostrarContactoDirecto((prev) => !prev)} label="Contacto Directo" />
                  <ToggleChip active={mostrarContenidoPautado} onClick={() => setMostrarContenidoPautado((prev) => !prev)} label="Contenido Pautado" />
                  <ToggleChip active={mostrarConclusiones} onClick={() => setMostrarConclusiones((prev) => !prev)} label="Conclusiones Generales" />
                </div>
              </section>
            )}

            <FilterPanel query={query} setQuery={setQuery} responsable={responsable} setResponsable={setResponsable} red={red} setRed={setRed} accion={accion} setAccion={setAccion} catalogos={catalogos} placeholder="Buscar por medio, campaña, hashtag, mención, responsable o red..." dateStart={dateStart} setDateStart={setDateStart} dateEnd={dateEnd} setDateEnd={setDateEnd} clearDateFilters={clearDateFilters} />
            <OndaHero value={resumenPeriodo.ondaExpansiva} />

            <div className="flex items-center justify-between">
              {isCM && overriddenMetrics.size > 0 && (
                <button
                  type="button"
                  onClick={handleResetMetrics}
                  className="ml-auto text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                >
                  Restablecer métricas
                </button>
              )}
            </div>
            <section className="grid w-full min-w-0 max-w-full gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                title="Interacciones captadas"
                value={fmt(editableMetrics.interaccionesCaptadas)}
                rawValue={editableMetrics.interaccionesCaptadas}
                subtitle="Me gusta y reacciones"
                icon={<IconZap className="h-5 w-5" />} color="yellow"
                editable={isCM}
                onValueChange={v => {
                  setEditableMetrics(m => ({ ...m, interaccionesCaptadas: Number(v) }));
                  setOverriddenMetrics(s => new Set([...s, "interaccionesCaptadas"]));
                }}
              />
              <MetricCard
                title="Compartido"
                value={fmt(editableMetrics.compartidos)}
                rawValue={editableMetrics.compartidos}
                subtitle="Compartidos, reposts e historias"
                icon={<IconShare className="h-5 w-5" />} color="purple"
                editable={isCM}
                onValueChange={v => {
                  setEditableMetrics(m => ({ ...m, compartidos: Number(v) }));
                  setOverriddenMetrics(s => new Set([...s, "compartidos"]));
                }}
              />
              <MetricCard
                title="Comentarios"
                value={fmt(editableMetrics.comentarios)}
                rawValue={editableMetrics.comentarios}
                subtitle="Total comentarios"
                icon={<IconComment className="h-5 w-5" />} color="brown"
                editable={isCM}
                onValueChange={v => {
                  setEditableMetrics(m => ({ ...m, comentarios: Number(v) }));
                  setOverriddenMetrics(s => new Set([...s, "comentarios"]));
                }}
              />
              <MetricCard
                title="Acciones de Tropa Totales"
                value={fmt(editableMetrics.accionesTropa)}
                rawValue={editableMetrics.accionesTropa}
                subtitle="Total de acciones registradas"
                icon={<IconUserPlus className="h-5 w-5" />} color="red"
                editable={isCM}
                onValueChange={v => {
                  setEditableMetrics(m => ({ ...m, accionesTropa: Number(v) }));
                  setOverriddenMetrics(s => new Set([...s, "accionesTropa"]));
                }}
              />
              <MetricCard
                title="Seguidores captados"
                value={fmt(editableMetrics.seguidoresCaptados)}
                rawValue={editableMetrics.seguidoresCaptados}
                subtitle="Nuevos seguidores"
                icon={<IconUsers className="h-5 w-5" />} color="blue"
                editable={isCM}
                onValueChange={v => {
                  setEditableMetrics(m => ({ ...m, seguidoresCaptados: Number(v) }));
                  setOverriddenMetrics(s => new Set([...s, "seguidoresCaptados"]));
                }}
              />
            </section>

            <section className="grid w-full min-w-0 max-w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Reproducciones de Video registradas" value={fmt(kpis.totalOnda)} subtitle="Total de reproducciones de videos" icon={<IconNetwork className="h-6 w-6" />} />
              <KpiCard title="Contenidos realizados" value={fmt(kpis.contenidos)} subtitle="Creación de contenido" icon={<IconMegaphone className="h-6 w-6" />} tone="blue" />
              <KpiCard title="Contenidos difundidos" value={fmt(kpis.difundidos)} subtitle="Siembra y amplificación" icon={<IconRadio className="h-6 w-6" />} tone="green" />
              <KpiCard title="Redes activas" value={fmt(kpis.redesActivas)} subtitle="Canales con actividad" icon={<IconUsers className="h-6 w-6" />} tone="orange" />
            </section>

            <section className="grid w-full min-w-0 max-w-full gap-5 xl:grid-cols-2">
              <ChartCard title="Reproducciones de Video por Community Manager" subtitle="Total acumulado por responsable">
                {ondaPorCm.length === 0 ? <EmptyState text="No hay acciones registradas por responsable." /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={ondaPorCm} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => fmt(value)} contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Acciones por red" subtitle="Distribución de publicaciones y siembras">
                {accionesPorRed.length === 0 ? <EmptyState text="No hay acciones registradas por red." /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={accionesPorRed} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} label>
                        {accionesPorRed.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Evolución diaria de Reproducciones de Video" subtitle="Comportamiento por fecha registrada">
                {ondaPorFecha.length === 0 ? <EmptyState text="No hay evolución diaria para mostrar." /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={ondaPorFecha} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ondaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip formatter={(value) => fmt(value)} contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }} />
                      <Area type="monotone" dataKey="onda" stroke="#16a34a" strokeWidth={3} fill="url(#ondaGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Acciones por tipo" subtitle="Qué está haciendo el equipo diariamente">
                {accionesPorTipo.length === 0 ? <EmptyState text="No hay acciones por tipo registradas." /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={accionesPorTipo} layout="vertical" margin={{ top: 16, right: 20, left: 16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={125} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </section>

            {mostrarContactoDirecto && <ContactoDirectoSection data={CONTACTO_DIRECTO_BASE} />}
            {mostrarContenidoPautado && <ContenidoPautadoSection rows={filteredPautaRows} form={pautaForm} catalogos={catalogos} onChange={handlePautaChange} onAdd={handleAddPauta} onDelete={deletePautaRow} resumen={pautaResumen} readOnly={isReadOnly} />}
            {mostrarConclusiones && (
              <ConclusionesSection
                rows={conclusionesPeriodo}
                dateStart={dateStart}
                dateEnd={dateEnd}
                selectedDate={fechaConclusiones}
                draft={borradorConclusiones}
                openConfig={mostrarConfigConclusiones}
                onToggleConfig={() => {
                  setMostrarConfigConclusiones((prev) => !prev);
                  setBorradorConclusiones(safeArray(conclusionesPorFecha[fechaConclusiones]).join("\n"));
                }}
                onDateChange={handleConclusionDateChange}
                onDraftChange={setBorradorConclusiones}
                onSave={handleSaveConclusiones}
                readOnly={isReadOnly}
              />
            )}
          </div>
        )}

        {vista === "registro" && (
          <div className="dashboard-shell">
            <RegistroForm form={form} handleChange={handleChange} handleSubmit={handleSubmit} catalogos={catalogos} />
          </div>
        )}

        {vista === "tabla" && (
          <div className="dashboard-shell grid gap-5 sm:gap-6">
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem]">
              <div className="mb-4">
                <h2 className="text-xl font-black sm:text-2xl">Consolidado</h2>
                <p className="text-sm text-slate-500">Consulta, filtra y exporta las acciones registradas.</p>
              </div>
              <FilterPanel query={query} setQuery={setQuery} responsable={responsable} setResponsable={setResponsable} red={red} setRed={setRed} accion={accion} setAccion={setAccion} catalogos={catalogos} placeholder="Buscar en el consolidado..." dateStart={dateStart} setDateStart={setDateStart} dateEnd={dateEnd} setDateEnd={setDateEnd} clearDateFilters={clearDateFilters} />
            </section>

            <ConsolidadoTable rows={filteredRows} removeRow={deleteRow} onEditRow={setEditRow} />
            <EditModal open={!!editRow} row={editRow} onClose={() => setEditRow(null)} onSave={handleSaveEdit} catalogos={catalogos} />
          </div>
        )}

        {vista === "configuracion" && (
          <div className="dashboard-shell">
            <ConfiguracionSection catalogos={catalogos} onRename={renameCatalogItem} onAdd={addCatalogItem} onRemove={removeCatalogItem} onReset={resetCatalogos} configMessage={configMessage} />
          </div>
        )}
      </main>
    </div>
  );
}
