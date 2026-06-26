"""Serializador para usuarios custom."""
import re

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from biblioteca.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo User custom.
    Sin username, login por email.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        help_text='Contrasena (minimo 8 caracteres). Solo requerida al crear usuario.'
    )
    email = serializers.EmailField(
        required=True,
        help_text='Correo electronico valido'
    )

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        """Valida unicidad del email."""
        queryset = User.objects.filter(email__iexact=value)
        if self.instance is not None:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError('Este correo ya esta registrado.')
        return value.lower()

    def validate_password(self, value):
        """Valida la contrasena usando los validadores de Django."""
        if value is None:
            return value
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        """Crea un nuevo usuario con contrasena hasheada."""
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

    def update(self, instance, validated_data):
        """Actualiza usuario. Si envia password, la hashea con set_password()."""
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password is not None:
            instance.set_password(password)

        instance.save()
        return instance