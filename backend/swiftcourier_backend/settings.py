"""
Django settings for swiftcourier_backend project.
"""

from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
DJANGO_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'drf_yasg',
    'django_filters',
]

LOCAL_APPS = [
    'accounts',
    'packages',
    'tracking',
    'routes',
    'notifications',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# Security Middleware - Enhanced
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Custom security middleware
    'swiftcourier_backend.middleware.SecurityHeadersMiddleware',
    'swiftcourier_backend.middleware.RateLimitMiddleware',
    'swiftcourier_backend.middleware.InputValidationMiddleware',
    # Enhanced rate limiting
    'swiftcourier_backend.middleware.EnhancedRateLimitMiddleware',
]

ROOT_URLCONF = 'swiftcourier_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'swiftcourier_backend.wsgi.application'
ASGI_APPLICATION = 'swiftcourier_backend.asgi.application'

# Database - Enhanced Security
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Database security settings
if 'sqlite' in DATABASES['default']['ENGINE']:
    # SQLite optimizations for development
    DATABASES['default']['OPTIONS'] = {
        'init_command': 'PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;',
    }
else:
    # PostgreSQL security settings
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
        'sslrootcert': os.path.join(BASE_DIR, 'certs', 'ca.pem'),
        'sslcert': os.path.join(BASE_DIR, 'certs', 'client-cert.pem'),
        'sslkey': os.path.join(BASE_DIR, 'certs', 'client-key.pem'),
    }

# Enhanced Cache Configuration - Works in Dev & Prod
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 3600,
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    },
    'session': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'session-cache',
        'TIMEOUT': 86400,
    },
    'api': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'api-cache',
        'TIMEOUT': 1800,
        'OPTIONS': {
            'MAX_ENTRIES': 500,
        }
    },
    'database': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'db-cache',
        'TIMEOUT': 7200,
        'OPTIONS': {
            'MAX_ENTRIES': 200,
        }
    }
}

# Redis Cache Configuration (Auto-detects environment)
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')
REDIS_AVAILABLE = False

try:
    import redis
    r = redis.Redis.from_url(REDIS_URL)
    r.ping()  # Test connection
    REDIS_AVAILABLE = True
except (ImportError, redis.ConnectionError):
    REDIS_AVAILABLE = False

if REDIS_AVAILABLE:
    CACHES.update({
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'KEY_PREFIX': 'swiftcourier',
            'TIMEOUT': 300 if not DEBUG else 60,
        },
        'session': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': f"{REDIS_URL}/1",
            'KEY_PREFIX': 'session',
            'TIMEOUT': 86400,
        },
        'api': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': f"{REDIS_URL}/2",
            'KEY_PREFIX': 'api',
            'TIMEOUT': 600 if not DEBUG else 120,
        },
        'database': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': f"{REDIS_URL}/3",
            'KEY_PREFIX': 'db',
            'TIMEOUT': 3600 if not DEBUG else 300,
        }
    })

# Cache settings for different environments
if DEBUG:
    # Development cache settings
    CACHE_MIDDLEWARE_SECONDS = 0  # Disable cache middleware in dev
    CACHE_MIDDLEWARE_KEY_PREFIX = 'swiftcourier_dev'
else:
    # Production cache settings
    CACHE_MIDDLEWARE_SECONDS = 300  # 5 minutes
    CACHE_MIDDLEWARE_KEY_PREFIX = 'swiftcourier_prod'

# Password validation - Relaxed for development
if DEBUG:
    # Development - Basic validation only
    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
            'OPTIONS': {
                'min_length': 8,  # Relaxed from 12
            }
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
    ]
else:
    # Production - Full security validation
    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
            'OPTIONS': {
                'min_length': 12,
            }
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
        {
            'NAME': 'swiftcourier_backend.validators.CustomPasswordValidator',
        },
    ]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files - Enhanced Security
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Media files - Enhanced Security
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload security
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_TEMP_DIR = os.path.join(BASE_DIR, 'tmp')
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_NUMBER_FILES = 10

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ASGI settings
ASGI_THREADS = 4
ASGI_APPLICATION_TIMEOUT = 30

# WebSocket settings
WEBSOCKET_PING_INTERVAL = 20
WEBSOCKET_PING_TIMEOUT = 10

# Session settings - Enhanced Security
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'session'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'

# CSRF settings - Enhanced Security
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = [origin for origin in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if origin.strip()]

# Security headers - Enhanced
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# CORS Configuration - Enhanced Security
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.swiftcourier\.com$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# REST Framework configuration - Enhanced Security
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
        'register': '3/minute',
        'track': '60/minute',
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'EXCEPTION_HANDLER': 'swiftcourier_backend.exceptions.custom_exception_handler',
}

# JWT Configuration - Enhanced Security
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Shorter for security
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
}

# Channels Configuration - Enhanced Security
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [REDIS_URL or 'redis://127.0.0.1:6379/0'],
            "capacity": 1000,
            "expiry": 30,
            "group_expiry": 86400,  # 24 hours
        },
    },
}

# Google Maps API
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# Email Configuration - Enhanced Security
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Frontend URL for email links
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# SMS Configuration (Twilio) - Enhanced Security
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Celery Configuration
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL.replace('/0', '/1'))
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL.replace('/0', '/2'))
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Monitoring and Performance Settings
if not DEBUG:
    # Django Debug Toolbar (only in development)
    INSTALLED_APPS = [app for app in INSTALLED_APPS if not app.startswith('debug_toolbar')]
    
    # Performance monitoring
    MIDDLEWARE.insert(0, 'swiftcourier_backend.middleware.PerformanceMonitoringMiddleware')
    
    # Enhanced logging for production
    LOGGING['handlers']['file']['level'] = 'WARNING'
    LOGGING['handlers']['security_file']['level'] = 'WARNING'
    
    # Add performance logging
    LOGGING['loggers']['django.request']['level'] = 'WARNING'
    LOGGING['loggers']['swiftcourier.performance'] = {
        'handlers': ['file'],
        'level': 'INFO',
        'propagate': False,
    }

# Logging configuration - Enhanced Security
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'security': {
            'format': '{asctime} {levelname} {message} {name}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'security.log'),
            'formatter': 'security',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'certs'), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'tmp'), exist_ok=True)

# Performance optimizations
if not DEBUG:
    # Disable debug toolbar in production
    INSTALLED_APPS = [app for app in INSTALLED_APPS if not app.startswith('debug_toolbar')]

# Database connection optimization
CONN_MAX_AGE = 60
CONN_HEALTH_CHECKS = True