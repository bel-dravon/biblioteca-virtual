"""
Shared API response helpers.
"""
from rest_framework.response import Response


def api_error_response(message, error_code=None, details=None, http_status=400):
    """
    Genera una respuesta JSON estandarizada para errores.

    Args:
        message: Mensaje de error legible para el usuario.
        error_code: Código de error interno opcional.
        details: Detalles adicionales del error.
        http_status: Código HTTP a retornar.

    Returns:
        Response: Respuesta DRF con formato estándar.
    """
    response_data = {
        'success': False,
        'error': {
            'message': message,
        }
    }
    if error_code:
        response_data['error']['code'] = error_code
    if details:
        response_data['error']['details'] = details

    return Response(response_data, status=http_status)


def api_success_response(data=None, message=None, http_status=200):
    """
    Genera una respuesta JSON estandarizada para éxito.

    Args:
        data: Datos a incluir en la respuesta.
        message: Mensaje opcional de éxito.
        http_status: Código HTTP a retornar.

    Returns:
        Response: Respuesta DRF con formato estándar.
    """
    response_data = {'success': True}
    if data is not None:
        response_data['data'] = data
    if message:
        response_data['message'] = message

    return Response(response_data, status=http_status)
