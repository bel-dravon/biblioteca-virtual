from django.contrib import admin
from django.utils import timezone
import uuid

from .models import (
    Rol, Perfil, PalabraClave, MaterialBibliografico, MaterialBibliograficoPalabraClave,
    Libro, TrabajoInvestigacion,
    HistorialVisualizacion, DocumentoAporte, CreditoDescarga, AccesoExterno,
    Convocatoria, HistorialEstadoConvocatoria,
    SolicitudPrestamo, Notificacion,
    PaginaPDF
)

# -- Auth --
admin.site.register(Rol)
admin.site.register(Perfil)

# -- Catalogo --
@admin.register(PalabraClave)
class PalabraClaveAdmin(admin.ModelAdmin):
    search_fields = ['termino']
    list_display = ['termino']


class MaterialBibliograficoPalabraClaveInline(admin.TabularInline):
    model = MaterialBibliograficoPalabraClave
    extra = 1
    autocomplete_fields = ['palabra_clave']


@admin.register(MaterialBibliografico)
class MaterialBibliograficoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'autor_texto', 'anio_publicacion', 'created_at']
    search_fields = ['titulo', 'autor_texto']
    list_filter = ['anio_publicacion', 'created_at']
    inlines = [MaterialBibliograficoPalabraClaveInline]


@admin.register(TrabajoInvestigacion)
class TrabajoInvestigacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'anio_publicacion', 'permite_preview_publico', 'signatura_topografica')
    fields = (
        'titulo', 'resumen', 'anio_publicacion', 'archivo_ruta',
        'especialidad', 'autor_texto', 'asesor_texto', 'contenido',
        'signatura_topografica', 'permite_preview_publico',
    )
    list_filter = ('anio_publicacion', 'permite_preview_publico')
    search_fields = ('titulo', 'resumen')
    inlines = [MaterialBibliograficoPalabraClaveInline]


@admin.register(Libro)
class LibroAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor_texto', 'stock', 'anio_publicacion')
    search_fields = ('titulo', 'autor_texto', 'isbn')
    list_filter = ('anio_publicacion', 'editorial')
    inlines = [MaterialBibliograficoPalabraClaveInline]

# -- Operaciones --
@admin.register(HistorialVisualizacion)
class HistorialVisualizacionAdmin(admin.ModelAdmin):
    list_display = ['material', 'usuario', 'fecha_visualizacion']
    list_filter = ['fecha_visualizacion']


@admin.register(SolicitudPrestamo)
class SolicitudPrestamoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'libro', 'estado', 'fecha_solicitud', 'fecha_aprobacion', 'fecha_devolucion']
    list_filter = ['estado', 'fecha_solicitud']
    search_fields = ['usuario__email', 'libro__titulo']


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ['destinatario_tipo', 'destinatario_id', 'mensaje_preview', 'leida', 'created_at']
    list_filter = ['leida', 'destinatario_tipo', 'created_at']

    def mensaje_preview(self, obj):
        return obj.mensaje[:50] + '...' if len(obj.mensaje) > 50 else obj.mensaje
    mensaje_preview.short_description = 'Mensaje'

# -- Contribuciones --
@admin.register(DocumentoAporte)
class DocumentoAporteAdmin(admin.ModelAdmin):
    list_display = [
        'titulo', 'nombre_completo', 'email', 'estado',
        'created_at', 'revisado_por', 'revisado_at'
    ]
    list_filter = ['estado', 'created_at']
    search_fields = ['titulo', 'nombre_completo', 'email']
    readonly_fields = ['archivo_hash', 'created_at']
    actions = ['aprobar_aportes', 'rechazar_aportes']

    @admin.action(description='Aprobar aportes seleccionados')
    def aprobar_aportes(self, request, queryset):
        for aporte in queryset.filter(estado='pendiente'):
            aporte.estado = 'aceptado'
            aporte.revisado_por = request.user
            aporte.revisado_at = timezone.now()
            aporte.save()
            for _ in range(2):
                CreditoDescarga.objects.create(
                    aporte=aporte,
                    usuario=aporte.usuario_interno,
                    email_externo=aporte.email if not aporte.usuario_interno else None,
                    token_acceso=str(uuid.uuid4()).replace('-', '') if not aporte.usuario_interno else None
                )
        self.message_user(request, f"{queryset.count()} aportes aprobados.")

    @admin.action(description='Rechazar aportes seleccionados')
    def rechazar_aportes(self, request, queryset):
        queryset.update(estado='rechazado', revisado_por=request.user, revisado_at=timezone.now())
        self.message_user(request, f"{queryset.count()} aportes rechazados.")


@admin.register(CreditoDescarga)
class CreditoDescargaAdmin(admin.ModelAdmin):
    list_display = ['id', 'aporte', 'usuario', 'email_externo', 'token_acceso', 'usado', 'created_at']
    list_filter = ['usado', 'created_at']
    search_fields = ['token_acceso', 'email_externo']


@admin.register(AccesoExterno)
class AccesoExternoAdmin(admin.ModelAdmin):
    list_display = ['token_acceso', 'material', 'email', 'fecha_acceso']
    search_fields = ['token_acceso', 'email']

# -- Convocatorias --
@admin.register(Convocatoria)
class ConvocatoriaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'estado', 'fecha_inicio', 'fecha_fin']
    list_filter = ['estado']
    search_fields = ['titulo', 'descripcion']


@admin.register(HistorialEstadoConvocatoria)
class HistorialEstadoConvocatoriaAdmin(admin.ModelAdmin):
    list_display = ['convocatoria', 'estado_anterior', 'estado_nuevo', 'fecha_cambio']
    list_filter = ['fecha_cambio']
    readonly_fields = ['fecha_cambio']

# -- PaginaPDF --
@admin.register(PaginaPDF)
class PaginaPDFAdmin(admin.ModelAdmin):
    list_display = ['material', 'numero', 'imagen']
    list_filter = ['material']
    search_fields = ['material__titulo']