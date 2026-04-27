from django.http import JsonResponse
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.db import transaction

from .models import Ticket

from tickets.services import (
    auto_assign_tickets, consume_alerts_from_queue, filter_alerts_queryset, get_important_alerts,
    clear_all_alerts,
    clear_resolved_alerts
)


# -------------------------------------------------
# Agent Tickets View
# Purpose: Show tickets assigned to logged-in agent
# -------------------------------------------------
class AgentTicketsView(APIView):

    def get(self, request):

        try:
            tickets = Ticket.objects.filter(
                assigned_to=request.user
            ).order_by("priority", "created_at")

            data = [
                {
                    "id": t.id,
                    "alert_id": t.alert_id,
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "created_at": t.created_at
                }
                for t in tickets
            ]

            return Response({
                "count": len(data),
                "alerts": data
            }, status=status.HTTP_200_OK)

        except Exception as e:

            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -------------------------------------------------
# Get All Alerts
# Purpose: Return every alert in the system
# -------------------------------------------------
class AllAlertsView(APIView):

    def get(self, request):

        try:

            tickets = Ticket.objects.all().order_by("-created_at")

            data = [
                {
                    "id": t.id,
                    "alert_id": t.alert_id,
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "site": t.site,
                    "camera": t.camera,
                    "created_at": t.created_at,
                }
                for t in tickets
            ]

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:

            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -------------------------------------------------
# Purpose: Filter alerts by minimum priority
# Example: /alerts/filter?min_priority=3
# -------------------------------------------------
class FilteredAlertsView(APIView):

    def get(self, request):

        try:

            min_priority = request.GET.get("min_priority", 3)
            min_priority = int(min_priority)

            queryset = Ticket.objects.all()

            tickets = filter_alerts_queryset(queryset, min_priority)

            data = [
                {
                    "id": t.id,
                    "alert_id": t.alert_id,
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "created_at": t.created_at,
                }
                for t in tickets
            ]

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:

            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -------------------------------------------------
# Important Alerts
# Purpose: Return only high priority alerts
# -------------------------------------------------
class ImportantAlertsView(APIView):

    def get(self, request):

        try:

            tickets = get_important_alerts()

            data = [
                {
                    "id": t.id,
                    "alert_id": t.alert_id,
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "created_at": t.created_at
                }
                for t in tickets
            ]

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:

            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
# Day 2
from tickets.services import clear_all_alerts, clear_resolved_alerts

# -------------------------------------------------
# Get / Consume Alerts
# -------------------------------------------------
class ConsumeAlertsAPIView(APIView):

    def post(self, request):
        try:
            limit = int(request.query_params.get("limit", 5))

            result = consume_alerts_from_queue(limit)

            return Response({
                "message": "✅ Alerts consumed",
                "details": result
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# -------------------------------------------------
# Delete / Clear Alerts
# Purpose: Clear resolved alerts or every alerts
# -------------------------------------------------
class ClearAlertsAPIView(APIView):

    def post(self, request):
        try:
            mode = request.query_params.get("type", "resolved")

            if mode == "all":
                deleted_count = clear_all_alerts()
            else:
                deleted_count = clear_resolved_alerts()

            return Response({
                "message": "🧹 Alerts cleared",
                "deleted_count": deleted_count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
# -------------------------------------------------
# Latest Alerts
# Purpose: Latest alerts
# -------------------------------------------------         
class LatestAlertsView(APIView):

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 10))

            tickets = Ticket.objects.all().order_by("-created_at")[:limit]

            data = [
                {
                    "id": t.id,
                    "alert_id": t.alert_id,
                    "title": t.title,
                    "priority": t.priority,
                    "status": t.status,
                    "created_at": t.created_at
                }
                for t in tickets
            ]

            return Response({
                "count": len(data),
                "alerts": data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# -------------------------------------------------
# Update Alerts
# Purpose: Update alerts
# -------------------------------------------------     
# class UpdateAlertStatusView(APIView):

#     def patch(self, request, pk):
#         try:
#             #print("DATA:", request.data)  
#             #print("STATUS:", request.data.get("status"))
            
#             ticket = Ticket.objects.get(id=pk)

#             new_status = request.data.get("status")
            
#             VALID_STATUS = ["NEW", "IN_PROGRESS", "ASSIGNED","RESOLVED", "PARKED","PENDING", 
#                             "New", "In_Progress", "Assigned","Resolved","Parked","Pending"]
           

#             if new_status not in VALID_STATUS:
#                 return Response(
#                     {"error": "Invalid status"},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             ticket.status = new_status
#             ticket.save()

#             return Response({
#                 "message": "✅ Status updated",
#                 "ticket_id": ticket.id,
#                 "new_status": ticket.status
#             }, status=status.HTTP_200_OK)

#         except Ticket.DoesNotExist:
#             return Response(
#                 {"error": "Ticket not found"+pk+","+new_status},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         except Exception as e:
#             return Response(
#                 {"error": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


class UpdateAlertStatusView(APIView):

    def patch(self, request, pk):
        
        try:
            ticket = Ticket.objects.get(id=pk)
            new_status = request.data.get("status")

            if not new_status:
                return Response(
                    {"error": "Status is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_status = new_status.upper()

            VALID_STATUS = [
                "NEW",
                "ASSIGNED",
                "PENDING",
                "IN_PROGRESS",
                "RESOLVED",
                "PARKED"
            ]

            if new_status not in VALID_STATUS:
                return Response(
                    {"error": f"Invalid status. Allowed: {VALID_STATUS}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ---> Only assigned agent can update
            # if ticket.assigned_to != request.user:
            #     return Response(
            #         {"error": "You are not allowed to update this ticket"},
            #         status=status.HTTP_403_FORBIDDEN
            #     )

            # ---> Ensure only ONE active ticket per agent
            # if new_status == "IN_PROGRESS":
            #     Ticket.objects.filter(
            #         assigned_to=request.user,
            #         is_active_ticket=True
            #     ).update(is_active_ticket=False)

            #     ticket.is_active_ticket = True

            # ---> Prevent resolving without starting work
            if new_status == "RESOLVED" and ticket.status != "IN_PROGRESS":
                return Response(
                    {"error": "Start the ticket before resolving"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Handle parked ticket
            if new_status == "PARKED":
                ticket.is_active_ticket = False

            # Update status
            ticket.status = new_status
            ticket.save()

            return Response({
                "message": "✅ Status updated",
                "ticket_id": ticket.id,
                "new_status": ticket.status
            }, status=status.HTTP_200_OK)

        except Ticket.DoesNotExist:
            return Response(
                {"error": f"Ticket not found: {pk}"},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class AutoAssignTicketsView(APIView):

    def post(self, request):
        if request.user.role != "TEAM_LEAD":
            return Response({"error": "Only team leads allowed"}, status=403)

        result = auto_assign_tickets(request.user)
        return Response(result)
    

class AgentTicketActionView(APIView):

    MAX_TICKETS = 10

    def post(self, request, pk):
        try:
            action = request.data.get("action")

            if not action:
                return Response(
                    {"error": "Action is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =====================================================
            # 🎯 TAKE TICKET (SELF ASSIGN) - WITH LOCKING
            # =====================================================
            if action == "take":

                with transaction.atomic():

                    ticket = Ticket.objects.select_for_update().get(id=pk)

                    # already taken
                    if ticket.assigned_to:
                        return Response(
                            {"error": "Ticket already assigned"},
                            status=400
                        )

                    # only NEW tickets can be taken
                    if ticket.status != "NEW":
                        return Response(
                            {"error": "Ticket not available"},
                            status=400
                        )

                    # max 10 tickets rule
                    active_count = Ticket.objects.filter(
                        assigned_to=request.user,
                        status__in=["ASSIGNED", "IN_PROGRESS", "PENDING"]
                    ).count()

                    if active_count >= self.MAX_TICKETS:
                        return Response(
                            {"error": "Max 10 active tickets reached"},
                            status=400
                        )

                    ticket.assigned_to = request.user
                    ticket.status = "ASSIGNED"
                    ticket.save()

                return Response({
                    "message": "Ticket taken",
                    "ticket_id": ticket.id
                })

            # =====================================================
            # 🔒 OTHER ACTIONS → MUST BE ASSIGNED
            # =====================================================
            ticket = Ticket.objects.get(id=pk)

            if ticket.assigned_to != request.user:
                return Response(
                    {"error": "You are not assigned to this ticket"},
                    status=403
                )

            # =====================================================
            # ▶ START
            # =====================================================
            if action == "start":

                # only one active ticket
                Ticket.objects.filter(
                    assigned_to=request.user,
                    is_active_ticket=True
                ).update(is_active_ticket=False)

                ticket.status = "IN_PROGRESS"
                ticket.is_active_ticket = True
                ticket.save()

                return Response({"message": "Ticket started"})

            # =====================================================
            # ⏳ PENDING
            # =====================================================
            elif action == "pending":

                ticket.status = "PENDING"
                ticket.is_active_ticket = False
                ticket.save()

                return Response({"message": "Marked as pending"})

            # =====================================================
            # 🅿 PARK
            # =====================================================
            elif action == "park":

                ticket.status = "PARKED"
                ticket.is_active_ticket = False
                ticket.save()

                return Response({"message": "Ticket parked"})

            # =====================================================
            # ✅ RESOLVE + AUTO PICK NEXT
            # =====================================================
            elif action == "resolve":

                with transaction.atomic():

                    ticket = Ticket.objects.select_for_update().get(id=pk)

                    if ticket.status != "IN_PROGRESS":
                        return Response(
                            {"error": "Start before resolving"},
                            status=400
                        )

                    # ✅ resolve current
                    ticket.status = "RESOLVED"
                    ticket.is_active_ticket = False
                    ticket.save()

                    # 🔍 find next ticket (priority-based)
                    next_ticket = Ticket.objects.select_for_update().filter(
                        assigned_to__isnull=True,
                        status="NEW"
                    ).order_by("priority", "created_at").first()

                    if next_ticket:

                        active_count = Ticket.objects.filter(
                            assigned_to=request.user,
                            status__in=["ASSIGNED", "IN_PROGRESS", "PENDING"]
                        ).count()

                        if active_count < self.MAX_TICKETS:

                            next_ticket.assigned_to = request.user
                            next_ticket.status = "IN_PROGRESS"   # 🔥 auto start
                            next_ticket.is_active_ticket = True
                            next_ticket.save()

                            return Response({
                                "message": "Resolved & next ticket started",
                                "next_ticket_id": next_ticket.id,
                                "priority": next_ticket.priority
                            })

                return Response({
                    "message": "Resolved. No new tickets available"
                })

            # =====================================================
            # 🔁 REOPEN (OPTIONAL)
            # =====================================================
            elif action == "reopen":

                ticket.status = "ASSIGNED"
                ticket.is_active_ticket = False
                ticket.save()

                return Response({"message": "Ticket reopened"})

            return Response(
                {"error": "Invalid action"},
                status=400
            )

        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=404
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=500
            )