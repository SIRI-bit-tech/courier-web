#!/bin/bash

# SwiftCourier Backup Script

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="swiftcourier_db_${DATE}.sql"
MEDIA_BACKUP_FILE="swiftcourier_media_${DATE}.tar.gz"

echo "🔄 Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
echo "🗄️  Backing up database..."
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/$DB_BACKUP_FILE

# Backup media files
echo "📁 Backing up media files..."
docker run --rm -v swiftcourier_media_volume:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/$MEDIA_BACKUP_FILE -C /data .

# Remove backups older than 30 days
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "swiftcourier_*" -type f -mtime +30 -delete

echo "✅ Backup completed successfully!"
echo "📦 Database backup: $BACKUP_DIR/$DB_BACKUP_FILE"
echo "📦 Media backup: $BACKUP_DIR/$MEDIA_BACKUP_FILE"
