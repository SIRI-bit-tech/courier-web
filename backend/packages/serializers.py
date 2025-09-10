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
            'sender_name', 'sender_phone', 'sender_address', 'sender_city', 
            'sender_state', 'sender_zip', 'recipient_name', 'recipient_phone', 
            'recipient_address', 'recipient_city', 'recipient_state', 'recipient_zip',
            'package_type', 'weight', 'length', 'width', 'height', 'declared_value',
            'delivery_instructions'
        )

    def create(self, validated_data):
        # Calculate shipping cost based on distance and package specs
        shipping_cost = self.calculate_shipping_cost(validated_data)
        validated_data['shipping_cost'] = shipping_cost
        validated_data['sender'] = self.context['request'].user
        
        return Package.objects.create(**validated_data)

    def calculate_shipping_cost(self, data):
        # Basic calculation - in production, integrate with Google Maps Distance Matrix
        base_cost = Decimal('10.00')
        weight_cost = data['weight'] * Decimal('2.00')
        volume = data['length'] * data['width'] * data['height'] / 1000000  # cubic meters
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
