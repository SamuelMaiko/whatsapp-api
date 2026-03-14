from rest_framework import serializers
from .models import User, Session

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ('id', 'status', 'apiKey', 'webhookUrl', 'pairingCode', 'qr', 'createdAt', 'updatedAt')
        read_only_fields = ('id', 'apiKey', 'createdAt', 'updatedAt')
