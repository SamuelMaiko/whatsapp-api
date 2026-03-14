from django.urls import path
from .views import (
    RegisterView, LoginView, SessionListView, 
    SessionDetailView, WebhookUpdateView, 
    SendMessageView, SendImageView
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='api-register'),
    path('login', LoginView.as_view(), name='api-login'),
    path('sessions', SessionListView.as_view(), name='session-list'),
    path('sessions/<str:pk>', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/webhook', WebhookUpdateView.as_view(), name='update-webhook'),
    path('send-message', SendMessageView.as_view(), name='send-message'),
    path('send-image', SendImageView.as_view(), name='send-image'),
]
