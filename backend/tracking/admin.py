from django.contrib import admin
from .models import TrackingEvent

@admin.register(TrackingEvent)
class TrackingEventAdmin(admin.ModelAdmin):
    list_display = ('package', 'status', 'location', 'timestamp', 'created_by')
    list_filter = ('status', 'timestamp')
    search_fields = ('package__tracking_number', 'description')
    readonly_fields = ('timestamp',)
