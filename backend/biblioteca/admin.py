from django.contrib import admin
from django.utils import timezone
import uuid

from .models import (
    Rol, Perfil, PalabraClave, Libro, TrabajoInvestigacion,
    HistorialVisualizacion, DocumentoAporte, CreditoDescarga, AccesoExterno 
)

admin.site.register(Rol)
admin.site.register(Perfil)
admin.site.register(PalabraClave)
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
            aporte.estado = 'aprobado'
            aporte.revisado_por = request.user
            aporte.revisado_at = timezone.now()
            aporte.save()
            # Generar 3 créditos
            for _ in range(3):
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
    list_display = ['id', 'aporte', 'usuario', 'email_externo', 'usado', 'created_at']
    list_filter = ['usado', 'created_at']


@admin.register(AccesoExterno)
class AccesoExternoAdmin(admin.ModelAdmin):
    list_display = ['token_acceso', 'trabajo', 'email', 'fecha_acceso']
    search_fields = ['token_acceso', 'email']