"""Modelos de autenticacion y perfiles de usuario."""
from django.db import models
from django.contrib.auth.models import User


class Rol(models.Model):
    """Modelo para roles de usuario en el sistema."""

    ADMINISTRADOR = 'Administrador'
    ESTUDIANTE = 'Estudiante'
    USUARIO = 'Usuario'

    ROLES_PREDEFINIDOS = [
        (ADMINISTRADOR, 'Administracion integral del sistema'),
        (ESTUDIANTE, 'Acceso basico a la biblioteca y solicitudes propias'),
        (USUARIO, 'Acceso basico de lectura y consultas propias'),
    ]

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, default='')
    puede_gestionar_usuarios = models.BooleanField(default=False)
    puede_eliminar_contenido = models.BooleanField(default=False)
    puede_ver_estadisticas = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

    @classmethod
    def crear_roles_iniciales(cls):
        """Crea los roles predefinidos del sistema si no existen."""
        roles = {}

        administrador, _ = cls.objects.get_or_create(
            nombre=cls.ADMINISTRADOR,
            defaults={
                'descripcion': 'Administracion integral del sistema',
                'puede_gestionar_usuarios': True,
                'puede_eliminar_contenido': True,
                'puede_ver_estadisticas': True,
            }
        )
        roles['administrador'] = administrador

        estudiante, _ = cls.objects.get_or_create(
            nombre=cls.ESTUDIANTE,
            defaults={
                'descripcion': 'Acceso basico a la biblioteca y solicitudes propias',
                'puede_gestionar_usuarios': False,
                'puede_eliminar_contenido': False,
                'puede_ver_estadisticas': False,
            }
        )
        roles['estudiante'] = estudiante

        usuario, _ = cls.objects.get_or_create(
            nombre=cls.USUARIO,
            defaults={
                'descripcion': 'Acceso basico de lectura y consultas propias',
                'puede_gestionar_usuarios': False,
                'puede_eliminar_contenido': False,
                'puede_ver_estadisticas': False,
            }
        )
        roles['usuario'] = usuario

        return roles


class Perfil(models.Model):
    """Perfil extendido de usuario con asignacion de rol."""

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT)

    class Meta:
        verbose_name = 'Perfil'
        verbose_name_plural = 'Perfiles'

    def __str__(self):
        return f"{self.usuario.username} - {self.rol.nombre}"

    def es_administrador(self):
        """Verifica si el usuario tiene rol de Administrador."""
        return self.rol.nombre == Rol.ADMINISTRADOR

    def puede_gestionar_usuarios(self):
        """Verifica si el rol permite gestionar usuarios."""
        return self.rol.puede_gestionar_usuarios

    def puede_eliminar_contenido(self):
        """Verifica si el rol permite eliminar contenido crítico."""
        return self.rol.puede_eliminar_contenido
