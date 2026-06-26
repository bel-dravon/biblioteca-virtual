from django.contrib.auth.backends import ModelBackend

from biblioteca.models import User


class EmailAuthBackend(ModelBackend):
    """
    Autenticacion por email en lugar de username.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        email = kwargs.get('email', username)

        try:
            user = User.objects.get(email__iexact=email)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None