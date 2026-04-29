from django.core.management.base import BaseCommand
from biblioteca.models import TrabajoInvestigacion  


class Command(BaseCommand):
    help = 'Genera thumbnails para todos los trabajos que tengan PDF y no tengan thumbnail'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Regenerar thumbnails incluso si ya existen',
        )
        parser.add_argument(
            '--id',
            type=int,
            help='Generar thumbnail solo para un trabajo específico por ID',
        )

    def handle(self, *args, **options):
        force = options['force']
        trabajo_id = options['id']

        # Filtrar trabajos
        if trabajo_id:
            trabajos = TrabajoInvestigacion.objects.filter(pk=trabajo_id)
            if not trabajos.exists():
                self.stdout.write(self.style.ERROR(f"No se encontró trabajo con ID {trabajo_id}"))
                return
        elif force:
            # Todos los que tienen archivo PDF
            trabajos = TrabajoInvestigacion.objects.exclude(archivo_ruta='')
        else:
            # Solo los que no tienen thumbnail
            trabajos = TrabajoInvestigacion.objects.exclude(archivo_ruta='').filter(
                models.Q(thumbnail__isnull=True) | models.Q(thumbnail='')
            )

        # Filtrar solo PDFs
        trabajos = [t for t in trabajos if t.archivo_ruta.name.lower().endswith('.pdf')]

        total = len(trabajos)
        if total == 0:
            self.stdout.write(self.style.WARNING("No hay trabajos pendientes de generar thumbnail"))
            return

        self.stdout.write(f"Generando thumbnails para {total} trabajo(s)...\n")

        exitosos = 0
        fallidos = 0

        for i, trabajo in enumerate(trabajos, 1):
            titulo_corto = trabajo.titulo[:50] + '...' if len(trabajo.titulo) > 50 else trabajo.titulo

            try:
                resultado = trabajo.generate_thumbnail()
                if resultado:
                    trabajo.save(update_fields=['thumbnail'])
                    self.stdout.write(
                        self.style.SUCCESS(f"[{i}/{total}] ✓ {titulo_corto}")
                    )
                    exitosos += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f"[{i}/{total}] ⚠ No se pudo generar: {titulo_corto}")
                    )
                    fallidos += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"[{i}/{total}] ✗ Error en '{titulo_corto}': {e}")
                )
                fallidos += 1

        # Resumen
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS(f"Exitosos: {exitosos}"))
        if fallidos > 0:
            self.stdout.write(self.style.ERROR(f"Fallidos: {fallidos}"))
        self.stdout.write("=" * 50)


# Importar models para el filtro Q
from django.db import models