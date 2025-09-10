from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin/events', views.AdminTrackingEventViewSet, basename='admin-tracking-events')

urlpatterns = [
    path('<str:tracking_number>/events/', views.TrackingEventListView.as_view(), name='tracking-events'),
    path('', include(router.urls)),  # Include admin routes
]
