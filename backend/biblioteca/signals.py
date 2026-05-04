"""Signals de la app biblioteca."""
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from biblioteca.models import Perfil, Rol


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
