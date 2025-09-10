from django.db import models
from packages.models import Package

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('push', 'Push Notification'),
    )

    NOTIFICATION_STATUS = (
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    )

    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=10, choices=NOTIFICATION_TYPES)
    recipient = models.CharField(max_length=200)  # email or phone number
    message = models.TextField()
    status = models.CharField(max_length=10, choices=NOTIFICATION_STATUS, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} to {self.recipient} - {self.package.tracking_number}"
