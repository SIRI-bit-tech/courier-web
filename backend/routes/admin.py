from django.contrib import admin
from .models import Route, RouteStop

class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('id', 'driver', 'route_date', 'status', 'total_packages')
    list_filter = ('status', 'route_date')
    inlines = [RouteStopInline]

@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ('route', 'package', 'stop_order', 'status', 'estimated_arrival')
    list_filter = ('status', 'route__route_date')
