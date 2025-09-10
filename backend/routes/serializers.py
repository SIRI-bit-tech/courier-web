from rest_framework import serializers
from .models import Route, RouteStop
from packages.serializers import PackageSerializer

class RouteStopSerializer(serializers.ModelSerializer):
    package = PackageSerializer(read_only=True)

    class Meta:
        model = RouteStop
        fields = '__all__'

class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)

    class Meta:
        model = Route
        fields = '__all__'
