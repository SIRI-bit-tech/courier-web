import logging
import re
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseForbidden, HttpResponseBadRequest

logger = logging.getLogger('django.security')

class SecurityHeadersMiddleware:
    """
    ASGI-compatible middleware to add security headers
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Handle both sync and async responses
        if hasattr(response, '__await__'):
            # This is an async response (coroutine)
            return self._handle_async_response(response)
        else:
            # This is a sync response
            return self._add_security_headers(response)
    
    async def _handle_async_response(self, response):
        """Handle async responses from ASGI applications"""
        try:
            # Await the coroutine to get the actual response
            actual_response = await response
            
            # Add security headers to the actual response
            return self._add_security_headers(actual_response)
        except Exception as e:
            # If there's an error awaiting, return the original response
            logger.warning(f'Error handling async response: {e}')
            return response
    
    def _add_security_headers(self, response):
        """Add security headers to response"""
        try:
            # Prevent clickjacking
            response['X-Frame-Options'] = 'DENY'
            
            # Prevent MIME type sniffing
            response['X-Content-Type-Options'] = 'nosniff'
            
            # Enable XSS protection
            response['X-XSS-Protection'] = '1; mode=block'
            
            # Referrer policy
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            
            # Content Security Policy
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https://maps.googleapis.com wss://* ws://*; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
            response['Content-Security-Policy'] = csp
            
            # Feature policy
            response['Feature-Policy'] = (
                "geolocation 'self'; "
                "camera 'none'; "
                "microphone 'none'; "
                "payment 'none';"
            )
            
            return response
        except Exception as e:
            # If headers can't be added, log and return original response
            logger.warning(f'Error adding security headers: {e}')
            return response

class RateLimitMiddleware:
    """
    Rate limiting middleware for API endpoints - ASGI compatible
    """
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Skip rate limiting for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return self.get_response(request)
            
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Define rate limits
        rate_limits = {
            '/api/auth/token/': {'requests': 5, 'window': 300},  # 5 requests per 5 minutes
            '/api/accounts/register/': {'requests': 3, 'window': 3600},  # 3 requests per hour
            '/api/packages/': {'requests': 100, 'window': 3600},  # 100 requests per hour
        }
        
        for path, limits in rate_limits.items():
            if request.path.startswith(path):
                if not self.check_rate_limit(client_ip, path, limits['requests'], limits['window']):
                    logger.warning(f'Rate limit exceeded for {client_ip} on {request.path}')
                    return HttpResponseForbidden('Rate limit exceeded. Please try again later.')
                break
                
        response = self.get_response(request)
        
        # Handle async response
        if hasattr(response, '__await__'):
            return self._handle_async_response(response)
        return response
    
    async def _handle_async_response(self, response):
        """Handle async responses"""
        try:
            return await response
        except Exception as e:
            logger.warning(f'Error in rate limit middleware: {e}')
            return response
    
    def get_client_ip(self, request):
        """Get the real client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def check_rate_limit(self, client_ip, path, max_requests, window):
        """Check if request is within rate limits"""
        cache_key = f"ratelimit:{client_ip}:{path}"
        requests = cache.get(cache_key, [])
        
        # Remove old requests outside the window
        current_time = int(__import__('time').time())
        requests = [req_time for req_time in requests if current_time - req_time < window]
        
        if len(requests) >= max_requests:
            return False
            
        # Add current request
        requests.append(current_time)
        cache.set(cache_key, requests, window)
        
        return True

class InputValidationMiddleware:
    """
    Middleware to validate and sanitize input - ASGI compatible
    """
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Validate request method
        if request.method not in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']:
            return HttpResponseBadRequest('Invalid request method')
            
        # Check for suspicious patterns in request data
        if self.contains_suspicious_patterns(request):
            logger.warning(f'Suspicious request detected from {self.get_client_ip(request)}')
            return HttpResponseForbidden('Request blocked due to security policy')
            
        response = self.get_response(request)
        
        # Handle async response
        if hasattr(response, '__await__'):
            return self._handle_async_response(response)
        return response
    
    async def _handle_async_response(self, response):
        """Handle async responses"""
        try:
            return await response
        except Exception as e:
            logger.warning(f'Error in input validation middleware: {e}')
            return response
    
    def get_client_ip(self, request):
        """Get the real client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def contains_suspicious_patterns(self, request):
        """Check for SQL injection, XSS, and other attack patterns"""
        suspicious_patterns = [
            r'<script[^>]*>.*?</script>',  # XSS
            r'javascript:',  # JavaScript injection
            r'on\w+\s*=',  # Event handlers
            r'union\s+select',  # SQL injection
            r';\s*drop\s+table',  # SQL injection
            r';\s*delete\s+from',  # SQL injection
            r'--',  # SQL comment
            r'/\*.*\*/',  # SQL comment
        ]
        
        # Check POST data
        if request.method in ['POST', 'PUT', 'PATCH']:
            for key, value in request.POST.items():
                if isinstance(value, str):
                    for pattern in suspicious_patterns:
                        if re.search(pattern, value, re.IGNORECASE):
                            return True
                            
        # Check GET parameters
        for key, value in request.GET.items():
            if isinstance(value, str):
                for pattern in suspicious_patterns:
                    if re.search(pattern, value, re.IGNORECASE):
                        return True
                        
        return False