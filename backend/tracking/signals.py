from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import TrackingEvent
from packages.models import Package

# Import task function, but ensure Celery is ready
def get_email_task():
    """Get the email task function, ensuring Celery is loaded"""
    try:
        # Force import of Django settings to ensure Celery app is loaded
        from django.conf import settings
        # Import the celery app to ensure it's initialized
        from swiftcourier_backend.celery import app
        # Now import the task
        from notifications.tasks import send_tracking_notification_email
        return send_tracking_notification_email
    except Exception as e:
        # Fallback: return a dummy function that doesn't crash
        def dummy_task(*args, **kwargs):
            print(f"Email notification would be sent: {args}")
        return dummy_task

# Get the task function
send_tracking_notification_email = get_email_task()

@receiver(post_save, sender=TrackingEvent)
def broadcast_tracking_update(sender, instance, created, **kwargs):
    """Broadcast tracking updates via WebSocket when new events are created"""
    if created:
        channel_layer = get_channel_layer()
        
        # Send to specific package tracking group
        package_group = f'tracking_{instance.package.tracking_number}'
        async_to_sync(channel_layer.group_send)(
            package_group,
            {
                'type': 'package_update',
                'data': {
                    'tracking_number': instance.package.tracking_number,
                    'status': instance.package.status,
                    'current_location': instance.package.current_location,
                    'latitude': float(instance.package.current_latitude) if instance.package.current_latitude else None,
                    'longitude': float(instance.package.current_longitude) if instance.package.current_longitude else None,
                    'estimated_delivery': instance.package.estimated_delivery.isoformat() if instance.package.estimated_delivery else None,
                    'last_updated': instance.timestamp.isoformat(),
                    'sender_id': instance.package.sender.id
                }
            }
        )
        
        # Send to user's notifications group
        user_group = f'notifications_{instance.package.sender.id}'
        async_to_sync(channel_layer.group_send)(
            user_group,
            {
                'type': 'package_update',
                'data': {
                    'package_id': instance.package.id,
                    'tracking_number': instance.package.tracking_number,
                    'status': instance.package.status,
                    'current_location': instance.package.current_location,
                    'latitude': float(instance.package.current_latitude) if instance.package.current_latitude else None,
                    'longitude': float(instance.package.current_longitude) if instance.package.current_longitude else None,
                    'estimated_delivery': instance.package.estimated_delivery.isoformat() if instance.package.estimated_delivery else None,
                    'last_updated': instance.timestamp.isoformat(),
                    'sender_id': instance.package.sender.id
                }
            }
        )
        
        # Send email notification
        try:
            if hasattr(send_tracking_notification_email, 'delay'):
                send_tracking_notification_email.delay(instance.package.id)
            else:
                # Fallback to synchronous call
                send_tracking_notification_email(instance.package.id)
        except Exception as e:
            print(f"Email notification failed: {e}")

@receiver(post_save, sender=Package)
def broadcast_package_update(sender, instance, created, **kwargs):
    """Broadcast package updates via WebSocket when package status changes"""
    if not created:  # Only for updates, not new packages
        channel_layer = get_channel_layer()
        
        # Send to specific package tracking group
        package_group = f'tracking_{instance.tracking_number}'
        async_to_sync(channel_layer.group_send)(
            package_group,
            {
                'type': 'package_update',
                'data': {
                    'tracking_number': instance.tracking_number,
                    'status': instance.status,
                    'current_location': instance.current_location,
                    'latitude': float(instance.current_latitude) if instance.current_latitude else None,
                    'longitude': float(instance.current_longitude) if instance.current_longitude else None,
                    'estimated_delivery': instance.estimated_delivery.isoformat() if instance.estimated_delivery else None,
                    'last_updated': instance.updated_at.isoformat(),
                    'sender_id': instance.sender.id
                }
            }
        )
        
        # Send to user's notifications group
        user_group = f'notifications_{instance.sender.id}'
        async_to_sync(channel_layer.group_send)(
            user_group,
            {
                'type': 'package_update',
                'data': {
                    'package_id': instance.id,
                    'tracking_number': instance.tracking_number,
                    'status': instance.status,
                    'current_location': instance.current_location,
                    'latitude': float(instance.current_latitude) if instance.current_latitude else None,
                    'longitude': float(instance.current_longitude) if instance.current_longitude else None,
                    'estimated_delivery': instance.estimated_delivery.isoformat() if instance.estimated_delivery else None,
                    'last_updated': instance.updated_at.isoformat(),
                    'sender_id': instance.sender.id
                }
            }
        )
        
        # Send email notification
        try:
            if hasattr(send_tracking_notification_email, 'delay'):
                send_tracking_notification_email.delay(instance.id)
            else:
                # Fallback to synchronous call
                send_tracking_notification_email(instance.id)
        except Exception as e:
            print(f"Email notification failed: {e}")
    elif created:
        # Send to user's notifications group for new package
        channel_layer = get_channel_layer()
        user_group = f'notifications_{instance.sender.id}'
        async_to_sync(channel_layer.group_send)(
            user_group,
            {
                'type': 'new_package',
                'data': {
                    'package_id': instance.id,
                    'tracking_number': instance.tracking_number,
                    'status': instance.status,
                    'recipient_name': instance.recipient_name,
                    'recipient_address': instance.recipient_address,
                    'created_at': instance.created_at.isoformat(),
                    'sender_id': instance.sender.id
                }
            }
        )
        
        # Send email notification for new package
        try:
            if hasattr(send_tracking_notification_email, 'delay'):
                send_tracking_notification_email.delay(instance.id)
            else:
                # Fallback to synchronous call
                send_tracking_notification_email(instance.id)
        except Exception as e:
            print(f"Email notification failed: {e}")
