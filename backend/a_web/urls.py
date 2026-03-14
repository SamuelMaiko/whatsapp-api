from django.urls import path
from .views import (
    index, web_login, sessions_view, docs_view, 
    create_session_view, delete_session_view, 
    update_webhook_view, auth_logout
)

urlpatterns = [
    path('', index, name='index'),
    path('login/', web_login, name='web-login'),
    path('dashboard/sessions/', sessions_view, name='web-sessions'),
    path('dashboard/docs/', docs_view, name='web-docs'),
    path('dashboard/sessions/create/', create_session_view, name='web-session-create'),
    path('dashboard/sessions/<str:pk>/delete/', delete_session_view, name='web-session-delete'),
    path('dashboard/sessions/<str:pk>/webhook/', update_webhook_view, name='web-webhook-update'),
    path('logout/', auth_logout, name='logout'),
]
