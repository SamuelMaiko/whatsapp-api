from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, login_view, SessionViewSet, send_message_view, send_image_view

router = DefaultRouter(trailing_slash=False)
router.register(r'sessions', SessionViewSet, basename='session')

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', login_view, name='login'),
    path('send-message', send_message_view, name='send-message'),
    path('send-image', send_image_view, name='send-image'),
    path('', include(router.urls)),
]
