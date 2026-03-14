from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('a_apis.urls')),
    path('', include('a_web.urls')),
]
