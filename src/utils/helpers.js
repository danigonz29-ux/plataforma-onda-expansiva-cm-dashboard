export const CHART_COLORS = [
  "#0f172a",
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
];

export const SCREENSHOTS_BUCKET = import.meta.env.VITE_SUPABASE_SCREENSHOTS_BUCKET || "screenshots";
export const MAX_SCREENSHOT_SIZE = 10 * 1024 * 1024;

export const CATALOGOS_BASE = {
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

export const CONTACTO_DIRECTO_BASE = {
  diasCampana: 0,
  sms: { enviosDiarios: 0, frecuencia: "", total: 0, costoTotal: 0 },
  llamadas: { realizadas: 0, frecuencia: "", total: 0, costoTotal: 0 },
};

export function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function mergeCatalogos(value) {
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

export function createForm(catalogos = CATALOGOS_BASE) {
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
    esVideo: false,
    reproducciones: "",
    screenshotDriveId: "",
    screenshotPath: "",
    screenshotUrl: "",
  };
}

export function createPautaForm(catalogos = CATALOGOS_BASE) {
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

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function getScreenshotExtension(file) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  const fromType = file.type.split("/").pop()?.toLowerCase();
  const extension = fromName || fromType || "jpg";

  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

export function rowFromDb(row) {
  return {
    id: row.id,
    proyectoId: row.proyecto_id || "",
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
    esVideo: row.es_video || false,
    reproducciones: toNumber(row.reproducciones),
    screenshotDriveId: row.screenshot_drive_id || "",
    screenshotPath: row.screenshot_path || "",
    screenshotUrl: row.screenshot_url || "",
  };
}

export function rowToDb(row) {
  return {
    id: row.id,
    proyecto_id: row.proyectoId || row.proyecto_id || null,
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
    es_video: row.esVideo || false,
    reproducciones: toNumber(row.reproducciones),
    screenshot_drive_id: row.screenshotDriveId || "",
    screenshot_path: row.screenshotPath || "",
    screenshot_url: row.screenshotUrl || "",
  };
}

export function pautaFromDb(row) {
  return {
    id: row.id,
    proyectoId: row.proyecto_id || "",
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

export function pautaToDb(row) {
  return {
    id: row.id,
    proyecto_id: row.proyectoId || row.proyecto_id || null,
    fecha: row.fecha,
    url: row.url,
    medio: row.medio,
    alcance: toNumber(row.alcance),
    costo: toNumber(row.costo),
    interacciones: toNumber(row.interacciones),
    ctr: toNumber(row.ctr),
    visualizaciones: toNumber(row.visualizaciones),
  };
}

export function catalogosFromDb(rows) {
  const parsed = {};
  safeArray(rows).forEach((row) => {
    parsed[row.categoria] = safeArray(row.items);
  });
  return mergeCatalogos(parsed);
}

export function catalogosToDb(catalogos, proyectoId = null) {
  return Object.entries(catalogos).map(([categoria, items]) => ({
    categoria,
    items: safeArray(items),
    ...(proyectoId ? { proyecto_id: proyectoId } : {}),
  }));
}

export function conclusionesFromDb(rows) {
  return Object.fromEntries(safeArray(rows).map((row) => [row.fecha, safeArray(row.conclusiones)]));
}

export function fmt(value) {
  return new Intl.NumberFormat("es-CO").format(Math.round(toNumber(value)));
}

export function fmtMoney(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function fmtPct(value) {
  return `${toNumber(value).toFixed(1)}%`;
}

export function getOnda(row) {
  return (
    toNumber(row.alcance) +
    toNumber(row.meGusta) +
    toNumber(row.comentarios) +
    toNumber(row.compartidos) +
    toNumber(row.retweets) +
    toNumber(row.historias)
  );
}

export function groupBy(rows, key, valueFn = () => 1) {
  const map = new Map();

  rows.forEach((row) => {
    const name = row[key] || "Sin dato";
    map.set(name, (map.get(name) || 0) + valueFn(row));
  });

  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function escapeCsvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildCsv(rows) {
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

export function downloadCsv(rows) {
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