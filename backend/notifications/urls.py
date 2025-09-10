from django.urls import path
from . import views

urlpatterns = [
    path('package/<int:package_id>/', views.NotificationListView.as_view(), name='notification-list'),
    path('package/<int:package_id>/send/', views.send_custom_notification, name='send-notification'),
]
