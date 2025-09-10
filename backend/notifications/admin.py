from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('package', 'type', 'recipient', 'status', 'sent_at')
    list_filter = ('type', 'status', 'created_at')
    search_fields = ('package__tracking_number', 'recipient')
