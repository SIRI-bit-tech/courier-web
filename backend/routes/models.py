from django.db import models
from django.contrib.auth import get_user_model
from packages.models import Package

User = get_user_model()

class Route(models.Model):
    ROUTE_STATUS = (
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routes')
    route_date = models.DateField()
    status = models.CharField(max_length=20, choices=ROUTE_STATUS, default='planned')
    total_packages = models.IntegerField(default=0)
    estimated_duration = models.DurationField(null=True, blank=True)
    actual_duration = models.DurationField(null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Route {self.id} - {self.driver.username} ({self.route_date})"

class RouteStop(models.Model):
    STOP_STATUS = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    )

    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='route_stops')
    stop_order = models.IntegerField()
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    actual_arrival = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STOP_STATUS, default='pending')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['stop_order']

    def __str__(self):
        return f"Stop {self.stop_order} - {self.package.tracking_number}"
