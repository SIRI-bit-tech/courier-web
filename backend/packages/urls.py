from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/packages', views.AdminPackageViewSet, basename='admin-packages')
router.register(r'admin/service-areas', views.AdminServiceAreaViewSet, basename='admin-service-areas')

urlpatterns = [
    path('', views.PackageListCreateView.as_view(), name='package-list-create'),
    path('<int:pk>/', views.PackageDetailView.as_view(), name='package-detail'),
    path('<str:tracking_number>/track/', views.track_package, name='track-package'),
    path('<str:tracking_number>/location/', views.package_location, name='package-location'),
    path('<str:tracking_number>/eta/', views.package_eta, name='package-eta'),
    path('<int:pk>/status/', views.update_package_status, name='update-package-status'),
    path('calculate-rate/', views.calculate_rate, name='calculate-rate'),
    path('admin/<int:pk>/send-email/', views.admin_send_email_notification, name='admin-send-email'),
    path('admin/generate-package/', views.admin_generate_tracking_code, name='admin-generate-package'),
    path('admin/statistics/', views.admin_package_statistics, name='admin-statistics'),
    path('', include(router.urls)),
]
