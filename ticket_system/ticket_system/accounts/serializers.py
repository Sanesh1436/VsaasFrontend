from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from .models import User


# -------------------------------------------------
# User Serializer
# Purpose: Display user information
# -------------------------------------------------
class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "phone",
            "team_lead"
        ]


# -------------------------------------------------
# Create User / Assign Lead
# Purpose: Create a single user
# -------------------------------------------------
class AssignLeadSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
            "phone",
            "team_lead"
        ]

    # Ensure assigned lead is actually a TEAM_LEAD
    def validate_team_lead(self, value):

        if value and value.role != "TEAM_LEAD":
            raise serializers.ValidationError(
                "Assigned lead must have role TEAM_LEAD"
            )

        return value


    def create(self, validated_data):

        password = validated_data.pop("password")

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user


# -------------------------------------------------
# Bulk Agent Creation
# Purpose: Create multiple agents in one request
# -------------------------------------------------
class BulkAgentCreateSerializer(serializers.Serializer):

    users = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )

    def validate_users(self, value):

        for user in value:

            if "username" not in user:
                raise serializers.ValidationError("username is required")

            if "password" not in user:
                raise serializers.ValidationError("password is required")

        return value


    @transaction.atomic
    def create(self, validated_data):

        users_data = validated_data["users"]

        created_users = []

        for user_data in users_data:

            password = user_data.pop("password")

            user = User(**user_data)

            # force role to AGENT
            user.role = "AGENT"

            validate_password(password)

            user.set_password(password)

            user.save()

            created_users.append(user)

        return created_users


# -------------------------------------------------
# Bulk Assign Team Lead
# Purpose: Assign one team lead to multiple agents
# -------------------------------------------------
class BulkAssignLeadSerializer(serializers.Serializer):

    team_lead = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="TEAM_LEAD")
    )

    agents = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )


    @transaction.atomic
    def save(self):

        team_lead = self.validated_data["team_lead"]
        agent_ids = self.validated_data["agents"]

        agents = User.objects.filter(id__in=agent_ids, role="AGENT")

        updated_agents = []

        for agent in agents:
            agent.team_lead = team_lead
            agent.save()
            updated_agents.append(agent)

        return updated_agents