from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Package, ServiceArea
from .serializers import (
    PackageSerializer, PackageCreateSerializer, 
    RateCalculationSerializer, ServiceAreaSerializer
)
from decimal import Decimal
from notifications.tasks import send_admin_notification_email
from django.db import models

class PackageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PackageCreateSerializer
        return PackageSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Package.objects.all()
        elif user.user_type == 'driver':
            # Return packages assigned to this driver's routes
            return Package.objects.filter(route_stops__route__driver=user)
        else:
            return Package.objects.filter(sender=user)

class PackageDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Package.objects.all()
        elif user.user_type == 'driver':
            return Package.objects.filter(route_stops__route__driver=user)
        else:
            return Package.objects.filter(sender=user)

class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.select_related('sender').prefetch_related('tracking_events')
    serializer_class = PackageSerializer
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    @method_decorator(vary_on_headers('Authorization'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(60))  # Cache for 1 minute
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

# Admin-specific viewsets for Django admin integration
class AdminPackageViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for managing all packages"""
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Package.objects.all()
        status_filter = self.request.query_params.get('status', None)
        sender_filter = self.request.query_params.get('sender', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if sender_filter:
            queryset = queryset.filter(sender__username__icontains=sender_filter)
            
        return queryset.order_by('-created_at')

class AdminServiceAreaViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for managing service areas"""
    queryset = ServiceArea.objects.all()
    serializer_class = ServiceAreaSerializer
    permission_classes = [IsAdminUser]

@api_view(['GET'])
@permission_classes([AllowAny])
def track_package(request, tracking_number):
    try:
        package = Package.objects.get(tracking_number=tracking_number)
        serializer = PackageSerializer(package)
        return Response(serializer.data)
    except Package.DoesNotExist:
        return Response(
            {'error': 'Package not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def package_location(request, tracking_number):
    try:
        package = Package.objects.get(tracking_number=tracking_number)
        location_data = {
            'tracking_number': package.tracking_number,
            'current_location': package.current_location,
            'latitude': package.current_latitude,
            'longitude': package.current_longitude,
            'status': package.status,
            'last_updated': package.updated_at
        }
        return Response(location_data)
    except Package.DoesNotExist:
        return Response(
            {'error': 'Package not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def package_eta(request, tracking_number):
    try:
        package = Package.objects.get(tracking_number=tracking_number)
        eta_data = {
            'tracking_number': package.tracking_number,
            'estimated_delivery': package.estimated_delivery,
            'status': package.status
        }
        return Response(eta_data)
    except Package.DoesNotExist:
        return Response(
            {'error': 'Package not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_package_status(request, pk):
    if request.user.user_type not in ['driver', 'admin']:
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    package = get_object_or_404(Package, pk=pk)
    new_status = request.data.get('status')
    location = request.data.get('location', '')
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if new_status:
        package.status = new_status
        package.current_location = location
        if latitude:
            package.current_latitude = latitude
        if longitude:
            package.current_longitude = longitude
        package.save()
        
        # Create tracking event
        from tracking.models import TrackingEvent
        TrackingEvent.objects.create(
            package=package,
            status=new_status,
            description=f"Package status updated to {new_status}",
            location=location,
            created_by=request.user
        )
    
    serializer = PackageSerializer(package)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_rate(request):
    serializer = RateCalculationSerializer(data=request.data)
    if serializer.is_valid():
        # Basic rate calculation - integrate with Google Maps for accurate distance
        base_rate = Decimal('10.00')
        weight = serializer.validated_data['weight']
        length = serializer.validated_data['length']
        width = serializer.validated_data['width']
        height = serializer.validated_data['height']
        
        weight_cost = weight * Decimal('2.00')
        volume = length * width * height / 1000000  # cubic meters
        volume_cost = Decimal(str(volume)) * Decimal('5.00')
        
        total_cost = base_rate + weight_cost + volume_cost
        
        return Response({
            'base_rate': base_rate,
            'weight_cost': weight_cost,
            'volume_cost': volume_cost,
            'total_cost': total_cost,
            'currency': 'USD'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_send_email_notification(request, pk):
    """Admin endpoint to send custom email notifications for a package"""
    package = get_object_or_404(Package, pk=pk)
    
    recipient_email = request.data.get('recipient_email')
    subject = request.data.get('subject', 'Package Update')
    message = request.data.get('message', '')
    
    if not recipient_email or not message:
        return Response(
            {'error': 'recipient_email and message are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    send_admin_notification_email.delay(
        package_id=package.id,
        recipient_email=recipient_email,
        subject=subject,
        message=message
    )
    
    return Response({
        'message': 'Email notification queued successfully',
        'package': package.tracking_number,
        'recipient': recipient_email
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_generate_tracking_code(request):
    """Admin endpoint to generate a new package with tracking code"""
    serializer = PackageCreateSerializer(data=request.data)
    if serializer.is_valid():
        package = serializer.save(sender=request.user)
        
        # Send initial email notification
        send_admin_notification_email.delay(
            package_id=package.id,
            recipient_email=package.sender.email,
            subject='New Package Created',
            message=f'Your package has been created with tracking number: {package.tracking_number}. You can track it at our website.'
        )
        
        response_serializer = PackageSerializer(package)
        return Response({
            'package': response_serializer.data,
            'message': 'Package created successfully and email notification sent'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_package_statistics(request):
    """Admin endpoint to get package statistics"""
    from django.db.models import Count
    
    stats = Package.objects.aggregate(
        total_packages=Count('id'),
        pending_packages=Count('id', filter=models.Q(status='pending')),
        in_transit_packages=Count('id', filter=models.Q(status='in_transit')),
        delivered_packages=Count('id', filter=models.Q(status='delivered')),
        failed_packages=Count('id', filter=models.Q(status='failed_delivery'))
    )
    
    return Response(stats)
