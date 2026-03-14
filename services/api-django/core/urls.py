from django.contrib import admin
from django.urls import path, include
from api_v1.views import portal_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api_v1.urls')),
    path('', portal_view, name='portal'),
]
