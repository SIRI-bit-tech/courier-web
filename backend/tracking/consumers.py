import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .models import TrackingEvent
from packages.models import Package

User = get_user_model()

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tracking_number = self.scope['url_route']['kwargs']['tracking_number']
        self.room_group_name = f'tracking_{self.tracking_number}'

        self.user = await self.get_user_from_token()
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

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
            token = None
            query_string = self.scope.get('query_string', b'').decode()
            if query_string:
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=')[1]
                        break
            
            if token:
                # Validate JWT token
                UntypedToken(token)
                # Get user from token (simplified - in production, decode properly)
                return User.objects.first()  # Placeholder - implement proper JWT decoding
            return AnonymousUser()
        except (InvalidToken, TokenError):
            return AnonymousUser()

    async def receive(self, text_data):
        # Handle incoming WebSocket messages if needed
        pass

    async def package_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'package_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def get_package_data(self):
        try:
            package = Package.objects.get(tracking_number=self.tracking_number)
            return {
                'tracking_number': package.tracking_number,
                'status': package.status,
                'current_location': package.current_location,
                'latitude': package.current_latitude,
                'longitude': package.current_longitude,
                'estimated_delivery': package.estimated_delivery.isoformat() if package.estimated_delivery else None,
                'last_updated': package.updated_at.isoformat()
            }
        except Package.DoesNotExist:
            return None
