from django.conf import settings
from django.core.mail import send_mail
from twilio.rest import Client
import logging

logger = logging.getLogger(__name__)

def send_sms(phone_number, message):
    """Send SMS using Twilio"""
    try:
        if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
            logger.error("Twilio credentials not configured")
            return False
            
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        logger.info(f"SMS sent successfully: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
        return False

def send_email(email, subject, message):
    """Send email notification"""
    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False
