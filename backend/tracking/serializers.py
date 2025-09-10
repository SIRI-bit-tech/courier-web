from rest_framework import serializers
from .models import TrackingEvent

class TrackingEventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = TrackingEvent
        fields = '__all__'
        read_only_fields = ('timestamp',)
