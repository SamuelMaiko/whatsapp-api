from django.urls import path
from .views import (
    index, web_login, web_signup, sessions_view, docs_view, 
    create_session_view, delete_session_view, 
    update_webhook_view, auth_logout, session_status_view
)

urlpatterns = [
    path('', index, name='index'),
    path('login/', web_login, name='web-login'),
    path('signup/', web_signup, name='web-signup'),
    path('dashboard/sessions/', sessions_view, name='web-sessions'),
    path('dashboard/sessions/<str:pk>/status/', session_status_view, name='web-session-status'),
    path('dashboard/docs/', docs_view, name='web-docs'),
    path('dashboard/docs/<str:section>/', docs_view, name='web-docs-section'),
    path('dashboard/sessions/create/', create_session_view, name='web-session-create'),
    path('dashboard/sessions/<str:pk>/delete/', delete_session_view, name='web-session-delete'),
    path('dashboard/sessions/<str:pk>/webhook/', update_webhook_view, name='web-webhook-update'),
    path('logout/', auth_logout, name='web-logout'),
]
