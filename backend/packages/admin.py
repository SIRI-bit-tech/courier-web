from django.contrib import admin
from .models import Package, ServiceArea

@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'sender', 'recipient_name', 'status', 'created_at')
    list_filter = ('status', 'package_type', 'created_at')
    search_fields = ('tracking_number', 'recipient_name', 'sender__username')
    readonly_fields = ('tracking_number', 'qr_code', 'created_at', 'updated_at')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Ensure status field uses the model's choices
        if 'status' in form.base_fields:
            form.base_fields['status'].choices = Package.STATUS_CHOICES
        return form

@admin.register(ServiceArea)
class ServiceAreaAdmin(admin.ModelAdmin):
    list_display = ('area_name', 'base_rate', 'per_mile_rate', 'active')
    list_filter = ('active',)