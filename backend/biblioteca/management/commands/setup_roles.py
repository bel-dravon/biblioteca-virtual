from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from biblioteca.models import Perfil, Rol


class Command(BaseCommand):
    help = (
        'Crea los roles iniciales del sistema y opcionalmente asigna '
        'el rol de Administrador a un usuario.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--assign-admin',
            type=str,
            dest='admin_username',
            help='Nombre de usuario al que se asignara el rol Administrador',
        )

    def handle(self, *args, **options):
        roles = Rol.crear_roles_iniciales()
        self.stdout.write(self.style.SUCCESS('Roles iniciales configurados.'))

        for key in ('administrador', 'estudiante', 'usuario'):
            rol = roles.get(key)
            if rol:
                self.stdout.write(f"- {rol.nombre}")

        username = options.get('admin_username')
        if not username:
            return

        self._assign_admin(username=username)

    def _assign_admin(self, username):
        user_model = get_user_model()

        try:
            usuario = user_model.objects.get(username=username)
        except user_model.DoesNotExist as exc:
            raise CommandError(f"El usuario '{username}' no existe.") from exc

        try:
            rol_administrador = Rol.objects.get(nombre=Rol.ADMINISTRADOR)
        except Rol.DoesNotExist as exc:
            raise CommandError(
                f"No existe el rol requerido '{Rol.ADMINISTRADOR}'. Ejecuta setup_roles sin argumentos primero."
            ) from exc

        perfil, created = Perfil.objects.get_or_create(
            usuario=usuario,
            defaults={'rol': rol_administrador},
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Se creo el perfil de '{username}' con rol '{rol_administrador.nombre}'."
                )
            )
            return

        rol_anterior = perfil.rol.nombre
        perfil.rol = rol_administrador
        perfil.save(update_fields=['rol'])
        self.stdout.write(
            self.style.SUCCESS(
                f"Se actualizo '{username}' de '{rol_anterior}' a '{rol_administrador.nombre}'."
            )
        )
