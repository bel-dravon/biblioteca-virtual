# backend/generar_paginas_existentes.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from biblioteca.models import TrabajoInvestigacion
from biblioteca.signals import generar_imagenes_pdf

# Generar páginas para todos los trabajos existentes
trabajos = TrabajoInvestigacion.objects.filter(archivo_ruta__isnull=False)

print(f"🔧 Generando páginas para {trabajos.count()} trabajos existentes...")

for trabajo in trabajos:
    # Eliminar páginas viejas si existen
    trabajo.paginas.all().delete()
    # Generar nuevas
    generar_imagenes_pdf(
        sender=TrabajoInvestigacion,
        instance=trabajo,
        created=True  # Forzar como si fuera nuevo
    )

print("✅ ¡Todas las páginas generadas!")