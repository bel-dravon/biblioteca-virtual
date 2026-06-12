"""Serializador para usuarios."""
import re

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo User de Django.

    Maneja la creación y actualización de usuarios con validación de contraseña.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,  # ← CLAVE: no obligatorio en updates parciales
        min_length=8,
        help_text='Contraseña (mínimo 8 caracteres). Solo requerida al crear usuario.'
    )
    email = serializers.EmailField(
        required=True,
        help_text='Correo electrónico válido'
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'username': {
                'min_length': 3,
                'help_text': 'Nombre de usuario (mínimo 3 caracteres)'
            },
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_username(self, value):
        """Valida que el username no contenga caracteres especiales peligrosos."""
        if not re.match(r'^[\w.@+-]+$', value):
            raise serializers.ValidationError(
                'El nombre de usuario solo puede contener letras, números y @/./+/-/_'
            )
        return value.lower()

    def validate_email(self, value):
        """Valida unicidad del email y devuelve el usuario existente si hay duplicado."""
        queryset = User.objects.filter(email__iexact=value)
        if self.instance is not None:
            queryset = queryset.exclude(id=self.instance.id)
        
        existing = queryset.first()
        if existing:
            raise serializers.ValidationError(
                f'Este correo ya está registrado por el usuario: {existing.username}'
            )
        return value.lower()

    def validate_password(self, value):
        """Valida la contraseña usando los validadores de Django."""
        if value is None:
            return value
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        """Crea un nuevo usuario con contraseña hasheada."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    def update(self, instance, validated_data):
        """Actualiza usuario. Si envía password, la hashea con set_password()."""
        password = validated_data.pop('password', None)
        
        # Actualiza el resto de campos normalmente
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Si enviaron password nueva, hashearla correctamente
        if password is not None:
            instance.set_password(password)
            """ from rest_framework.authtoken.models import Token
            Token.objects.filter(user=instance).delete() """

        
        instance.save()
        return instance