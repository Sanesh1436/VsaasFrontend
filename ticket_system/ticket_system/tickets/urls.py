from django.urls import path
from .views import AgentTicketActionView, AllAlertsView, FilteredAlertsView, ImportantAlertsView
from .views import ConsumeAlertsAPIView, ClearAlertsAPIView
from .views import LatestAlertsView,UpdateAlertStatusView

urlpatterns = [

    path('all-alerts/', AllAlertsView.as_view(), name="all-alerts"),

    path('filter-alerts/', FilteredAlertsView.as_view(), name="filtered-alerts"),

    path('important-alerts/', ImportantAlertsView.as_view(), name="important-alerts"),
    
    path('consume-alerts/', ConsumeAlertsAPIView.as_view(), name="add-alerts"),
    
    path('clear-alerts/', ClearAlertsAPIView.as_view(), name="clear-alerts"),
    
    path('latest-alerts/', LatestAlertsView.as_view()),
    
    path('update-alert/<int:pk>/', UpdateAlertStatusView.as_view()),
    
    path('tickets/action/<int:pk>/', AgentTicketActionView.as_view())

]