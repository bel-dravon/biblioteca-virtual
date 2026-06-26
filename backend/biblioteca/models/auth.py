"""Modelos de autenticacion y perfiles de usuario."""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def get_by_natural_key(self, email):
        return self.get(email__iexact=email)

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('El email es obligatorio'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def natural_key(self):
        return (self.email,)


class Rol(models.Model):
    """Modelo para roles de usuario en el sistema."""

    ADMINISTRADOR = 'Administrador'
    USUARIO_INTERNO = 'Usuario Interno'

    ROLES_PREDEFINIDOS = [
        (ADMINISTRADOR, 'Administracion integral del sistema'),
        (USUARIO_INTERNO, 'Acceso basico a la biblioteca y solicitudes propias'),
    ]

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, default='')
    puede_gestionar_usuarios = models.BooleanField(default=False)
    puede_eliminar_contenido = models.BooleanField(default=False)

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
            }
        )
        roles['administrador'] = administrador

        usuario_interno, _ = cls.objects.get_or_create(
            nombre=cls.USUARIO_INTERNO,
            defaults={
                'descripcion': 'Acceso basico a la biblioteca y solicitudes propias',
                'puede_gestionar_usuarios': False,
                'puede_eliminar_contenido': False,
            }
        )
        roles['usuario_interno'] = usuario_interno

        return roles


class Perfil(models.Model):
    """Perfil extendido de usuario con asignacion de rol."""

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='perfil')
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT)

    class Meta:
        verbose_name = 'Perfil'
        verbose_name_plural = 'Perfiles'

    def __str__(self):
        return f"{self.usuario.email} - {self.rol.nombre}"

    def es_administrador(self):
        """Verifica si el usuario tiene rol de Administrador."""
        return self.rol.nombre == Rol.ADMINISTRADOR

    def puede_gestionar_usuarios(self):
        """Verifica si el rol permite gestionar usuarios."""
        return self.rol.puede_gestionar_usuarios

    def puede_eliminar_contenido(self):
        """Verifica si el rol permite eliminar contenido critico."""
        return self.rol.puede_eliminar_contenido