# backend/tracking/consumers.py
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from django.core.cache import cache
from .models import TrackingEvent
from packages.models import Package

User = get_user_model()

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tracking_number = self.scope['url_route']['kwargs']['tracking_number']
        self.room_group_name = f'tracking_{self.tracking_number}'
        
        # Authenticate user from token
        self.user = await self.get_user_from_token()
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'tracking_number': self.tracking_number,
            'authenticated': not isinstance(self.user, AnonymousUser)
        }))

        # Send current package status
        package_data = await self.get_package_data()
        if package_data:
            await self.send(text_data=json.dumps({
                'type': 'package_status',
                'data': package_data
            }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    @database_sync_to_async
    def get_user_from_token(self):
        try:
            # Get token from query string
            query_string = self.scope.get('query_string', b'').decode()
            token = None
            
            if query_string:
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=')[1]
                        break
            
            if token:
                # Validate and decode JWT token
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                user = User.objects.get(id=user_id)
                return user
                
            return AnonymousUser()
        except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
            return AnonymousUser()

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': str(asyncio.get_event_loop().time())
                }))
            elif message_type == 'request_update':
                # Send current package data
                package_data = await self.get_package_data()
                if package_data:
                    await self.send(text_data=json.dumps({
                        'type': 'package_status',
                        'data': package_data
                    }))
                    
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def package_update(self, event):
        """Handle package update events from Django signals"""
        await self.send(text_data=json.dumps({
            'type': 'package_update',
            'data': event['data']
        }))

    async def tracking_event_created(self, event):
        """Handle new tracking events"""
        await self.send(text_data=json.dumps({
            'type': 'tracking_event',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_package_data(self):
        """Get current package data from database"""
        try:
            # Use select_related for better performance
            package = Package.objects.select_related('sender').get(
                tracking_number=self.tracking_number
            )
            
            # Get recent tracking events (last 10)
            recent_events = TrackingEvent.objects.filter(
                package=package
            ).select_related('created_by').order_by('-timestamp')[:10]
            
            return {
                'tracking_number': package.tracking_number,
                'status': package.status,
                'current_location': package.current_location,
                'latitude': float(package.current_latitude) if package.current_latitude else None,
                'longitude': float(package.current_longitude) if package.current_longitude else None,
                'estimated_delivery': package.estimated_delivery.isoformat() if package.estimated_delivery else None,
                'last_updated': package.updated_at.isoformat(),
                'recipient_name': package.recipient_name,
                'recipient_address': package.recipient_address,
                'sender_name': package.sender_name,
                'weight': str(package.weight),
                'package_type': package.package_type,
                'tracking_events': [
                    {
                        'id': event.id,
                        'status': event.status,
                        'description': event.description,
                        'location': event.location,
                        'timestamp': event.timestamp.isoformat(),
                        'created_by': event.created_by.username if event.created_by else 'System'
                    } for event in recent_events
                ]
            }
        except Package.DoesNotExist:
            return None
        except Exception as e:
            # Log error but don't crash
            print(f"Error getting package data: {e}")
            return None
