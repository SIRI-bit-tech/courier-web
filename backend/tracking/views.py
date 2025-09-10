from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TrackingEvent
from .serializers import TrackingEventSerializer

class TrackingEventListView(generics.ListAPIView):
    serializer_class = TrackingEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tracking_number = self.kwargs.get('tracking_number')
        return TrackingEvent.objects.filter(package__tracking_number=tracking_number)

class AdminTrackingEventViewSet(viewsets.ModelViewSet):
    queryset = TrackingEvent.objects.all().select_related('package')
    serializer_class = TrackingEventSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Only allow superusers to access admin endpoints
        if self.request.user.is_superuser:
            return [IsAuthenticated()]
        return []

    @action(detail=False, methods=['get'])
    def recent_events(self, request):
        """Get recent tracking events for admin dashboard"""
        recent_events = TrackingEvent.objects.select_related('package').order_by('-timestamp')[:10]
        serializer = self.get_serializer(recent_events, many=True)
        return Response(serializer.data)
