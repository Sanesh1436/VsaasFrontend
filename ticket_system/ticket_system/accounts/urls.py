from django.urls import path
from .views import  RegisterView, LoginView, BulkCreateAgentsView, AllTeamLeadsView,AllAgentsView, AutoAssignAgentsView 


# Optional JWT refresh view
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),# JWT Refresh

    
    path('bulk-create-agents/', BulkCreateAgentsView.as_view(), name='bulk_create_agents'), 
    #path('assign-lead/bulk/', BulkAssignLeadView.as_view(), name='bulk_assign_lead'),
    
    path('leads/', AllTeamLeadsView.as_view()),
    path('agents/', AllAgentsView.as_view()),
    path('agents/auto-assign/', AutoAssignAgentsView.as_view()),
]