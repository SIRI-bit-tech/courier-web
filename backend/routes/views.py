from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer

class RouteListView(generics.ListAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Route.objects.all()
        elif user.user_type == 'driver':
            return Route.objects.filter(driver=user)
        else:
            return Route.objects.none()

class RouteDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Route.objects.all()
        elif user.user_type == 'driver':
            return Route.objects.filter(driver=user)
        else:
            return Route.objects.none()

class AdminRouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all().select_related('driver')
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Only allow superusers to access admin endpoints
        if self.request.user.is_superuser:
            return [IsAuthenticated()]
        return []

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get route statistics for admin dashboard"""
        total_routes = Route.objects.count()
        active_routes = Route.objects.filter(status='in_progress').count()
        completed_routes = Route.objects.filter(status='completed').count()
        
        return Response({
            'total_routes': total_routes,
            'active_routes': active_routes,
            'completed_routes': completed_routes,
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def optimize_routes(request):
    # Basic route optimization - in production, integrate with Google Maps
    # This is a simplified version
    from packages.models import Package
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Get packages that need delivery
    pending_packages = Package.objects.filter(
        status__in=['picked_up', 'in_transit']
    )
    
    # Get available drivers
    drivers = User.objects.filter(user_type='driver', is_active_driver=True)
    
    optimized_routes = []
    for driver in drivers:
        route_data = {
            'driver_id': driver.id,
            'driver_name': driver.get_full_name(),
            'packages': []
        }
        
        # Simple assignment - assign packages to drivers
        # In production, use Google Maps API for route optimization
        driver_packages = pending_packages[:5]  # Limit to 5 packages per driver
        
        for package in driver_packages:
            route_data['packages'].append({
                'tracking_number': package.tracking_number,
                'recipient_name': package.recipient_name,
                'address': package.recipient_address,
                'city': package.recipient_city,
            })
        
        optimized_routes.append(route_data)
    
    return Response({'optimized_routes': optimized_routes})
