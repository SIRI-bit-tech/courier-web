import logging
from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    APIException, AuthenticationFailed, NotAuthenticated,
    PermissionDenied as DRFPermissionDenied, ValidationError
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger('django.security')

def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides secure error responses
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log security-related exceptions
        if isinstance(exc, (AuthenticationFailed, NotAuthenticated, DRFPermissionDenied)):
            logger.warning(f'Security exception: {exc.__class__.__name__} - {str(exc)}')
        
        # Sanitize error messages for production
        if hasattr(response, 'data'):
            # Remove sensitive information from error messages
            if isinstance(response.data, dict):
                response.data = sanitize_error_data(response.data)
            elif isinstance(response.data, list):
                response.data = [sanitize_error_data(item) if isinstance(item, dict) else item 
                               for item in response.data]
    
    # Handle custom exceptions
    if isinstance(exc, APIException):
        return response
    
    # Handle Django exceptions
    if isinstance(exc, PermissionDenied):
        return Response(
            {'error': 'You do not have permission to perform this action.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if isinstance(exc, Http404):
        return Response(
            {'error': 'The requested resource was not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle unexpected exceptions
    logger.error(f'Unexpected exception: {exc.__class__.__name__} - {str(exc)}', exc_info=True)
    return Response(
        {'error': 'An unexpected error occurred. Please try again later.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

def sanitize_error_data(data):
    """
    Remove sensitive information from error data
    """
    sensitive_keys = [
        'password', 'token', 'key', 'secret', 'private', 'auth',
        'authorization', 'bearer', 'jwt', 'session', 'cookie'
    ]
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            key_lower = key.lower()
            # Check if key contains sensitive information
            if any(sensitive in key_lower for sensitive in sensitive_keys):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = sanitize_error_data(value)
            elif isinstance(value, list):
                sanitized[key] = [sanitize_error_data(item) if isinstance(item, dict) else item 
                                for item in data]
            else:
                sanitized[key] = value
        return sanitized
    
    return data

class SecurityException(APIException):
    """
    Custom security exception
    """
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Security policy violation'
    default_code = 'security_violation'

class RateLimitException(APIException):
    """
    Custom rate limit exception
    """
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded. Please try again later.'
    default_code = 'rate_limit_exceeded'

class InputValidationException(APIException):
    """
    Custom input validation exception
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input detected'
    default_code = 'invalid_input'