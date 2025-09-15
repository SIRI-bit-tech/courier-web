from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/tracking/(?P<tracking_number>\w+)/$', consumers.TrackingConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationsConsumer.as_asgi()),  
    re_path(r'ws/driver-updates/$', consumers.DriverConsumer.as_asgi()),
]