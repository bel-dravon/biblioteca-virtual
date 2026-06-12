"""Signals de la app biblioteca."""
import os
import fitz  # PyMuPDF
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from biblioteca.models import Perfil, Rol, TrabajoInvestigacion, PaginaPDF


DEFAULT_STUDENT_ROLE = Rol.ESTUDIANTE


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crea automaticamente un perfil con rol estudiante para nuevos usuarios."""
    if not created:
        return

    student_role, _ = Rol.objects.get_or_create(
        nombre=DEFAULT_STUDENT_ROLE,
        defaults={
            'descripcion': 'Basico - Lectura y solicitudes propias',
            'puede_gestionar_usuarios': False,
            'puede_eliminar_contenido': False,
            'puede_ver_estadisticas': False,
        },
    )

    Perfil.objects.get_or_create(
        usuario=instance,
        defaults={'rol': student_role},
    )


# ========== NUEVA SEÑAL: Generar imágenes del PDF ==========
@receiver(post_save, sender=TrabajoInvestigacion)
def generar_imagenes_pdf(sender, instance, created, **kwargs):
    """Genera imágenes PNG de cada página del PDF cuando se crea un trabajo nuevo."""
    if not created or not instance.archivo_ruta:
        return

    # Eliminar páginas anteriores si existen
    instance.paginas.all().delete()

    file_path = os.path.join(settings.MEDIA_ROOT, instance.archivo_ruta.name)
    if not os.path.exists(file_path):
        return

    paginas_dir = os.path.join(settings.MEDIA_ROOT, 'paginas_pdf')
    os.makedirs(paginas_dir, exist_ok=True)

    doc = fitz.open(file_path)
    total_paginas = len(doc)

    for i in range(total_paginas):
        page = doc[i]
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)

        img_filename = f"{instance.id}_pagina_{i + 1}.png"
        img_path = os.path.join(paginas_dir, img_filename)
        pix.save(img_path)

        PaginaPDF.objects.create(
            trabajo=instance,
            numero=i + 1,
            imagen=f'paginas_pdf/{img_filename}'
        )

    doc.close()