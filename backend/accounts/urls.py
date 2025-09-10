from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('drivers/', views.get_drivers, name='drivers'),
    path('admin/login/', views.admin_login, name='admin-login'),
    path('admin/stats/', views.admin_stats, name='admin-stats'),
    path('', include(router.urls)),
]
