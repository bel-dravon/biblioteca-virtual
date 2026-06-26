from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response

from biblioteca.models import User


class CustomObtainAuthToken(ObtainAuthToken):
    """
    Acepta 'email' para obtener token.
    """
    def post(self, request, *args, **kwargs):
        data = request.data.copy()

        email = data.get('email')
        if not email:
            return Response(
                {'detail': 'El email es requerido.'},
                status=400
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'No existe un usuario con este email.'},
                status=400
            )

        password = data.get('password')
        if not password:
            return Response(
                {'detail': 'La contrasena es requerida.'},
                status=400
            )

        if not user.check_password(password):
            return Response(
                {'detail': 'Credenciales invalidas.'},
                status=400
            )

        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })