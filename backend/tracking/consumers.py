# backend/tracking/consumers.py
import json
import asyncio
import os
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
                        token = param.split('=', 1)[1]
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
            # Ensure text_data is a string before parsing
            if isinstance(text_data, str):
                data = json.loads(text_data)
            else:
                # If it's already a dict, use it directly
                data = text_data
            
            # Ensure data is a dictionary
            if not isinstance(data, dict):
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Invalid message format'
                }))
                return
            
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


class NotificationsConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""

    async def connect(self):
        try:
            # Authenticate user from token
            self.user = await self.get_user_from_token()

            if isinstance(self.user, AnonymousUser):
                # For development, allow anonymous connections
                if os.getenv('DEBUG', 'False').lower() == 'true':
                    # Create anonymous group for development
                    self.room_group_name = f'anonymous_{id(self)}'
                    
                    await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                    )
                    
                    await self.accept()
                    
                    await self.send(text_data=json.dumps({
                        'type': 'connection_established',
                        'user_id': None,
                        'user_email': None,
                        'authenticated': False,
                        'mode': 'development'
                    }))
                    
                    return
                else:
                    # Production: reject unauthorized connections
                    await self.close(code=4001)  # Unauthorized
                    return

            # Authenticated user connection
            self.room_group_name = f'notifications_{self.user.id}'

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()

            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'user_id': self.user.id,
                'user_email': self.user.email,
                'authenticated': True
            }))

            # Only send packages for authenticated users
            await self.send_user_packages()
            
        except Exception as e:
            print(f"[WS] Connection error: {e}")
            await self.close(code=1011)  # Internal error

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
        except Exception as e:
            print(f"[WS] Disconnect error: {e}")

    @database_sync_to_async
    def get_user_from_token(self):
        try:
            query_string = self.scope.get('query_string', b'').decode()
            token = None

            if query_string:
                for param in query_string.split('&'):
                    if param.startswith('token='):
                        token = param.split('=', 1)[1]  # Use split with maxsplit
                        break

            if token:
                # URL decode the token
                from urllib.parse import unquote
                token = unquote(token)
                
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                user = User.objects.get(id=user_id)
                return user

            return AnonymousUser()
        except Exception as e:
            print(f"[WS] Token validation error: {e}")
            return AnonymousUser()

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            # Ensure text_data is a string before parsing
            if isinstance(text_data, str):
                data = json.loads(text_data)
            else:
                # If it's already a dict, use it directly
                data = text_data
            
            # Ensure data is a dictionary
            if not isinstance(data, dict):
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Invalid message format'
                }))
                return
            
            message_type = data.get('type')

            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': str(asyncio.get_event_loop().time())
                }))
            elif message_type == 'request_packages':
                # Send user's packages
                await self.send_user_packages()
            elif message_type == 'mark_notification_read':
                # Mark notification as read (if you implement notifications later)
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Unknown message type'
                }))

        except json.JSONDecodeError as e:
            print(f"[WS] JSON decode error: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            print(f"[WS] Receive error: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))

    @database_sync_to_async
    def get_user_packages(self):
        """Get user's packages with recent status"""
        try:
            # Get user's packages (sent packages)
            packages = Package.objects.filter(sender=self.user).order_by('-created_at')[:10]

            package_data = []
            for package in packages:
                # Get latest tracking event
                latest_event = TrackingEvent.objects.filter(
                    package=package
                ).order_by('-timestamp').first()

                package_data.append({
                    'id': package.id,
                    'tracking_number': package.tracking_number,
                    'status': package.status,
                    'recipient_name': package.recipient_name,
                    'recipient_address': package.recipient_address,
                    'created_at': package.created_at.isoformat(),
                    'updated_at': package.updated_at.isoformat(),
                    'current_location': package.current_location,
                    'latitude': float(package.current_latitude) if package.current_latitude else None,
                    'longitude': float(package.current_longitude) if package.current_longitude else None,
                    'estimated_delivery': package.estimated_delivery.isoformat() if package.estimated_delivery else None,
                    'latest_event': {
                        'status': latest_event.status if latest_event else package.status,
                        'description': latest_event.description if latest_event else f'Package {package.status}',
                        'location': latest_event.location if latest_event else package.current_location,
                        'timestamp': latest_event.timestamp.isoformat() if latest_event else package.created_at.isoformat(),
                    } if latest_event or package.status != 'pending' else None
                })

            return package_data
        except Exception as e:
            print(f"Error getting user packages: {e}")
            return []

    async def send_user_packages(self):
        """Send user's packages data"""
        packages = await self.get_user_packages()
        await self.send(text_data=json.dumps({
            'type': 'user_packages',
            'data': packages
        }))

    async def package_update(self, event):
        """Handle package update events"""
        # Check if this package belongs to the user
        if event['data'].get('sender_id') == self.user.id or hasattr(self, 'tracking_number'):
            await self.send(text_data=json.dumps({
                'type': 'package_update',
                'data': event['data']
            }))

    async def new_package_created(self, event):
        """Handle new package creation"""
        if event['data'].get('sender_id') == self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'new_package',
                'data': event['data']
            }))

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read (placeholder for future implementation)"""
        # This is a placeholder - implement when you add a notifications model
        pass
