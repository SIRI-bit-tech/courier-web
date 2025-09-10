from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.AdminRouteViewSet, basename='admin-routes')

urlpatterns = [
    path('', views.RouteListView.as_view(), name='route-list'),
    path('<int:pk>/', views.RouteDetailView.as_view(), name='route-detail'),
    path('optimize/', views.optimize_routes, name='optimize-routes'),
    path('', include(router.urls)),
]
