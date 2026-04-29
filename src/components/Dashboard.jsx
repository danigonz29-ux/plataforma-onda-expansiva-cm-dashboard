import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
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

const CHART_COLORS = [
  "#0f172a",
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
];

const CATALOGOS_BASE = {
  responsables: ["CM 1", "CM 2", "CM 3", "CM 4", "CM 5"],
  acciones: [
    "Creación de contenido",
    "Difusión",
    "Sembrado de opinión",
    "Apoyo redes",
    "Monitoreo",
    "Cobertura",
    "Comentario",
    "Retweet / Repost",
    "Historia",
  ],
  redes: ["Facebook", "Instagram", "TikTok", "X", "YouTube", "LinkedIn", "WhatsApp", "Landing"],
  campanas: [
    "Seguridad",
    "Economía",
    "Salud",
    "Propuestas",
    "Opinión presidencial",
    "Tutela",
    "Campaña",
    "Gestión institucional",
  ],
  estadosGrupo: ["Activo", "Pendiente", "Revisión", "Publicado", "Descartado"],
  mediosPauta: ["Facebook", "Instagram", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Google Ads", "Landing"],
};

const CONTACTO_DIRECTO_BASE = {
  diasCampana: 0,
  sms: { enviosDiarios: 0, frecuencia: "", total: 0, costoTotal: 0 },
  llamadas: { realizadas: 0, frecuencia: "", total: 0, costoTotal: 0 },
};

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergeCatalogos(value) {
  const parsed = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return Object.fromEntries(
    Object.entries(CATALOGOS_BASE).map(([key, fallback]) => {
      const items = Array.isArray(parsed[key]) && parsed[key].length ? parsed[key] : fallback;

      return [
        key,
        Array.from(
          new Set(
            items
              .map(String)
              .map((item) => item.trim())
              .filter(Boolean)
          )
        ),
      ];
    })
  );
}

function createForm(catalogos = CATALOGOS_BASE) {
  return {
    fecha: today(),
    responsable: catalogos.responsables[0] || "",
    accion: catalogos.acciones[1] || catalogos.acciones[0] || "",
    cliente: "Cliente / Marca",
    red: catalogos.redes[0] || "",
    perfilGrupo: "",
    linkPerfil: "",
    linkPublicacion: "",
    hashtag1: "",
    hashtag2: "",
    mencion: "",
    tema: catalogos.campanas[0] || "",
    estado: catalogos.estadosGrupo[0] || "",
    perfilDifusion: "",
    alcance: "",
    meGusta: "",
    comentarios: "",
    compartidos: "",
    retweets: "",
    historias: "",
    seguidores: "",
    notas: "",
  };
}

function createPautaForm(catalogos = CATALOGOS_BASE) {
  return {
    fecha: today(),
    url: "",
    medio: catalogos.mediosPauta[0] || "",
    alcance: "",
    costo: "",
    interacciones: "",
    ctr: "",
    visualizaciones: "",
  };
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rowFromDb(row) {
  return {
    id: row.id,
    fecha: row.fecha || today(),
    responsable: row.responsable || "",
    accion: row.accion || "",
    cliente: row.cliente || "",
    red: row.red || "",
    perfilGrupo: row.perfil_grupo || "",
    linkPerfil: row.link_perfil || "",
    linkPublicacion: row.link_publicacion || "",
    hashtag1: row.hashtag1 || "",
    hashtag2: row.hashtag2 || "",
    mencion: row.mencion || "",
    tema: row.tema || "",
    estado: row.estado || "",
    perfilDifusion: row.perfil_difusion || "",
    alcance: toNumber(row.alcance),
    meGusta: toNumber(row.me_gusta),
    comentarios: toNumber(row.comentarios),
    compartidos: toNumber(row.compartidos),
    retweets: toNumber(row.retweets),
    historias: toNumber(row.historias),
    seguidores: toNumber(row.seguidores),
    notas: row.notas || "",
  };
}

function rowToDb(row, includeId = false) {
  const payload = {
    fecha: row.fecha,
    responsable: row.responsable,
    accion: row.accion,
    cliente: row.cliente,
    red: row.red,
    perfil_grupo: row.perfilGrupo,
    link_perfil: row.linkPerfil,
    link_publicacion: row.linkPublicacion,
    hashtag1: row.hashtag1,
    hashtag2: row.hashtag2,
    mencion: row.mencion,
    tema: row.tema,
    estado: row.estado,
    perfil_difusion: row.perfilDifusion,
    alcance: toNumber(row.alcance),
    me_gusta: toNumber(row.meGusta),
    comentarios: toNumber(row.comentarios),
    compartidos: toNumber(row.compartidos),
    retweets: toNumber(row.retweets),
    historias: toNumber(row.historias),
    seguidores: toNumber(row.seguidores),
    notas: row.notas,
  };

  if (includeId && row.id) {
    payload.id = row.id;
  }

  return payload;
}

function pautaFromDb(row) {
  return {
    id: row.id,
    fecha: row.fecha || today(),
    url: row.url || "",
    medio: row.medio || "",
    alcance: toNumber(row.alcance),
    costo: toNumber(row.costo),
    interacciones: toNumber(row.interacciones),
    ctr: toNumber(row.ctr),
    visualizaciones: toNumber(row.visualizaciones),
  };
}

function pautaToDb(row, includeId = false) {
  const payload = {
    fecha: row.fecha,
    url: row.url,
    medio: row.medio,
    alcance: toNumber(row.alcance),
    costo: toNumber(row.costo),
    interacciones: toNumber(row.interacciones),
    ctr: toNumber(row.ctr),
    visualizaciones: toNumber(row.visualizaciones),
  };

  if (includeId && row.id) {
    payload.id = row.id;
  }

  return payload;
}

function catalogosFromDb(rows) {
  const parsed = {};

  safeArray(rows).forEach((row) => {
    parsed[row.categoria] = safeArray(row.items);
  });

  return mergeCatalogos(parsed);
}

function catalogosToDb(catalogos) {
  return Object.entries(catalogos).map(([categoria, items]) => ({
    categoria,
    items: safeArray(items),
  }));
}

function conclusionesFromDb(rows) {
  return Object.fromEntries(
    safeArray(rows).map((row) => [row.fecha, safeArray(row.conclusiones)])
  );
}

function fmt(value) {
  return new Intl.NumberFormat("es-CO").format(Math.round(toNumber(value)));
}

function fmtMoney(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function fmtPct(value) {
  return `${toNumber(value).toFixed(1)}%`;
}

function getOnda(row) {
  return (
    toNumber(row.alcance) +
    toNumber(row.meGusta) +
    toNumber(row.comentarios) +
    toNumber(row.compartidos) +
    toNumber(row.retweets) +
    toNumber(row.historias)
  );
}

function groupBy(rows, key, valueFn = () => 1) {
  const map = new Map();

  rows.forEach((row) => {
    const name = row[key] || "Sin dato";
    map.set(name, (map.get(name) || 0) + valueFn(row));
  });

  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function escapeCsvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsv(rows) {
  const headers = [
    "fecha",
    "responsable",
    "accion",
    "cliente",
    "red",
    "perfilGrupo",
    "linkPerfil",
    "linkPublicacion",
    "hashtag1",
    "hashtag2",
    "mencion",
    "campana",
    "estadoEnGrupos",
    "perfilDifusion",
    "alcance",
    "meGusta",
    "comentarios",
    "compartidos",
    "retweets",
    "historias",
    "seguidores",
    "ondaExpansiva",
    "notas",
  ];

  const lines = rows.map((row) =>
    headers
      .map((header) => {
        if (header === "ondaExpansiva") return escapeCsvCell(getOnda(row));
        if (header === "campana") return escapeCsvCell(row.tema);
        if (header === "estadoEnGrupos") return escapeCsvCell(row.estado);
        return escapeCsvCell(row[header]);
      })
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

function downloadCsv(rows) {
  try {
    const blob = new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "acciones_onda_expansiva.csv";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function IconBase({ children, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconPlus({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

function IconUsers({ className }) {
  return (
    <IconBase className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}

function IconRadio({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
      <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
    </IconBase>
  );
}

function IconMegaphone({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 11v2" />
      <path d="M6 10v4" />
      <path d="M11 8l8-4v16l-8-4H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h5z" />
      <path d="M11 16l1.5 4" />
    </IconBase>
  );
}

function IconNetwork({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4" />
      <path d="M12 11L6.5 17" />
      <path d="M12 11l5.5 6" />
    </IconBase>
  );
}

function IconDownload({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </IconBase>
  );
}

function IconSearch({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </IconBase>
  );
}

function IconCalendar({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

function IconTrash({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconBase>
  );
}

function IconBarChart({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 3v18h18" />
      <path d="M8 17V9" />
      <path d="M13 17V5" />
      <path d="M18 17v-7" />
    </IconBase>
  );
}

function IconClipboard({ className }) {
  return (
    <IconBase className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5h6" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </IconBase>
  );
}

function IconActivity({ className }) {
  return (
    <IconBase className={className}>
      <path d="M22 12h-4l-3 7-4-14-3 7H2" />
    </IconBase>
  );
}

function IconZap({ className }) {
  return (
    <IconBase className={className}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </IconBase>
  );
}

function IconShare({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98" />
      <path d="M15.41 6.51L8.59 10.49" />
    </IconBase>
  );
}

function IconComment({ className }) {
  return (
    <IconBase className={className}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

function IconUserPlus({ className }) {
  return (
    <IconBase className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </IconBase>
  );
}

function IconMessage({ className }) {
  return (
    <IconBase className={className}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

function IconPhone({ className }) {
  return (
    <IconBase className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72l.38 2.57a2 2 0 0 1-.57 1.72l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 1.72-.57l2.57.38A2 2 0 0 1 22 16.92z" />
    </IconBase>
  );
}

function IconLink({ className }) {
  return (
    <IconBase className={className}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 20" />
    </IconBase>
  );
}

function IconFileText({ className }) {
  return (
    <IconBase className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </IconBase>
  );
}

function IconEye({ className }) {
  return (
    <IconBase className={className}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

function IconMousePointer({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 3l7 17 2-7 7-2L3 3z" />
    </IconBase>
  );
}

function IconSettings({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H4a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.13 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.33.59.6 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-.51 1z" />
    </IconBase>
  );
}

function IconForNetwork({ red }) {
  const className = "inline-flex h-4 w-4 shrink-0 items-center justify-center font-black";

  if (red === "Facebook") return <span className={className}>f</span>;
  if (red === "Instagram") return <span className={className}>◎</span>;
  if (red === "TikTok") return <span className={className}>♪</span>;
  if (red === "X" || red === "Twitter/X") return <span className={className}>𝕏</span>;

  return <IconRadio className="h-4 w-4 shrink-0" />;
}

function KpiCard({ title, value, subtitle, icon, tone = "dark" }) {
  const tones = {
    dark: "from-slate-950 to-slate-800 text-white",
    blue: "from-blue-700 to-blue-500 text-white",
    green: "from-emerald-700 to-emerald-500 text-white",
    orange: "from-orange-600 to-amber-500 text-white",
  };

  return (
    <div className={`rounded-[1.35rem] bg-gradient-to-br ${tones[tone] || tones.dark} p-4 shadow-lg shadow-slate-200 sm:rounded-[1.6rem] sm:p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 sm:text-sm sm:normal-case sm:tracking-normal">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
            {value}
          </p>
          <p className="mt-1 text-xs opacity-75">{subtitle}</p>
        </div>

        <div className="rounded-2xl bg-white/15 p-3">{icon}</div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color }) {
  const colors = {
    yellow: "bg-[#ffcc13] text-[#7a4100]",
    purple: "bg-[#b979f2] text-white",
    brown: "bg-[#812d14] text-white",
    red: "bg-[#e32227] text-white",
  };

  return (
    <div className={`relative min-h-[170px] overflow-hidden rounded-[1.35rem] ${colors[color] || colors.red} p-5 shadow-lg shadow-slate-200 sm:rounded-[1.6rem] sm:p-6`}>
      <div className="absolute right-4 top-4 rounded-xl bg-white/15 p-3 sm:right-5 sm:top-5">
        {icon}
      </div>
      <p className="max-w-[78%] text-[0.68rem] font-black uppercase tracking-[0.2em] opacity-80 sm:text-xs sm:tracking-[0.24em]">
        {title}
      </p>
      <p className="mt-10 text-center text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
        {value}
      </p>
      <div className="my-3 border-t border-dashed border-current opacity-25" />
      <p className="text-sm font-semibold opacity-70">{subtitle}</p>
    </div>
  );
}

function MiniKpi({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
          {title}
        </p>
        <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">{icon}</div>
      </div>
      <p className="text-xl font-black text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function OndaHero({ value }) {
  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white px-5 py-8 shadow-sm sm:rounded-[2rem] sm:px-6 sm:py-10 md:px-10 md:py-14">
      <div className="absolute right-[-90px] top-[-90px] h-48 w-48 rounded-full border-[16px] border-red-100 sm:h-52 sm:w-52 sm:border-[18px]" />
      <div className="absolute right-[12px] top-[-62px] h-32 w-32 rounded-full border-[12px] border-yellow-100 sm:right-[60px] sm:top-[-50px] sm:h-36 sm:w-36 sm:border-[14px]" />

      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-[#ffcc13] text-[#7a4100] sm:h-11 sm:w-11">
          <IconZap className="h-6 w-6" />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-[#d7193f] sm:text-sm sm:tracking-[0.3em]">
          Onda Expansiva
        </span>
      </div>

      <div className="relative mt-8 text-center sm:mt-10">
        <p className="break-words text-5xl font-black tracking-tight text-[#d7193f] sm:text-6xl md:text-8xl">
          {fmt(value)}
        </p>
        <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 sm:text-sm md:text-base md:tracking-[0.2em]">
          Alcance estimado total
        </p>
      </div>
    </section>
  );
}

function ToggleChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-black transition sm:w-auto ${
        active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"
      }`}
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
        <h2 className="text-base font-black uppercase tracking-[0.16em] text-slate-900 sm:text-xl sm:tracking-[0.18em]">
          {title}
        </h2>
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
    <label className="grid gap-1.5 text-sm font-black text-slate-700">
      {label}
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-slate-500 focus:bg-white"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
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
            <span className="rounded-xl border border-slate-200 px-4 py-1 text-xl font-black text-slate-800 sm:text-2xl">
              {data.diasCampana}
            </span>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
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
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[1.8rem] sm:p-6">
      <div className="mb-6 flex items-center gap-3 sm:mb-7">
        <div className="rounded-2xl bg-red-50 p-4 text-[#d7193f]">{icon}</div>
        <h3 className="text-xl font-black text-slate-900 sm:text-2xl">{title}</h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">{labelA}</p>
          <p className="mt-2 text-3xl font-black text-[#2b1719] sm:mt-3 sm:text-4xl">{valueA}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 sm:text-sm">{labelB}</p>
          <p className="mt-2 text-xl font-black text-[#2b1719] sm:mt-3 sm:text-2xl">{valueB}</p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl bg-[#f5f0e8] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-base text-slate-500 sm:text-xl">{footerLabel}</span>
          <span className="text-2xl font-black text-[#2b1719] sm:text-3xl">{footerValue}</span>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-lg text-slate-500 sm:text-2xl">{totalLabel}</span>
        <span className="text-2xl font-black text-[#2b1719] sm:text-3xl">{totalValue}</span>
      </div>
    </div>
  );
}

function ContenidoPautadoSection({ rows, form, catalogos, onChange, onAdd, onDelete, resumen }) {
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

      <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-4 sm:rounded-[1.8rem]">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-white p-3 text-[#d7193f] shadow-sm">
            <IconLink className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Links</h3>
        </div>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[150px_2fr_160px_130px_130px_150px_110px_160px_auto]">
          <input type="date" value={form.fecha} onChange={(event) => onChange("fecha", event.target.value)} className="input" />
          <input value={form.url} onChange={(event) => onChange("url", event.target.value)} className="input lg:col-span-2 xl:col-span-1" placeholder="https://..." />

          <select value={form.medio} onChange={(event) => onChange("medio", event.target.value)} className="input">
            {catalogos.mediosPauta.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input type="number" min="0" value={form.alcance} onChange={(event) => onChange("alcance", event.target.value)} className="input" placeholder="Alcance" />
          <input type="number" min="0" value={form.costo} onChange={(event) => onChange("costo", event.target.value)} className="input" placeholder="Costo" />
          <input type="number" min="0" value={form.interacciones} onChange={(event) => onChange("interacciones", event.target.value)} className="input" placeholder="Interacciones" />
          <input type="number" min="0" step="0.1" value={form.ctr} onChange={(event) => onChange("ctr", event.target.value)} className="input" placeholder="CTR" />
          <input type="number" min="0" value={form.visualizaciones} onChange={(event) => onChange("visualizaciones", event.target.value)} className="input" placeholder="Visualizaciones" />

          <button type="button" onClick={onAdd} className="btn-danger">
            <IconPlus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[1260px] text-left text-sm">
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
              <th className="px-4 py-4"></th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                  No hay links registrados.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-t border-slate-100`}>
                  <td className="px-4 py-4 font-bold">{row.fecha}</td>
                  <td className="max-w-[360px] truncate px-4 py-4">
                    <a href={row.url} target="_blank" rel="noreferrer" className="font-medium text-[#d7193f] hover:underline">
                      {row.url}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700">
                      {row.medio}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">{fmt(row.alcance)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmtMoney(row.costo)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmt(row.interacciones)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmtPct(row.ctr)}</td>
                  <td className="px-4 py-4 text-right font-semibold">{fmt(row.visualizaciones)}</td>
                  <td className="px-4 py-4 text-right">
                    <button type="button" onClick={() => onDelete(row.id)} className="inline-flex items-center rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <IconTrash className="h-4 w-4" />
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

function ConclusionesSection({
  rows,
  dateStart,
  dateEnd,
  selectedDate,
  draft,
  openConfig,
  onToggleConfig,
  onDateChange,
  onDraftChange,
  onSave,
}) {
  const label = dateStart && dateEnd ? `Periodo ${dateStart} a ${dateEnd}` : dateStart ? `Desde ${dateStart}` : dateEnd ? `Hasta ${dateEnd}` : "Todas las fechas";

  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <SectionTitle
        icon={<IconFileText className="h-5 w-5" />}
        title="Conclusiones Generales"
        badge={
          <button type="button" onClick={onToggleConfig} className="btn-tab">
            <IconSettings className="h-4 w-4" /> Configurar por fecha
          </button>
        }
      />

      <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-500">
        {label}
      </div>

      {openConfig && (
        <div className="mb-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
            <Field label="Fecha de conclusiones">
              <input type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="input" />
            </Field>

            <Field label="Conclusiones">
              <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} className="input min-h-28" placeholder="Escribe una conclusión por línea para esta fecha." />
            </Field>

            <button type="button" onClick={onSave} className="btn-primary">
              Guardar conclusiones
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {rows.length === 0 ? (
          <EmptyState text="No hay conclusiones registradas para el periodo seleccionado." />
        ) : (
          rows.map((item, index) => (
            <div key={`${index}-${item}`} className="flex flex-col gap-4 rounded-[1.35rem] border border-slate-200 bg-[#fffdfb] px-5 py-6 sm:flex-row sm:items-center sm:gap-5 sm:rounded-[1.6rem] sm:px-6 sm:py-7">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg font-black text-[#d7193f] sm:h-11 sm:w-11 sm:text-xl">
                {index + 1}
              </div>
              <p className="text-base text-slate-900 sm:text-xl md:text-2xl">{item}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FilterPanel({
  query,
  setQuery,
  responsable,
  setResponsable,
  red,
  setRed,
  accion,
  setAccion,
  catalogos,
  placeholder,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd,
  clearDateFilters,
}) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem]">
      <div className="grid gap-3 lg:grid-cols-[1.3fr_180px_180px_220px]">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-3.5 text-slate-400">
            <IconSearch className="h-4 w-4" />
          </span>

          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-slate-500 focus:bg-white" />
        </div>

        <FilterSelect value={responsable} onChange={setResponsable} options={["Todos", ...catalogos.responsables]} />
        <FilterSelect value={red} onChange={setRed} options={["Todas", ...catalogos.redes]} />
        <FilterSelect value={accion} onChange={setAccion} options={["Todas", ...catalogos.acciones]} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Fecha inicial">
          <input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="input" />
        </Field>

        <Field label="Fecha final">
          <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="input" />
        </Field>

        <button type="button" onClick={clearDateFilters} className="btn-tab">
          Limpiar fechas
        </button>
      </div>
    </section>
  );
}

function RegistroForm({ form, handleChange, handleSubmit, catalogos }) {
  return (
    <form onSubmit={handleSubmit} className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <IconPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Registrar acción diaria</h2>
          <p className="text-sm text-slate-500">Formulario único para que cada CM diligencie sus acciones del día.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <input value={form.linkPerfil} onChange={(event) => handleChange("linkPerfil", event.target.value)} className="input" placeholder="https://..." />
        </Field>

        <Field label="Link de la publicación">
          <input value={form.linkPublicacion} onChange={(event) => handleChange("linkPublicacion", event.target.value)} className="input" placeholder="https://..." />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
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

function ConsolidadoTable({ rows, removeRow }) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Consolidado de acciones</h2>
          <p className="text-sm text-slate-500">Base maestra lista para exportar, auditar o conectar a Looker Studio.</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
          <IconCalendar className="h-4 w-4" /> {fmt(rows.length)} registros
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="bg-slate-950 text-xs uppercase tracking-wide text-white">
              <th className="px-3 py-3">Fecha</th>
              <th className="px-3 py-3">Responsable</th>
              <th className="px-3 py-3">Acción</th>
              <th className="px-3 py-3">Red</th>
              <th className="px-3 py-3">Medio / perfil / grupo</th>
              <th className="px-3 py-3">Campaña</th>
              <th className="px-3 py-3 text-right">Alcance</th>
              <th className="px-3 py-3 text-right">Onda expansiva</th>
              <th className="px-3 py-3 text-right">Seguidores</th>
              <th className="px-3 py-3">Estado en Grupos</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                  No hay acciones registradas.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-100 hover:bg-blue-50/60`}>
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
                  <td className="px-3 py-3 text-right text-base font-black text-blue-700">{fmt(getOnda(row))}</td>
                  <td className="px-3 py-3 text-right">{fmt(row.seguidores)}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                      {row.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" onClick={() => removeRow(row.id)} className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-slate-400 hover:bg-red-50 hover:text-red-600">
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

          <button type="button" onClick={onReset} className="btn-tab">
            Restaurar base
          </button>
        </div>

        {configMessage && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
            {configMessage}
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map(([title, description, category]) => (
          <CatalogManager
            key={category}
            title={title}
            description={description}
            items={catalogos[category]}
            category={category}
            onRename={onRename}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
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
          <div key={`${category}-${item}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input value={item} onChange={(event) => onRename(category, index, event.target.value)} className="input" />
            <button type="button" onClick={() => onRemove(category, item)} className="rounded-2xl border border-red-100 px-4 py-2 text-sm font-black text-red-600 hover:bg-red-50">
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input value={newItem} onChange={(event) => setNewItem(event.target.value)} className="input" placeholder={`Nuevo valor para ${title.toLowerCase()}`} />
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
  const [catalogos, setCatalogos] = useState(() => mergeCatalogos(CATALOGOS_BASE));
  const [rows, setRows] = useState([]);
  const [pautaRows, setPautaRows] = useState([]);
  const [form, setForm] = useState(() => createForm(CATALOGOS_BASE));
  const [pautaForm, setPautaForm] = useState(() => createPautaForm(CATALOGOS_BASE));
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");

  const [query, setQuery] = useState("");
  const [responsable, setResponsable] = useState("Todos");
  const [red, setRed] = useState("Todas");
  const [accion, setAccion] = useState("Todas");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [vista, setVista] = useState("dashboard");

  const [mostrarContactoDirecto, setMostrarContactoDirecto] = useState(true);
  const [mostrarContenidoPautado, setMostrarContenidoPautado] = useState(true);
  const [mostrarConclusiones, setMostrarConclusiones] = useState(true);

  const [conclusionesPorFecha, setConclusionesPorFecha] = useState({});
  const [mostrarConfigConclusiones, setMostrarConfigConclusiones] = useState(false);
  const [fechaConclusiones, setFechaConclusiones] = useState(today());
  const [borradorConclusiones, setBorradorConclusiones] = useState("");

  const [csvStatus, setCsvStatus] = useState("");
  const [configMessage, setConfigMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      setSyncStatus("");

      try {
        const [accionesResult, pautaResult, catalogosResult, conclusionesResult] = await Promise.all([
          supabase.from("acciones").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }),
          supabase.from("pauta").select("*").order("fecha", { ascending: false }).order("created_at", { ascending: false }),
          supabase.from("catalogos").select("*").order("categoria", { ascending: true }),
          supabase.from("conclusiones").select("*").order("fecha", { ascending: true }),
        ]);

        // Diagnóstico detallado por tabla
        const errors = [];
        if (accionesResult.error) errors.push(`acciones: ${accionesResult.error.message} (${accionesResult.error.code})`);
        if (pautaResult.error) errors.push(`pauta: ${pautaResult.error.message} (${pautaResult.error.code})`);
        if (catalogosResult.error) errors.push(`catalogos: ${catalogosResult.error.message} (${catalogosResult.error.code})`);
        if (conclusionesResult.error) errors.push(`conclusiones: ${conclusionesResult.error.message} (${conclusionesResult.error.code})`);

        if (errors.length > 0) {
          if (mounted) {
            setSyncStatus(`Error en tablas: ${errors.join(" | ")}`);
            setIsLoading(false);
          }
          return;
        }

        // Detectar posible problema de RLS (tablas vacías sin error)
        const warnings = [];
        if (safeArray(accionesResult.data).length === 0) warnings.push("acciones");
        if (safeArray(pautaResult.data).length === 0) warnings.push("pauta");
        if (safeArray(catalogosResult.data).length === 0) warnings.push("catalogos");

        const nextCatalogos = catalogosFromDb(catalogosResult.data);

        if (mounted) {
          setCatalogos(nextCatalogos);
          setRows(safeArray(accionesResult.data).map(rowFromDb));
          setPautaRows(safeArray(pautaResult.data).map(pautaFromDb));
          setConclusionesPorFecha(conclusionesFromDb(conclusionesResult.data));
          setForm(createForm(nextCatalogos));
          setPautaForm(createPautaForm(nextCatalogos));
          setIsLoading(false);

          if (warnings.length > 0 && warnings.length >= 3) {
            setSyncStatus(
              `Advertencia: Las tablas [${warnings.join(", ")}] están vacías. ` +
              `Si ya registraste datos, verifica que RLS (Row Level Security) esté desactivado ` +
              `o que tengas policies configuradas en Supabase.`
            );
          }
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
        if (mounted) {
          setSyncStatus(`Error de conexión con Supabase: ${err.message}. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.`);
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
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
    () =>
      pautaRows.filter(
        (row) =>
          (!dateStart || String(row.fecha || "") >= dateStart) &&
          (!dateEnd || String(row.fecha || "") <= dateEnd)
      ),
    [pautaRows, dateStart, dateEnd]
  );

  const resumenPeriodo = useMemo(() => {
    const comentarios = filteredRows.reduce((sum, row) => sum + toNumber(row.comentarios), 0);

    const compartidos = filteredRows.reduce(
      (sum, row) =>
        sum +
        toNumber(row.compartidos) +
        toNumber(row.retweets) +
        toNumber(row.historias),
      0
    );

    const interaccionesCaptadas = filteredRows.reduce(
      (sum, row) =>
        sum +
        toNumber(row.meGusta) +
        toNumber(row.comentarios) +
        toNumber(row.compartidos) +
        toNumber(row.retweets) +
        toNumber(row.historias),
      0
    );

    const seguidoresCaptados = filteredRows.reduce((sum, row) => sum + toNumber(row.seguidores), 0);
    const ondaExpansiva = filteredRows.reduce((sum, row) => sum + getOnda(row), 0);

    return {
      ondaExpansiva,
      interaccionesCaptadas,
      compartidos,
      comentarios,
      seguidoresCaptados,
    };
  }, [filteredRows]);

  const kpis = useMemo(
    () => ({
      totalOnda: resumenPeriodo.ondaExpansiva,
      contenidos: filteredRows.filter((row) => row.accion === "Creación de contenido").length,
      difundidos: filteredRows.filter((row) => row.accion !== "Creación de contenido").length,
      redesActivas: new Set(filteredRows.map((row) => row.red)).size,
    }),
    [filteredRows, resumenPeriodo.ondaExpansiva]
  );

  const accionesPorRed = useMemo(() => groupBy(filteredRows, "red"), [filteredRows]);
  const ondaPorCm = useMemo(() => groupBy(filteredRows, "responsable", getOnda), [filteredRows]);
  const accionesPorTipo = useMemo(() => groupBy(filteredRows, "accion"), [filteredRows]);

  const ondaPorFecha = useMemo(
    () =>
      groupBy(filteredRows, "fecha", getOnda)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map((item) => ({ fecha: item.name, onda: item.value })),
    [filteredRows]
  );

  const pautaResumen = useMemo(() => {
    const alcance = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.alcance), 0);
    const costo = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.costo), 0);
    const interacciones = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.interacciones), 0);
    const visualizaciones = filteredPautaRows.reduce((sum, row) => sum + toNumber(row.visualizaciones), 0);
    const ctr = filteredPautaRows.length
      ? filteredPautaRows.reduce((sum, row) => sum + toNumber(row.ctr), 0) / filteredPautaRows.length
      : 0;

    return {
      alcance,
      costo,
      interacciones,
      visualizaciones,
      ctr,
    };
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
    setCatalogos(nextCatalogos);

    try {
      const { error } = await supabase
        .from("catalogos")
        .upsert(catalogosToDb(nextCatalogos), { onConflict: "categoria" });

      if (error) {
        console.error("Supabase catalogos upsert error:", error);

        if (error.code === "42501") {
          setSyncStatus("Error de permisos: RLS activo en 'catalogos'. Desactiva RLS o agrega policies.");
        } else if (error.code === "23505" || error.message.includes("unique") || error.message.includes("duplicate")) {
          setSyncStatus("Error: La columna 'categoria' necesita un constraint UNIQUE en Supabase.");
        } else {
          setSyncStatus(`Error guardando catálogos: ${error.message} (${error.code || "N/A"})`);
        }

        return false;
      }

      return true;
    } catch (err) {
      console.error("Unexpected catalogos error:", err);
      setSyncStatus(`Error inesperado en catálogos: ${err.message}`);
      return false;
    }
  }

  async function deleteRow(id) {
    const { error } = await supabase.from("acciones").delete().eq("id", id);

    if (error) {
      setSyncStatus(`Error eliminando acción: ${error.message}`);
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    setSyncStatus("Acción eliminada correctamente.");
  }

  async function deletePautaRow(id) {
    const { error } = await supabase.from("pauta").delete().eq("id", id);

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

    const nextItems = catalogos[category].map((item, itemIndex) =>
      itemIndex === index ? cleanValue : item
    );

    const nextCatalogos = {
      ...catalogos,
      [category]: Array.from(new Set(nextItems)),
    };

    const fieldMap = {
      responsables: "responsable",
      acciones: "accion",
      redes: "red",
      campanas: "tema",
      estadosGrupo: "estado",
    };

    const ok = await persistCatalogos(nextCatalogos);
    if (!ok) return;

    if (fieldMap[category]) {
      const field = fieldMap[category];

      setRows((prev) =>
        prev.map((row) => (row[field] === oldValue ? { ...row, [field]: cleanValue } : row))
      );

      const { error } = await supabase
        .from("acciones")
        .update({ [field]: cleanValue })
        .eq(field, oldValue);

      if (error) {
        setSyncStatus(`Error actualizando acciones: ${error.message}`);
        return;
      }
    }

    if (category === "mediosPauta") {
      setPautaRows((prev) =>
        prev.map((row) => (row.medio === oldValue ? { ...row, medio: cleanValue } : row))
      );

      const { error } = await supabase
        .from("pauta")
        .update({ medio: cleanValue })
        .eq("medio", oldValue);

      if (error) {
        setSyncStatus(`Error actualizando pauta: ${error.message}`);
        return;
      }
    }

    setForm((prev) =>
      fieldMap[category] && prev[fieldMap[category]] === oldValue
        ? { ...prev, [fieldMap[category]]: cleanValue }
        : prev
    );

    setPautaForm((prev) =>
      category === "mediosPauta" && prev.medio === oldValue
        ? { ...prev, medio: cleanValue }
        : prev
    );

    setConfigMessage("Configuración actualizada.");
    setSyncStatus("Configuración guardada en Supabase.");
  }

  async function addCatalogItem(category, value) {
    const cleanValue = value.trim();
    if (!cleanValue || !catalogos[category]) return;

    const nextCatalogos = {
      ...catalogos,
      [category]: Array.from(new Set([...catalogos[category], cleanValue])),
    };

    const ok = await persistCatalogos(nextCatalogos);
    if (!ok) return;

    setConfigMessage("Elemento agregado.");
    setSyncStatus("Catálogo actualizado en Supabase.");
  }

  async function removeCatalogItem(category, value) {
    if (!catalogos[category] || catalogos[category].length <= 1) return;

    const nextItems = catalogos[category].filter((item) => item !== value);
    const fallback = nextItems[0] || "";

    const nextCatalogos = {
      ...catalogos,
      [category]: nextItems,
    };

    const fieldMap = {
      responsables: "responsable",
      acciones: "accion",
      redes: "red",
      campanas: "tema",
      estadosGrupo: "estado",
    };

    const ok = await persistCatalogos(nextCatalogos);
    if (!ok) return;

    if (fieldMap[category]) {
      const field = fieldMap[category];

      setRows((prev) =>
        prev.map((row) => (row[field] === value ? { ...row, [field]: fallback } : row))
      );

      const { error } = await supabase
        .from("acciones")
        .update({ [field]: fallback })
        .eq(field, value);

      if (error) {
        setSyncStatus(`Error actualizando acciones: ${error.message}`);
        return;
      }
    }

    if (category === "mediosPauta") {
      setPautaRows((prev) =>
        prev.map((row) => (row.medio === value ? { ...row, medio: fallback } : row))
      );

      const { error } = await supabase
        .from("pauta")
        .update({ medio: fallback })
        .eq("medio", value);

      if (error) {
        setSyncStatus(`Error actualizando pauta: ${error.message}`);
        return;
      }
    }

    setForm((prev) =>
      fieldMap[category] && prev[fieldMap[category]] === value
        ? { ...prev, [fieldMap[category]]: fallback }
        : prev
    );

    setPautaForm((prev) =>
      category === "mediosPauta" && prev.medio === value
        ? { ...prev, medio: fallback }
        : prev
    );

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
    const items = borradorConclusiones
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const next = { ...conclusionesPorFecha };

    try {
      if (items.length) {
        const { error } = await supabase
          .from("conclusiones")
          .upsert({ fecha: fechaConclusiones, conclusiones: items }, { onConflict: "fecha" });

        if (error) {
          console.error("Supabase conclusiones upsert error:", error);

          if (error.message.includes("unique") || error.message.includes("duplicate") || error.code === "23505") {
            setSyncStatus("Error: La columna 'fecha' en tabla 'conclusiones' necesita un constraint UNIQUE.");
          } else {
            setSyncStatus(`Error guardando conclusiones: ${error.message} (${error.code || "N/A"})`);
          }

          return;
        }

        next[fechaConclusiones] = items;
      } else {
        const { error } = await supabase.from("conclusiones").delete().eq("fecha", fechaConclusiones);

        if (error) {
          setSyncStatus(`Error eliminando conclusiones: ${error.message}`);
          return;
        }

        delete next[fechaConclusiones];
      }

      setConclusionesPorFecha(next);
      setSyncStatus("Conclusiones guardadas correctamente.");
    } catch (err) {
      console.error("Unexpected conclusiones error:", err);
      setSyncStatus(`Error inesperado: ${err.message}`);
    }
  }

  function handleVistaChange(nextVista) {
    setVista(nextVista);
    setCsvStatus("");

    if (typeof window !== "undefined") {
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }
  }

  function handleCsvExport() {
    const ok = downloadCsv(filteredRows);

    setCsvStatus(
      ok
        ? `CSV generado con ${filteredRows.length} registros.`
        : "No se pudo generar el CSV en este entorno."
    );

    if (typeof window !== "undefined") {
      window.setTimeout(() => setCsvStatus(""), 4000);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSyncStatus("");

    const newRow = {
      ...form,
      alcance: toNumber(form.alcance),
      meGusta: toNumber(form.meGusta),
      comentarios: toNumber(form.comentarios),
      compartidos: toNumber(form.compartidos),
      retweets: toNumber(form.retweets),
      historias: toNumber(form.historias),
      seguidores: toNumber(form.seguidores),
    };

    try {
      const { data, error } = await supabase
        .from("acciones")
        .insert(rowToDb(newRow))
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        setSyncStatus(`Error guardando acción: ${error.message} (código: ${error.code || "N/A"})`);
        return;
      }

      if (!data) {
        setSyncStatus("Error: Supabase no retornó datos. Verifica permisos RLS en la tabla 'acciones'.");
        return;
      }

      setRows((prev) => [rowFromDb(data), ...prev]);
      setForm(createForm(catalogos));
      setVista("dashboard");
      setSyncStatus("Acción guardada correctamente.");
    } catch (err) {
      console.error("Unexpected error:", err);
      setSyncStatus(`Error inesperado: ${err.message}`);
    }
  }

  async function handleAddPauta() {
    if (!pautaForm.url.trim()) return;
    setSyncStatus("");

    const newRow = {
      fecha: pautaForm.fecha || today(),
      url: pautaForm.url.trim(),
      medio: pautaForm.medio,
      alcance: toNumber(pautaForm.alcance),
      costo: toNumber(pautaForm.costo),
      interacciones: toNumber(pautaForm.interacciones),
      ctr: toNumber(pautaForm.ctr),
      visualizaciones: toNumber(pautaForm.visualizaciones),
    };

    try {
      const { data, error } = await supabase
        .from("pauta")
        .insert(pautaToDb(newRow))
        .select()
        .single();

      if (error) {
        console.error("Supabase pauta insert error:", error);
        setSyncStatus(`Error guardando pauta: ${error.message} (código: ${error.code || "N/A"})`);
        return;
      }

      if (!data) {
        setSyncStatus("Error: Supabase no retornó datos. Verifica permisos RLS en la tabla 'pauta'.");
        return;
      }

      setPautaRows((prev) => [pautaFromDb(data), ...prev]);
      setPautaForm(createPautaForm(catalogos));
      setSyncStatus("Contenido pautado guardado correctamente.");
    } catch (err) {
      console.error("Unexpected error:", err);
      setSyncStatus(`Error inesperado: ${err.message}`);
    }
  }

  const clearDateFilters = () => {
    setDateStart("");
    setDateEnd("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePautaChange = (field, value) => {
    setPautaForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                <IconActivity className="h-3.5 w-3.5" /> Plataforma de gestión diaria
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Onda Expansiva
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
                Registro diario de acciones, difusión por red y consolidado ejecutivo para medir alcance e impacto por Community Manager.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button type="button" onClick={() => handleVistaChange("dashboard")} className={`btn-tab ${vista === "dashboard" ? "btn-tab-active" : ""}`}>
                <IconBarChart className="h-4 w-4" /> Dashboard
              </button>

              <button type="button" onClick={() => handleVistaChange("registro")} className={`btn-tab ${vista === "registro" ? "btn-tab-active" : ""}`}>
                <IconPlus className="h-4 w-4" /> Registrar
              </button>

              <button type="button" onClick={() => handleVistaChange("tabla")} className={`btn-tab ${vista === "tabla" ? "btn-tab-active" : ""}`}>
                <IconClipboard className="h-4 w-4" /> Consolidado
              </button>

              <button type="button" onClick={() => handleVistaChange("configuracion")} className={`btn-tab ${vista === "configuracion" ? "btn-tab-active" : ""}`}>
                <IconSettings className="h-4 w-4" /> Configuración
              </button>

              <button type="button" onClick={handleCsvExport} className="btn-primary">
                <IconDownload className="h-4 w-4" /> CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:gap-6 sm:py-6 md:px-6">
        {csvStatus && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            {csvStatus}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
            Cargando datos desde Supabase...
          </div>
        )}

        {syncStatus && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            {syncStatus}
          </div>
        )}

        {vista === "dashboard" && (
          <>
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem] sm:p-5">
              <div className="mb-4">
                <h2 className="text-base font-black uppercase tracking-[0.15em] text-slate-900 sm:text-lg">
                  Control de secciones
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Activa o desactiva las secciones del dashboard según la necesidad del reporte.
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <ToggleChip active={mostrarContactoDirecto} onClick={() => setMostrarContactoDirecto((prev) => !prev)} label="Contacto Directo" />
                <ToggleChip active={mostrarContenidoPautado} onClick={() => setMostrarContenidoPautado((prev) => !prev)} label="Contenido Pautado" />
                <ToggleChip active={mostrarConclusiones} onClick={() => setMostrarConclusiones((prev) => !prev)} label="Conclusiones Generales" />
              </div>
            </section>

            <OndaHero value={resumenPeriodo.ondaExpansiva} />

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Interacciones captadas" value={fmt(resumenPeriodo.interaccionesCaptadas)} subtitle="Me gusta y reacciones" icon={<IconZap className="h-5 w-5" />} color="yellow" />
              <MetricCard title="Compartido" value={fmt(resumenPeriodo.compartidos)} subtitle="Compartidos, reposts e historias" icon={<IconShare className="h-5 w-5" />} color="purple" />
              <MetricCard title="Comentarios" value={fmt(resumenPeriodo.comentarios)} subtitle="Total comentarios" icon={<IconComment className="h-5 w-5" />} color="brown" />
              <MetricCard title="Seguidores captados" value={fmt(resumenPeriodo.seguidoresCaptados)} subtitle="Nuevos seguidores" icon={<IconUserPlus className="h-5 w-5" />} color="red" />
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="Onda expansiva registrada" value={fmt(kpis.totalOnda)} subtitle="Desde acciones diligenciadas" icon={<IconNetwork className="h-6 w-6" />} tone="dark" />
              <KpiCard title="Contenidos realizados" value={fmt(kpis.contenidos)} subtitle="Creación de contenido" icon={<IconMegaphone className="h-6 w-6" />} tone="blue" />
              <KpiCard title="Contenidos difundidos" value={fmt(kpis.difundidos)} subtitle="Siembra y amplificación" icon={<IconRadio className="h-6 w-6" />} tone="green" />
              <KpiCard title="Redes activas" value={fmt(kpis.redesActivas)} subtitle="Canales con actividad" icon={<IconUsers className="h-6 w-6" />} tone="orange" />
            </section>

            <FilterPanel
              query={query}
              setQuery={setQuery}
              responsable={responsable}
              setResponsable={setResponsable}
              red={red}
              setRed={setRed}
              accion={accion}
              setAccion={setAccion}
              catalogos={catalogos}
              placeholder="Buscar por medio, campaña, hashtag, mención, responsable o red..."
              dateStart={dateStart}
              setDateStart={setDateStart}
              dateEnd={dateEnd}
              setDateEnd={setDateEnd}
              clearDateFilters={clearDateFilters}
            />

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Onda expansiva por Community Manager" subtitle="Total acumulado por responsable">
                {ondaPorCm.length === 0 ? (
                  <EmptyState text="No hay acciones registradas por responsable." />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
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
                {accionesPorRed.length === 0 ? (
                  <EmptyState text="No hay acciones registradas por red." />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={accionesPorRed} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} label>
                        {accionesPorRed.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Evolución diaria de la onda expansiva" subtitle="Comportamiento por fecha registrada">
                {ondaPorFecha.length === 0 ? (
                  <EmptyState text="No hay evolución diaria para mostrar." />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
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
                {accionesPorTipo.length === 0 ? (
                  <EmptyState text="No hay acciones por tipo registradas." />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
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

            {mostrarContenidoPautado && (
              <ContenidoPautadoSection
                rows={filteredPautaRows}
                form={pautaForm}
                catalogos={catalogos}
                onChange={handlePautaChange}
                onAdd={handleAddPauta}
                onDelete={deletePautaRow}
                resumen={pautaResumen}
              />
            )}

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
              />
            )}
          </>
        )}

        {vista === "registro" && (
          <RegistroForm
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            catalogos={catalogos}
          />
        )}

        {vista === "tabla" && (
          <>
            <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[1.8rem]">
              <div className="mb-4">
                <h2 className="text-xl font-black sm:text-2xl">Consolidado</h2>
                <p className="text-sm text-slate-500">
                  Consulta, filtra y exporta las acciones registradas.
                </p>
              </div>

              <FilterPanel
                query={query}
                setQuery={setQuery}
                responsable={responsable}
                setResponsable={setResponsable}
                red={red}
                setRed={setRed}
                accion={accion}
                setAccion={setAccion}
                catalogos={catalogos}
                placeholder="Buscar en el consolidado..."
                dateStart={dateStart}
                setDateStart={setDateStart}
                dateEnd={dateEnd}
                setDateEnd={setDateEnd}
                clearDateFilters={clearDateFilters}
              />
            </section>

            <ConsolidadoTable rows={filteredRows} removeRow={deleteRow} />
          </>
        )}

        {vista === "configuracion" && (
          <ConfiguracionSection
            catalogos={catalogos}
            onRename={renameCatalogItem}
            onAdd={addCatalogItem}
            onRemove={removeCatalogItem}
            onReset={resetCatalogos}
            configMessage={configMessage}
          />
        )}
      </main>

      <style>{`
        .input {
          width: 100%;
          min-height: 46px;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: .7rem .85rem;
          font-size: .875rem;
          outline: none;
          transition: all .18s ease;
        }

        .input:focus {
          border-color: rgb(15 23 42);
          background: white;
          box-shadow: 0 0 0 4px rgb(226 232 240 / .8);
        }

        .btn-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: .7rem .95rem;
          font-size: .875rem;
          font-weight: 800;
          color: rgb(71 85 105);
          transition: all .18s ease;
          min-height: 44px;
        }

        .btn-tab:hover {
          transform: translateY(-1px);
          border-color: rgb(148 163 184);
        }

        .btn-tab-active {
          background: rgb(15 23 42);
          color: white;
          border-color: rgb(15 23 42);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          border-radius: 1rem;
          background: rgb(37 99 235);
          padding: .7rem .95rem;
          font-size: .875rem;
          font-weight: 900;
          color: white;
          box-shadow: 0 10px 22px rgb(37 99 235 / .18);
          min-height: 44px;
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
          border-radius: 1rem;
          background: #d7193f;
          padding: .7rem 1rem;
          font-size: .875rem;
          font-weight: 900;
          color: white;
          box-shadow: 0 10px 22px rgba(215, 25, 63, .18);
          min-height: 46px;
        }
      `}</style>
    </div>
  );
}
