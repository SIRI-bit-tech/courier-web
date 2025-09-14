from rest_framework import serializers
from .models import Package, ServiceArea
from decimal import Decimal
# import googlemaps

class ServiceAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = '__all__'

class PackageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Package
        fields = '__all__'
        read_only_fields = ('tracking_number', 'qr_code', 'created_at', 'updated_at')

    def get_qr_code_url(self, obj):
        if obj.qr_code:
            return obj.qr_code.url
        return None

class PackageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = (
            'tracking_number',  # Add this for the response
            'sender_name', 'sender_phone', 'sender_address', 'sender_city', 
            'sender_state', 'sender_zip', 'recipient_name', 'recipient_phone', 
            'recipient_address', 'recipient_city', 'recipient_state', 'recipient_zip',
            'package_type', 'weight', 'length', 'width', 'height', 'declared_value',
        )
        read_only_fields = ('tracking_number',)  # Make it read-only
    
    def validate_weight(self, value):
        if not value or value <= 0:
            raise serializers.ValidationError("Weight must be greater than 0.")
        return value
    
    def validate_sender_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Sender name is required.")
        return value.strip()
    
    def validate_sender_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Sender address is required.")
        return value.strip()
    
    def validate_recipient_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Recipient name is required.")
        return value.strip()
    
    def validate_recipient_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Recipient address is required.")
        return value.strip()
    
    def validate_package_type(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Package type is required.")
        return value.strip()

    def create(self, validated_data):
        """Create a new package with the authenticated user as sender"""
        # Get the authenticated user from request context
        user = self.context['request'].user
        
        # Ensure user is authenticated
        if not user or not user.is_authenticated:
            # print("❌ User not authenticated")
            raise serializers.ValidationError("User must be authenticated to create a package.")
        
        # print(f"✅ User authenticated: {user.username} (ID: {user.id})")
        
        # Calculate shipping cost
        shipping_cost = self.calculate_shipping_cost(validated_data)
        
        # Create package with sender
        validated_data['shipping_cost'] = shipping_cost
        validated_data['sender'] = user
        
        return Package.objects.create(**validated_data)
    
    def calculate_shipping_cost(self, data):
        """Calculate shipping cost based on package specifications"""
        base_cost = Decimal('10.00')
        weight_cost = data.get('weight', 0) * Decimal('2.00')
        
        # Volume calculation (length × width × height in cubic meters)
        length = data.get('length', 0)
        width = data.get('width', 0)
        height = data.get('height', 0)
        volume = (length * width * height) / 1000000  # Convert to cubic meters
        volume_cost = Decimal(str(volume)) * Decimal('5.00')
        
        return base_cost + weight_cost + volume_cost

class RateCalculationSerializer(serializers.Serializer):
    sender_address = serializers.CharField()
    recipient_address = serializers.CharField()
    weight = serializers.DecimalField(max_digits=10, decimal_places=2)
    length = serializers.DecimalField(max_digits=10, decimal_places=2)
    width = serializers.DecimalField(max_digits=10, decimal_places=2)
    height = serializers.DecimalField(max_digits=10, decimal_places=2)
    package_type = serializers.CharField()
