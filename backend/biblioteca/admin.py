from django.contrib import admin
from .models import (
    Rol, Perfil, PalabraClave, Libro, TrabajoInvestigacion,
    SolicitudPrestamo, HistorialVisualizacion
)

admin.site.register(Rol)
admin.site.register(Perfil)
admin.site.register(PalabraClave)
admin.site.register(SolicitudPrestamo)
admin.site.register(HistorialVisualizacion)

@admin.register(TrabajoInvestigacion)
class TrabajoInvestigacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'anio_publicacion', 'tipo_material', 'signatura_topografica')
    fields = (
        'titulo', 'resumen', 'anio_publicacion', 'archivo_ruta',
        'especialidad',
        'tipo_material', 'autores_texto', 'asesor_texto',
        'signatura_topografica', 'palabras_clave'
    )
    list_filter = ('tipo_material', 'anio_publicacion')
    search_fields = ('titulo', 'resumen')
    filter_horizontal = ('palabras_clave',)


@admin.register(Libro)
class LibroAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'stock', 'anio_publicacion')
    search_fields = ('titulo', 'autor', 'isbn')
    list_filter = ('anio_publicacion', 'editorial')
    filter_horizontal = ('palabras_clave',)
