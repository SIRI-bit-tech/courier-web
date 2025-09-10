from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer, UserSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_drivers(request):
    drivers = User.objects.filter(user_type='driver', is_active_driver=True)
    serializer = UserSerializer(drivers, many=True)
    return Response(serializer.data)

class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only viewset for managing all users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all()
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        return queryset.order_by('-created_at')

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Separate login endpoint for admin users"""
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user and user.is_superuser:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    
    return Response({'error': 'Invalid admin credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Get admin dashboard statistics"""
    from django.db.models import Count, Sum
    from packages.models import Package
    from datetime import date
    
    stats = {
        'total_users': User.objects.count(),
        'total_customers': User.objects.filter(user_type='customer').count(),
        'total_drivers': User.objects.filter(user_type='driver').count(),
        'active_drivers': User.objects.filter(user_type='driver', is_active_driver=True).count(),
        'total_packages': Package.objects.count(),
        'packages_today': Package.objects.filter(created_at__date=date.today()).count(),
        'delivered_packages': Package.objects.filter(status='delivered').count(),
        'pending_packages': Package.objects.filter(status__in=['pending', 'picked_up', 'in_transit']).count(),
    }
    
    return Response(stats)
