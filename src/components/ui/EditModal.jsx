import { useState, useEffect } from "react";
export function EditModal({ open, row, onClose, onSave, catalogos }) {
  const [editData, setEditData] = useState(row || {});

  useEffect(() => {
    if (open && row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditData(row);
    }
  }, [row, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4 py-6 sm:py-0">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <h2 className="mb-4 text-lg font-black sm:text-xl">Editar registro</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Fecha
            <input type="date" className="input" value={editData.fecha || ""} onChange={(e) => setEditData((d) => ({ ...d, fecha: e.target.value }))} />
          </label>
          <label className="text-sm font-bold">
            Responsable
            <select className="input" value={editData.responsable || ""} onChange={(e) => setEditData((d) => ({ ...d, responsable: e.target.value }))}>
              {catalogos.responsables.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Acción
            <select className="input" value={editData.accion || ""} onChange={(e) => setEditData((d) => ({ ...d, accion: e.target.value }))}>
              {catalogos.acciones.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Red
            <select className="input" value={editData.red || ""} onChange={(e) => setEditData((d) => ({ ...d, red: e.target.value }))}>
              {catalogos.redes.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Medio / Perfil / Grupo
            <input className="input" value={editData.perfilGrupo || ""} onChange={(e) => setEditData((d) => ({ ...d, perfilGrupo: e.target.value }))} />
          </label>
          <label className="text-sm font-bold">
            Campaña
            <select className="input" value={editData.tema || ""} onChange={(e) => setEditData((d) => ({ ...d, tema: e.target.value }))}>
              {catalogos.campanas.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold">
            Alcance
            <input type="number" className="input" value={editData.alcance ?? 0} onChange={(e) => setEditData((d) => ({ ...d, alcance: e.target.value }))} />
          </label>
          <label className="text-sm font-bold">
            Seguidores
            <input type="number" className="input" value={editData.seguidores ?? 0} onChange={(e) => setEditData((d) => ({ ...d, seguidores: e.target.value }))} />
          </label>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-tab" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={() => onSave(editData)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}