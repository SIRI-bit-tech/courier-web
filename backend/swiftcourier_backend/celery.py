import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'swiftcourier_backend.settings')

app = Celery('swiftcourier_backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery configuration
app.conf.update(
    broker_url=f"redis://{os.getenv('REDIS_HOST', 'localhost')}:6379/0",
    result_backend=f"redis://{os.getenv('REDIS_HOST', 'localhost')}:6379/0",
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

__all__ = ('app',)
