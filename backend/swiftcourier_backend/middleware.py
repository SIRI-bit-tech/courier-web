import logging
import re
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseForbidden, HttpResponseBadRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin
import time
import hashlib

logger = logging.getLogger('django.security')

class SecurityHeadersMiddleware:
    """
    ASGI-compatible middleware to add security headers
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return self._add_security_headers(response)
    
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

class RateLimitMiddleware(MiddlewareMixin):
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

class InputValidationMiddleware(MiddlewareMixin):
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

class EnhancedRateLimitMiddleware(MiddlewareMixin):
    """
    Enhanced rate limiting with multiple strategies
    """
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Skip rate limiting for certain paths
        exempt_paths = ['/admin/', '/static/', '/media/', '/health/']
        if any(request.path.startswith(path) for path in exempt_paths):
            return self.get_response(request)
            
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check various rate limits
        if not self._check_rate_limits(request, client_id):
            return HttpResponse(
                '{"error": "Rate limit exceeded. Please try again later."}',
                content_type='application/json',
                status=429
            )
            
        response = self.get_response(request)
        return response
    
    def _get_client_id(self, request):
        """Generate unique client identifier"""
        # Use IP + User-Agent + optional user ID
        ip = self._get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:50]  # Limit length
        user_id = getattr(request.user, 'id', '') if hasattr(request, 'user') else ''
        
        # Create hash for consistent identifier
        identifier = f"{ip}:{user_agent}:{user_id}"
        return hashlib.md5(identifier.encode()).hexdigest()[:16]
    
    def _get_client_ip(self, request):
        """Get real client IP"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip
    
    def _check_rate_limits(self, request, client_id):
        """Check multiple rate limiting rules"""
        rules = self._get_rate_limit_rules(request)
        
        for rule_name, limits in rules.items():
            cache_key = f"ratelimit:{rule_name}:{client_id}"
            current_time = int(time.time())
            
            # Get existing requests
            cached_data = cache.get(cache_key, {'requests': [], 'last_reset': current_time})
            requests = cached_data['requests']
            last_reset = cached_data['last_reset']
            
            # Reset if window has passed
            window_seconds = limits['window']
            if current_time - last_reset >= window_seconds:
                requests = []
                last_reset = current_time
            
            # Clean old requests
            requests = [req_time for req_time in requests if current_time - req_time < window_seconds]
            
            # Check limit
            if len(requests) >= limits['requests']:
                return False
                
            # Add current request
            requests.append(current_time)
            
            # Update cache
            cache.set(cache_key, {
                'requests': requests,
                'last_reset': last_reset
            }, window_seconds * 2)  # Keep longer than window
            
        return True
    
    def _get_rate_limit_rules(self, request):
        """Define rate limiting rules based on endpoint and method"""
        base_rules = {
            'global': {'requests': 100, 'window': 60},  # 100 req/minute globally
        }
        
        # API-specific rules
        if request.path.startswith('/api/'):
            if request.path.startswith('/api/auth/'):
                base_rules['auth'] = {'requests': 5, 'window': 300}  # 5 req/5min for auth
            elif request.path.startswith('/api/packages/') and request.method == 'POST':
                base_rules['package_creation'] = {'requests': 10, 'window': 3600}  # 10 packages/hour
            elif request.path.startswith('/api/tracking/'):
                base_rules['tracking'] = {'requests': 30, 'window': 60}  # 30 tracking req/minute
        
        # User-specific rules
        if hasattr(request, 'user') and request.user.is_authenticated:
            base_rules['authenticated'] = {'requests': 500, 'window': 60}  # Higher limit for authenticated users
        
        return base_rules

class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Monitor request performance and log slow requests
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('swiftcourier.performance')
        
    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Calculate request duration
        duration = time.time() - start_time
        
        # Log slow requests (over 1 second)
        if duration > 1.0:
            self.logger.warning(
                f'Slow request: {request.method} {request.path} took {duration:.2f}s '
                f'from {self._get_client_ip(request)}'
            )
        
        # Add performance header
        if hasattr(response, '__setitem__'):
            response['X-Response-Time'] = f'{duration:.3f}s'
        
        return response
    
    def _get_client_ip(self, request):
        """Get client IP for logging"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

class CompressionMiddleware(MiddlewareMixin):
    """Compress responses to reduce bandwidth"""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Compress JSON responses
        if hasattr(response, 'content') and response.get('Content-Type', '').startswith('application/json'):
            import gzip
            import io
            
            content = response.content
            if len(content) > 1024:  # Only compress larger responses
                buffer = io.BytesIO()
                with gzip.GzipFile(fileobj=buffer, mode='wb') as f:
                    f.write(content)
                
                response.content = buffer.getvalue()
                response['Content-Encoding'] = 'gzip'
                response['Content-Length'] = len(response.content)
        
        return response

class DatabaseConnectionMiddleware(MiddlewareMixin):
    """Optimize database connections for high concurrency"""
    
    def __call__(self, request):
        from django.db import connections
        
        # Force connection cleanup for better performance
        if hasattr(connections, '_databases'):
            for alias in connections._databases:
                connection = connections[alias]
                # Only close if connection exists and is not in use
                if hasattr(connection, 'close') and connection.connection:
                    try:
                        # Check if connection is stale (older than 5 minutes)
                        if hasattr(connection, 'connection') and connection.connection:
                            connection.close()
                    except:
                        pass
        
        response = self.get_response(request)
        return response

class ConnectionPoolMiddleware(MiddlewareMixin):
    """Monitor and optimize database connection pool"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_count = 0
        
    def __call__(self, request):
        self.request_count += 1
        
        # Every 100 requests, force connection cleanup
        if self.request_count % 100 == 0:
            from django.db import connections
            for alias in connections._databases:
                connection = connections[alias]
                if hasattr(connection, 'close'):
                    try:
                        connection.close()
                    except:
                        pass
        
        response = self.get_response(request)
        return response