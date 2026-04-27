# from django.contrib.auth.models import AbstractUser
# from django.db import models


# class User(AbstractUser):
#     ROLE_CHOICES = (
#         ('AGENT', 'Agent'),
#         ('TEAM_LEAD', 'Team Lead'),
#     )

#     role = models.CharField(max_length=20, choices=ROLE_CHOICES)
#     phone = models.CharField(max_length=15, blank=True)

#     # Only for agents
#     team_lead = models.ForeignKey(
#         'self',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='agents'
#     )

#     def __str__(self):
#         return f"{self.username} - {self.role}"


"""
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
        ('AGENT', 'Agent'),
        ('TEAM_LEAD', 'Team_Lead'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    phone = models.CharField(max_length=15, blank=True)

    # Agents are assigned to a Team Lead
    team_lead = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agents'
    )

    def __str__(self):
        return f"{self.username} - {self.role}"