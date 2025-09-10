from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from packages.models import Package
from .models import Notification
from .serializers import NotificationSerializer
from .utils import send_sms, send_email

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        package_id = self.kwargs.get('package_id')
        return Notification.objects.filter(package_id=package_id)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_custom_notification(request, package_id):
    if request.user.user_type != 'admin':
        return Response({'error': 'Permission denied'}, status=403)
    
    package = get_object_or_404(Package, id=package_id)
    notification_type = request.data.get('type')
    message = request.data.get('message')
    
    if notification_type == 'sms':
        recipient = package.recipient_phone
        success = send_sms(recipient, message)
    elif notification_type == 'email':
        recipient = package.sender.email  # or recipient email if available
        success = send_email(recipient, f"Package Update - {package.tracking_number}", message)
    else:
        return Response({'error': 'Invalid notification type'}, status=400)
    
    # Create notification record
    notification = Notification.objects.create(
        package=package,
        type=notification_type,
        recipient=recipient,
        message=message,
        status='sent' if success else 'failed'
    )
    
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)
