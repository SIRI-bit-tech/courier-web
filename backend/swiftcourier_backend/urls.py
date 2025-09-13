"""
URL configuration for swiftcourier_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="SwiftCourier API",
      default_version='v1',
      description="SwiftCourier delivery management system API",
      contact=openapi.Contact(email="admin@swiftcourier.com"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

def health_check(request):
    """Health check endpoint for load balancer"""
    return JsonResponse({
        'status': 'healthy',
        'timestamp': __import__('datetime').datetime.now().isoformat(),
        'version': '1.0.0'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include([
        path('accounts/', include('accounts.urls')),
        path('packages/', include('packages.urls')),
        path('tracking/', include('tracking.urls')),
        path('routes/', include('routes.urls')),
        path('notifications/', include('notifications.urls')),
        path('health/', health_check, name='health_check'),
    ])),
    path('health/', health_check, name='health_check'),  # Load balancer health check
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
