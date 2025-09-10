#!/bin/bash

# SwiftCourier Restore Script

set -e

if [ $# -ne 2 ]; then
    echo "Usage: $0 <db_backup_file> <media_backup_file>"
    exit 1
fi

DB_BACKUP_FILE=$1
MEDIA_BACKUP_FILE=$2

echo "🔄 Starting restore process..."

# Check if backup files exist
if [ ! -f "$DB_BACKUP_FILE" ]; then
    echo "❌ Database backup file not found: $DB_BACKUP_FILE"
    exit 1
fi

if [ ! -f "$MEDIA_BACKUP_FILE" ]; then
    echo "❌ Media backup file not found: $MEDIA_BACKUP_FILE"
    exit 1
fi

# Stop services
echo "⏹️  Stopping services..."
docker-compose -f docker-compose.prod.yml down

# Restore database
echo "🗄️  Restoring database..."
docker-compose -f docker-compose.prod.yml up -d db
sleep 10
docker-compose -f docker-compose.prod.yml exec -T db psql -U $DB_USER -d $DB_NAME < $DB_BACKUP_FILE

# Restore media files
echo "📁 Restoring media files..."
docker run --rm -v swiftcourier_media_volume:/data -v $(dirname $MEDIA_BACKUP_FILE):/backup alpine tar xzf /backup/$(basename $MEDIA_BACKUP_FILE) -C /data

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Restore completed successfully!"
