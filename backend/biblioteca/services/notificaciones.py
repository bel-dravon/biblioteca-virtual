"""Servicios para el sistema de notificaciones."""
from biblioteca.models import Notificacion, Rol, User


def notificar_a_usuario(usuario_id, mensaje, origen_tipo, origen_id):
    """
    Crea una notificacion dirigida a un usuario especifico.
    """
    return Notificacion.objects.create(
        destinatario_tipo='usuario',
        destinatario_id=usuario_id,
        origen_tipo=origen_tipo,
        origen_id=origen_id,
        mensaje=mensaje
    )


def notificar_a_rol(rol_nombre, mensaje, origen_tipo, origen_id):
    """
    Crea notificaciones para todos los usuarios con un rol especifico.
    """
    try:
        rol = Rol.objects.get(nombre=rol_nombre)
    except Rol.DoesNotExist:
        return []

    usuarios = User.objects.filter(perfil__rol=rol)
    notificaciones = []

    for usuario in usuarios:
        notificacion = Notificacion.objects.create(
            destinatario_tipo='usuario',
            destinatario_id=usuario.id,
            origen_tipo=origen_tipo,
            origen_id=origen_id,
            mensaje=mensaje
        )
        notificaciones.append(notificacion)

    return notificaciones


def notificar_a_administradores(mensaje, origen_tipo, origen_id):
    """
    Helper especifico para notificar a todos los Administradores.
    """
    return notificar_a_rol(Rol.ADMINISTRADOR, mensaje, origen_tipo, origen_id)