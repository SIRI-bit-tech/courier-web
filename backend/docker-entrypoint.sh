#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "Database started"

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@swiftcourier.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
EOF

# Start server
if [ "$1" = "runserver" ]; then
    echo "Starting Django development server..."
    exec python manage.py runserver 0.0.0.0:8000
elif [ "$1" = "daphne" ]; then
    echo "Starting Daphne ASGI server..."
    exec daphne -b 0.0.0.0 -p 8000 swiftcourier_backend.asgi:application
elif [ "$1" = "celery" ]; then
    echo "Starting Celery worker..."
    exec celery -A swiftcourier_backend worker --loglevel=info
elif [ "$1" = "celery-beat" ]; then
    echo "Starting Celery beat..."
    exec celery -A swiftcourier_backend beat --loglevel=info
else
    exec "$@"
fi
