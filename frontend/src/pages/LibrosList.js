import React, { useEffect, useState } from 'react';
import { librosService } from '../api';
import LibroCard from '../components/LibroCard';

export default function LibrosList() {
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLibros = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await librosService.getAll();
        setLibros(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el inventario de libros fisicos.');
      } finally {
        setLoading(false);
      }
    };

    fetchLibros();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inventario</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Libros Fisicos</h1>
          <p className="mt-2 text-sm text-slate-600">
            Consulta el inventario y verifica disponibilidad y estante de cada libro.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-96 animate-pulse rounded-lg bg-white shadow-md" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && libros.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            No hay libros registrados en este momento.
          </div>
        )}

        {!loading && !error && libros.length > 0 && (
          <>
            <div className="mb-4 text-sm text-slate-600">
              {libros.length} libro{libros.length !== 1 ? 's' : ''} en inventario
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {libros.map((libro) => (
                <LibroCard key={libro.id} libro={libro} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
