from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'is_active_driver', 'created_at')
    list_filter = ('user_type', 'is_active_driver', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone_number', 'address', 'city', 'state', 
                      'zip_code', 'country', 'is_active_driver', 'driver_license', 
                      'vehicle_info')
        }),
    )
