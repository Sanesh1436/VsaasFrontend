from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

from .models import User
from .serializers import  AssignLeadSerializer, BulkAgentCreateSerializer, BulkAssignLeadSerializer


from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


# --------------------------------------
# Register User (Agent or Team Lead)
# --------------------------------------
class RegisterView(APIView):

    def post(self, request):

        serializer = AssignLeadSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {"message": "User created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






# --------------------------------------
# Login User
# --------------------------------------
from rest_framework_simplejwt.tokens import RefreshToken
class LoginView(APIView):

    def post(self, request):

        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Login successful",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user_id": user.id,
                "role": user.role
            })

        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )


# --------------------------------------
# Bulk Create Agents
# --------------------------------------
class BulkCreateAgentsView(APIView):
    
    authentication_classes = [JWTAuthentication] # auth
    permission_classes = [IsAuthenticated] # auth permission
    
    def post(self, request):

        serializer = BulkAgentCreateSerializer(data=request.data)

        if serializer.is_valid():

            users = serializer.save()

            usernames = [user.username for user in users]

            return Response({
                "message": "Agents created successfully",
                "agents": usernames
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------------------
# Bulk Assign Team Lead to Agents
# --------------------------------------
class BulkAssignLeadView(APIView):
     
    
    authentication_classes = [JWTAuthentication] # auth
    permission_classes = [IsAuthenticated] # auth permission

    def post(self, request):
        try:
            # 🔒 Only team lead allowed
            if request.user.role != "TEAM_LEAD":
                return Response(
                    {"error": "Only team leads can assign agents"},
                    status=403
                )

            agent_ids = request.data.get("agent_ids", [])

            if not agent_ids:
                return Response({"error": "agent_ids required"}, status=400)

            agents = User.objects.filter(id__in=agent_ids, role="AGENT")

            # ❗ Optional: limit 10 agents per team lead
            if agents.count() > 10:
                return Response(
                    {"error": "Max 10 agents allowed per team lead"},
                    status=400
                )

            # ✅ Assign
            agents.update(team_lead=request.user)

            return Response({
                "message": "Agents assigned successfully",
                "team_lead": request.user.id,
                "agents": list(agents.values_list("id", flat=True))
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)

# --------------------------------------
# Update Team Lead to Agents
# --------------------------------------        
class UpdateAgentTeamLeadView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            if request.user.role != "TEAM_LEAD":
                return Response({"error": "Only team leads allowed"}, status=403)

            agent_id = request.data.get("agent_id")
            new_lead_id = request.data.get("team_lead_id")

            agent = User.objects.get(id=agent_id, role="AGENT")
            new_lead = User.objects.get(id=new_lead_id, role="TEAM_LEAD")

            agent.team_lead = new_lead
            agent.save()

            return Response({
                "message": "Team lead updated",
                "agent": agent.id,
                "new_team_lead": new_lead.id
            })

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class ShowAgentsView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "TEAM_LEAD":
            return Response({"error": "Not allowed"}, status=403)

        agents = User.objects.filter(team_lead=request.user)

        data = [
            {
                "id": a.id,
                "username": a.username,
                "is_contract_worker": a.is_contract_worker
            }
            for a in agents
        ]

        return Response(data)


class AllTeamLeadsView(APIView):
    
    #authentication_classes = [JWTAuthentication]
    #permission_classes = [IsAuthenticated]

    def get(self, request):
        leads = User.objects.filter(role="TEAM_LEAD")

        data = [
            {
                "id": l.id,
                "username": l.username,
                "total_agents": User.objects.filter(team_lead=l, role="AGENT").count()
            }
            for l in leads
        ]

        return Response(data)
    
class AllAgentsView(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        agents = User.objects.filter(role="AGENT")

        data = [
            {
                "id": a.id,
                "username": a.username,
                "team_lead": a.team_lead.id if a.team_lead else None
            }
            for a in agents
        ]

        return Response(data)
    
class AutoAssignAgentsView(APIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    MAX_AGENTS = 10

    def post(self, request):
        try:
            if request.user.role != "TEAM_LEAD":
                return Response(
                    {"error": "Only team leads can trigger auto assignment"},
                    status=403
                )

            leads = User.objects.filter(role="TEAM_LEAD")
            unassigned_agents = User.objects.filter(role="AGENT", team_lead__isnull=True)

            if not unassigned_agents.exists():
                return Response({"message": "No unassigned agents found"})

            assigned_data = []

            for lead in leads:

                current_count = User.objects.filter(
                    team_lead=lead,
                    role="AGENT"
                ).count()

                remaining_slots = self.MAX_AGENTS - current_count

                if remaining_slots <= 0:
                    continue

                # pick agents for this lead
                agents_to_assign = unassigned_agents[:remaining_slots]

                for agent in agents_to_assign:
                    agent.team_lead = lead
                    agent.save()

                assigned_data.append({
                    "team_lead": lead.id,
                    "assigned_count": len(agents_to_assign)
                })

                # remove assigned agents from pool
                unassigned_agents = unassigned_agents[remaining_slots:]

                if not unassigned_agents.exists():
                    break

            return Response({
                "message": "Auto assignment completed",
                "details": assigned_data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)