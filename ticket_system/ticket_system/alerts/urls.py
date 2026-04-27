from django.urls import path
from .views import bulk_custom_alerts

urlpatterns = [
    path("bulk-alerts/", bulk_custom_alerts)
]