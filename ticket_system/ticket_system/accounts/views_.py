from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

from .models import User
from .serializers import  AssignLeadSerializer, BulkAgentCreateSerializer, BulkAssignLeadSerializer


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
# class LoginView(APIView):

#     def post(self, request):

#         username = request.data.get("username")
#         password = request.data.get("password")

#         user = authenticate(username=username, password=password)

#         if user:

#             return Response({
#                 "message": "Login successful",
#                 "user_id": user.id,
#                 "role": user.role
#             })

#         return Response(
#             {"error": "Invalid credentials"},
#             status=status.HTTP_401_UNAUTHORIZED
#         )




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
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

class BulkCreateAgentsView(APIView):
    
    """ ---     auth        ----- """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    """ ------------------------- """
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
    
     
    """ -----     auth        ----- """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    """ --------------------------- """

    def post(self, request):

        serializer = BulkAssignLeadSerializer(data=request.data)

        if serializer.is_valid():

            agents = serializer.save()

            agent_ids = [agent.id for agent in agents]

            return Response({
                "message": "Team lead assigned successfully",
                "agents": agent_ids
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)