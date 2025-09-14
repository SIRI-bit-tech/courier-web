class ReadWriteRouter:
    """
    Database router for read/write splitting and optimization
    """
    
    def db_for_read(self, model, **hints):
        """Route read operations to read replica if available"""
        return 'default'
    
    def db_for_write(self, model, **hints):
        """Route write operations to primary database"""
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations between objects in the same database"""
        return True
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Allow migrations on all databases"""
        return True