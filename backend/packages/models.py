from django.db import models
from django.contrib.auth import get_user_model
import uuid
import qrcode
from io import BytesIO
from django.core.files import File

User = get_user_model()

class ServiceArea(models.Model):
    area_name = models.CharField(max_length=100)
    coordinates = models.JSONField()  # Store polygon coordinates
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    per_mile_rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.area_name

class Package(models.Model):
    PACKAGE_STATUS = (
        ('pending', 'Pending'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed_delivery', 'Failed Delivery'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    )

    PACKAGE_TYPE = (
        ('document', 'Document'),
        ('package', 'Package'),
        ('fragile', 'Fragile'),
        ('perishable', 'Perishable'),
    )

    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_packages')
    
    # Sender Information
    sender_name = models.CharField(max_length=100)
    sender_phone = models.CharField(max_length=20)
    sender_address = models.TextField()
    sender_city = models.CharField(max_length=100)
    sender_state = models.CharField(max_length=100)
    sender_zip = models.CharField(max_length=10)
    
    # Recipient Information
    recipient_name = models.CharField(max_length=100)
    recipient_phone = models.CharField(max_length=20)
    recipient_address = models.TextField()
    recipient_city = models.CharField(max_length=100)
    recipient_state = models.CharField(max_length=100)
    recipient_zip = models.CharField(max_length=10)
    
    # Package Details
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE, default='package')
    weight = models.DecimalField(max_digits=10, decimal_places=2)  # in kg
    length = models.DecimalField(max_digits=10, decimal_places=2)  # in cm
    width = models.DecimalField(max_digits=10, decimal_places=2)   # in cm
    height = models.DecimalField(max_digits=10, decimal_places=2)  # in cm
    declared_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=PACKAGE_STATUS, default='pending')
    current_location = models.CharField(max_length=200, blank=True)
    current_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Pricing
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2)
    service_area = models.ForeignKey(ServiceArea, on_delete=models.SET_NULL, null=True)
    
    # Delivery Information
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    delivery_instructions = models.TextField(blank=True)
    
    # QR Code
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        self.qr_code.save(
            f'{self.tracking_number}.png',
            File(buffer),
            save=False
        )
        self.save()

    def __str__(self):
        return f"{self.tracking_number} - {self.recipient_name}"
