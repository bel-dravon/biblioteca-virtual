"""Signals de la app biblioteca."""
import os
import fitz  # PyMuPDF
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from biblioteca.models import User, Perfil, Rol, TrabajoInvestigacion, PaginaPDF


DEFAULT_USER_ROLE = Rol.USUARIO_INTERNO


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crea automaticamente un perfil con rol Usuario Interno para nuevos usuarios."""
    if not created:
        return

    user_role, _ = Rol.objects.get_or_create(
        nombre=DEFAULT_USER_ROLE,
        defaults={
            'descripcion': 'Acceso basico a la biblioteca y solicitudes propias',
            'puede_gestionar_usuarios': False,
            'puede_eliminar_contenido': False,
        },
    )

    Perfil.objects.get_or_create(
        usuario=instance,
        defaults={'rol': user_role},
    )


# ========== Generar imagenes del PDF y extraer texto ==========
@receiver(post_save, sender=TrabajoInvestigacion)
def generar_imagenes_y_extraer_texto(sender, instance, created, **kwargs):
    """
    Genera imagenes PNG de cada pagina del PDF y extrae el texto completo
    cuando se crea un trabajo nuevo.
    """
    if not created or not instance.archivo_ruta:
        return

    # Eliminar paginas anteriores si existen
    PaginaPDF.objects.filter(material=instance).delete()

    file_path = os.path.join(settings.MEDIA_ROOT, instance.archivo_ruta.name)
    if not os.path.exists(file_path):
        return

    paginas_dir = os.path.join(settings.MEDIA_ROOT, 'paginas_pdf')
    os.makedirs(paginas_dir, exist_ok=True)

    doc = fitz.open(file_path)
    total_paginas = len(doc)

    texto_completo = ""

    for i in range(total_paginas):
        page = doc[i]

        # --- Extraer texto de la pagina ---
        texto_completo += page.get_text()

        # --- Generar imagen de la pagina ---
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)

        img_filename = f"{instance.id}_pagina_{i + 1}.png"
        img_path = os.path.join(paginas_dir, img_filename)
        pix.save(img_path)

        PaginaPDF.objects.create(
            material=instance,
            numero=i + 1,
            imagen=f'paginas_pdf/{img_filename}'
        )

    doc.close()

    # Guardar el texto extraido en el campo contenido
    instance.contenido = texto_completo.strip()
    instance.save(update_fields=['contenido'])