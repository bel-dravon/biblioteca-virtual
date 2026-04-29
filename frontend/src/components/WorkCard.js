import React from 'react';
import { Link } from 'react-router-dom';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

const typeConfig = {
  tesis: { badgeClass: 'bg-blue-50 text-blue-700', label: 'Tesis' },
  proyecto_grado: { badgeClass: 'bg-amber-50 text-amber-700', label: 'Proyecto de Grado' },
  trabajo_dirigido: { badgeClass: 'bg-orange-50 text-orange-700', label: 'Trabajo Dirigido' },
  monografia: { badgeClass: 'bg-violet-50 text-violet-700', label: 'Monografia' },
  libro: { badgeClass: 'bg-emerald-50 text-emerald-700', label: 'Libro' },
};

function WorkCard({ trabajo, work, onClick, variant = 'card' }) {
  const item = trabajo || work;
  if (!item) return null;

  const type = typeConfig[item.tipo_material] || { badgeClass: 'bg-gray-100 text-gray-700', label: 'Otro' };
  const descripcion = item.resumen || item.descripcion || 'Sin resumen disponible';
  const palabrasClave = Array.isArray(item.palabras_clave) ? item.palabras_clave : [];
  const tags = palabrasClave
    .map((tag) => (typeof tag === 'string' ? tag : tag.termino || tag.nombre || null))
    .filter(Boolean)
    .slice(0, 3);

  const hasPdf = Boolean(item.archivo_ruta || item.archivo_pdf || item.pdf || item.archivo || item.url_pdf);
  const publicationYear = item.anio_publicacion || null;
  const specialty = item.especialidad || null;
  const callNumber = item.signatura_topografica || null;

  const getAuthorName = () => {
    if (item.autores_texto) {
      return item.autores_texto;
    }
    if (item.autores && item.autores.length > 0) {
      const autor = item.autores[0];
      return `${autor.nombre || ''} ${autor.apellido || ''}`.trim() || 'Autor desconocido';
    }
    return 'Autor desconocido';
  };

  return (
    <article
      onClick={onClick}
      aria-label={`${item.titulo} - ${type.label}`}
      className={`flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg ${
        variant === 'list' ? 'max-w-sm' : ''
      }`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="relative">
        <img
          className="w-full h-64 object-cover object-top"
          src={item.thumbnail || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=500&q=60'}
          alt={item.titulo}
        />

        {hasPdf && (
          <div className="absolute right-2 top-2 flex gap-1">
            {hasPdf && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700">
                <PictureAsPdfOutlinedIcon sx={{ fontSize: 13 }} /> PDF
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex h-full flex-col p-4">
        <span className={`mb-3 w-fit rounded-full px-2 py-1 text-xs font-medium ${type.badgeClass}`}>{type.label}</span>

        <h3 className="mb-2 line-clamp-3 text-lg font-semibold leading-tight text-gray-900">{item.titulo}</h3>

        <p className="truncate text-sm font-medium text-gray-500">{getAuthorName()}</p>

        {(publicationYear || specialty || callNumber) && (
          <p className="mt-1 text-xs text-gray-500">
            {publicationYear ? `${publicationYear}` : ''}
            {publicationYear && (specialty || callNumber) ? ' - ' : ''}
            {specialty ? specialty : ''}
            {specialty && callNumber ? ' - ' : ''}
            {callNumber ? callNumber : ''}
          </p>
        )}

        <p className="mb-4 mt-2 flex-grow line-clamp-3 text-sm text-gray-600">{descripcion}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span key={`${item.id}-tag-${index}`} className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {tag}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Sin etiqueta</span>
          )}
        </div>

        <div className="mt-auto">
          <Link
            to={`/work/${item.id}`}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Ver Detalles
          </Link>
        </div>
      </div>
    </article>
  );
}

export default WorkCard;
