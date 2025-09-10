from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import TrackingEvent
from packages.models import Package
from notifications.tasks import send_tracking_notification_email

@receiver(post_save, sender=TrackingEvent)
def broadcast_tracking_update(sender, instance, created, **kwargs):
    """Broadcast tracking updates via WebSocket when new events are created"""
    if created:
        channel_layer = get_channel_layer()
        group_name = f'tracking_{instance.package.tracking_number}'
        
        # Prepare the data to send
        package_data = {
            'tracking_number': instance.package.tracking_number,
            'status': instance.package.status,
            'current_location': instance.package.current_location,
            'latitude': float(instance.package.current_latitude) if instance.package.current_latitude else None,
            'longitude': float(instance.package.current_longitude) if instance.package.current_longitude else None,
            'estimated_delivery': instance.package.estimated_delivery.isoformat() if instance.package.estimated_delivery else None,
            'last_updated': instance.timestamp.isoformat()
        }
        
        # Send update to WebSocket group
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'package_update',
                'data': package_data
            }
        )
        
        send_tracking_notification_email.delay(instance.package.id)

@receiver(post_save, sender=Package)
def broadcast_package_update(sender, instance, created, **kwargs):
    """Broadcast package updates via WebSocket when package status changes"""
    if not created:  # Only for updates, not new packages
        channel_layer = get_channel_layer()
        group_name = f'tracking_{instance.tracking_number}'
        
        package_data = {
            'tracking_number': instance.tracking_number,
            'status': instance.status,
            'current_location': instance.current_location,
            'latitude': float(instance.current_latitude) if instance.current_latitude else None,
            'longitude': float(instance.current_longitude) if instance.current_longitude else None,
            'estimated_delivery': instance.estimated_delivery.isoformat() if instance.estimated_delivery else None,
            'last_updated': instance.updated_at.isoformat()
        }
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'package_update',
                'data': package_data
            }
        )
        
        send_tracking_notification_email.delay(instance.id)
    elif created:
        send_tracking_notification_email.delay(instance.id)
