from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Notification
from packages.models import Package
import logging

logger = logging.getLogger(__name__)

# Import Celery shared_task
try:
    from celery import shared_task
except ImportError:
    # Fallback if Celery is not available
    def shared_task(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

@shared_task()
def send_tracking_notification_email(package_id, notification_type='status_update'):
    """Send tracking notification email to package sender"""
    try:
        package = Package.objects.get(id=package_id)
        
        # Email templates based on status
        email_templates = {
            'pending': 'Package Created - Awaiting Pickup',
            'picked_up': 'Package Picked Up',
            'in_transit': 'Package In Transit',
            'out_for_delivery': 'Package Out for Delivery',
            'delivered': 'Package Delivered Successfully',
            'failed_delivery': 'Delivery Attempt Failed',
            'returned': 'Package Returned to Sender',
            'cancelled': 'Package Cancelled'
        }
        
        subject = f"SwiftCourier Update: {email_templates.get(package.status, 'Package Update')} - {package.tracking_number}"
        
        email_content = f"""
Dear {package.sender_name},

Your package with tracking number {package.tracking_number} has been updated.

Status: {package.get_status_display()}
Current Location: {package.current_location or 'Processing'}
Recipient: {package.recipient_name}
Estimated Delivery: {package.estimated_delivery.strftime('%Y-%m-%d %H:%M') if package.estimated_delivery else 'TBD'}

Track your package: {settings.FRONTEND_URL}/track/{package.tracking_number}

Thank you for choosing SwiftCourier!

Best regards,
SwiftCourier Team
        """
        
        # Send email
        success = send_mail(
            subject=subject,
            message=email_content,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[package.sender.email],
            fail_silently=False,
        )
        
        notification = Notification.objects.create(
            package=package,
            type='email',
            recipient=package.sender.email,
            message=email_content,
            status='sent' if success else 'failed'
        )
        
        logger.info(f"Email notification sent for package {package.tracking_number}")
        return True
        
    except Package.DoesNotExist:
        logger.error(f"Package with id {package_id} not found")
        return False
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")
        return False

@shared_task()
def send_admin_notification_email(package_id, recipient_email, subject, message):
    """Send custom email notification from admin"""
    try:
        package = Package.objects.get(id=package_id)
        
        success = send_mail(
            subject=f"SwiftCourier: {subject} - {package.tracking_number}",
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        
        notification = Notification.objects.create(
            package=package,
            type='email',
            recipient=recipient_email,
            message=message,
            status='sent' if success else 'failed'
        )
        
        logger.info(f"Admin email sent for package {package.tracking_number}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send admin email: {str(e)}")
        return False