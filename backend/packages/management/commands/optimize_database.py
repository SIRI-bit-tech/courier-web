# backend/packages/management/commands/optimize_database.py
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Optimize database performance with indexes'

    def handle(self, *args, **options):
        self.stdout.write('Starting database optimization...')
        
        with connection.cursor() as cursor:
            # Analyze tables for query optimization
            self.stdout.write('Analyzing tables...')
            cursor.execute("ANALYZE VERBOSE;")
            
            # Create partial indexes for active records
            self.stdout.write('Creating partial indexes...')
            cursor.execute("""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_active 
                ON packages_package (id, tracking_number, status) 
                WHERE status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery');
            """)
            
            # Create regular indexes
            cursor.execute("""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packages_tracking_search 
                ON packages_package (recipient_name, tracking_number);
            """)
            
            # Optimize for tracking queries
            cursor.execute("""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_recent 
                ON tracking_trackingevent (package_id, timestamp DESC);
            """)
            
            # Vacuum analyze for better performance (FIXED TYPO)
            self.stdout.write('Running VACUUM ANALYZE...')
            cursor.execute("VACUUM ANALYZE;")
            
            self.stdout.write(
                self.style.SUCCESS('Database optimization completed successfully!')
            )
            
            # Simple index count
            cursor.execute("""
                SELECT COUNT(*) as index_count 
                FROM pg_indexes 
                WHERE schemaname = 'public';
            """)
            
            result = cursor.fetchone()
            self.stdout.write(f'\nTotal indexes created: {result[0]}')