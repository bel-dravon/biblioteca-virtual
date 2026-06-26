"""
Comando para actualizar estados de convocatorias según fechas.
Ejecutar periódicamente con cron o celery beat.
"""
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand

from biblioteca.models import Convocatoria, HistorialEstadoConvocatoria


class Command(BaseCommand):
    help = 'Actualiza estados de convocatorias según fecha_fin y regla de 7 días de gracia.'

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        actualizadas = 0

        # 1. Vigente → En Gracia (pasó fecha_fin pero no los 7 días)
        convocatorias_vigentes = Convocatoria.objects.filter(estado='vigente')
        for conv in convocatorias_vigentes:
            if hoy > conv.fecha_fin:
                # Entró en período de gracia
                dias_gracia = (hoy - conv.fecha_fin).days
                if dias_gracia <= 7:
                    self._cambiar_estado(conv, 'en_gracia')
                    actualizadas += 1

        # 2. En Gracia → Oculta (pasaron más de 7 días desde fecha_fin)
        convocatorias_gracia = Convocatoria.objects.filter(estado='en_gracia')
        for conv in convocatorias_gracia:
            dias_desde_fin = (hoy - conv.fecha_fin).days
            if dias_desde_fin > 7:
                self._cambiar_estado(conv, 'oculta')
                actualizadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'Convocatorias actualizadas: {actualizadas}'
        ))

    def _cambiar_estado(self, convocatoria, nuevo_estado):
        estado_anterior = convocatoria.estado
        convocatoria.estado = nuevo_estado
        convocatoria.save()

        HistorialEstadoConvocatoria.objects.create(
            convocatoria=convocatoria,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado
        )