import React from 'react';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

export default function LibroCard({ libro }) {
  const stock = Number(libro?.stock ?? 0);
  const hasStock = stock > 0;
  const palabrasClave = Array.isArray(libro?.palabras_clave) ? libro.palabras_clave : [];
  const tags = palabrasClave
    .map((tag) => (typeof tag === 'string' ? tag : tag.termino || tag.nombre || null))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <article className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-lg">
      {libro?.portada ? (
        <img
          className="w-full h-64 object-cover object-top"
          src={libro.portada}
          alt={libro.titulo || 'Portada del libro'}
        />
      ) : (
        <div className="w-full h-64 bg-slate-200 flex items-center justify-center">
          <MenuBookOutlinedIcon sx={{ fontSize: 56, color: '#64748b' }} />
        </div>
      )}

      <div className="flex flex-col h-full p-4">
        <h2 className="line-clamp-2 text-lg font-semibold leading-tight text-gray-900">
          {libro?.titulo || 'Titulo no disponible'}
        </h2>

        <p className="mt-2 truncate text-sm font-medium text-gray-500">
          {libro?.autor || 'Autor no disponible'}
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Edicion: {libro?.numero_edicion || 'N/D'}
        </p>

        <div className="mt-3 mb-4 flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span key={`${libro.id}-tag-${index}`} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))
          ) : (
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Sin etiqueta</span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stock disponible</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                hasStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {stock}
            </span>
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </article>
  );
}
