# backend/packages/models.py
from django.db import models
from django.conf import settings
from django.core.files.storage import default_storage
import uuid
import qrcode
import os
from PIL import Image
from io import BytesIO


class Package(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('picked_up', 'Picked Up'),
        ('on_hold', 'On Hold'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed_delivery', 'Failed Delivery'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    ]

    PACKAGE_TYPE_CHOICES = [
        ('document', 'Document'),
        ('package', 'Package'),
        ('fragile', 'Fragile'),
        ('perishable', 'Perishable'),
    ]

    # Core fields
    tracking_number = models.CharField(
        max_length=20, 
        unique=True, 
        editable=False,
        db_index=True  # Added index for faster lookups
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='sent_packages',
        db_index=True
    )
    
    # Package details - Allow blank values for form validation
    sender_name = models.CharField(max_length=100, db_index=True, blank=True)
    sender_email = models.EmailField(blank=True)
    sender_phone = models.CharField(max_length=20, blank=True)
    sender_address = models.TextField(blank=True)
    sender_city = models.CharField(max_length=100, blank=True)
    sender_state = models.CharField(max_length=100, blank=True)
    sender_zip = models.CharField(max_length=10, blank=True)
    
    recipient_name = models.CharField(max_length=100, db_index=True, blank=True)
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    recipient_address = models.TextField(blank=True)
    recipient_city = models.CharField(max_length=100, blank=True)
    recipient_state = models.CharField(max_length=100, blank=True)
    recipient_zip = models.CharField(max_length=10, blank=True)
    
    # Package specifications
    weight = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    package_type = models.CharField(
        max_length=20, 
        choices=PACKAGE_TYPE_CHOICES, 
        default='package',
        db_index=True
    )
    
    # Dimensions - Remove defaults
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    declared_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status and location - Keep defaults for these as they're auto-generated
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        db_index=True
    )
    current_location = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    current_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True, default=0)
    current_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True, default=0)
    
    # Delivery details
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    
    # Pricing
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    base_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    distance_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Files
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at'], name='package_status_created_idx'),
            models.Index(fields=['tracking_number'], name='package_tracking_idx'),
            models.Index(fields=['sender', 'status'], name='package_sender_status_idx'),
            models.Index(fields=['created_at'], name='package_created_at_idx'),
            models.Index(fields=['recipient_name'], name='package_recipient_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = self.generate_tracking_number()
        
        super().save(*args, **kwargs)
        
        if not self.qr_code:
            self.generate_qr_code()

    def generate_tracking_number(self):
        return f"SC{uuid.uuid4().hex[:8].upper()}"

    def generate_qr_code(self):
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(self.tracking_number)
        qr.make(fit=True)
        
        img = qr.make_image(fill='black', back_color='white')
        
        # Save to BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Save to storage
        file_name = f'{self.tracking_number}.png'
        file_path = f'qr_codes/{file_name}'
        
        if default_storage.exists(file_path):
            default_storage.delete(file_path)
            
        self.qr_code.save(file_path, buffer, save=False)
        
        # Close buffer
        buffer.close()

    def __str__(self):
        return f"{self.tracking_number} - {self.recipient_name}"

    @property
    def get_status_display(self):
        return dict(self.STATUS_CHOICES)[self.status]


class ServiceArea(models.Model):
    area_name = models.CharField(max_length=100, unique=True, db_index=True)
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    per_mile_rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True, db_index=True)
    coordinates = models.JSONField(null=True, blank=True)  # GeoJSON for area boundaries
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['area_name'], name='servicearea_name_idx'),
            models.Index(fields=['active'], name='servicearea_active_idx'),
        ]

    def __str__(self):
        return self.area_name
