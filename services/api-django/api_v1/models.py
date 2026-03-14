from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid
import secrets

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            throw ValueError('The Email must be set')
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'Users'

class Session(models.Model):
    STATUS_CHOICES = [
        ('INIT', 'INIT'),
        ('QR', 'QR'),
        ('CONNECTED', 'CONNECTED'),
        ('DISCONNECTED', 'DISCONNECTED'),
    ]

    id = models.CharField(primary_key=True, max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions', db_column='userId')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INIT')
    apiKey = models.CharField(max_length=255, unique=True, blank=True)
    webhookUrl = models.URLField(max_length=500, null=True, blank=True)
    pairingCode = models.CharField(max_length=255, null=True, blank=True)
    qr = models.TextField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.apiKey:
            self.apiKey = secrets.token_hex(16)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'Sessions'
