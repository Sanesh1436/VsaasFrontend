from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Ticket(models.Model):

    STATUS_CHOICES = (
        ('NEW', 'New'), 
        ('ASSIGNED', 'Assigned'), 
        ('IN_PROGRESS', 'In_Progress'), 
        ('RESOLVED', 'Resolved'),
        
       
        ('PENDING', 'Pending'),#@added
        ('PARKED', 'Parked')#@added
    )

    PRIORITY_CHOICES = (
        (1, 'High'),
        (2, 'Medium'),
        (3, 'Low'),
    )
    
    alert_id = models.CharField(max_length=100, unique=True)

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    site = models.CharField(max_length=100, blank=True)
    camera = models.CharField(max_length=100, blank=True)
    
    

    priority = models.IntegerField(choices=PRIORITY_CHOICES,default=3)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')

    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets'
    )

    is_active_ticket = models.BooleanField(default=False)

    created_at  = models.DateTimeField()  # from alert
    received_at = models.DateTimeField(auto_now_add=True)
    
    updated_at = models.DateTimeField(auto_now=True) # TO BE Added [before migration]

    def __str__(self):
        return f"{self.alert_id} | {self.status}"
   