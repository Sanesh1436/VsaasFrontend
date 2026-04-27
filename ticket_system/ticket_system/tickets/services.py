from .models import Ticket
from django.core.exceptions import ValidationError
from django.utils.dateparse import parse_datetime

from .constants import PRIORITY_MAP, IGNORE_ALERTS, IMPORTANT_ALERTS #

def assign_ticket(ticket, agent):
    active_count = Ticket.objects.filter(
        assigned_to=agent,
        status__in=['ASSIGNED','assigned', 'IN_PROGRESS','n_progress']
    ).count()

    if active_count >= 10:
        raise ValidationError("Agent has max tickets")

    ticket.assigned_to = agent
    ticket.status = 'ASSIGNED'
    ticket.save()

def start_ticket(ticket, agent):
    Ticket.objects.filter(
        assigned_to=agent,
        is_active_ticket=True
    ).update(is_active_ticket=False)

    ticket.status = 'IN_PROGRESS'
    ticket.is_active_ticket = True
    ticket.save()

def resolve_ticket(ticket):
    ticket.status = 'RESOLVED'
    ticket.is_active_ticket = False
    ticket.save()

def auto_assign(ticket, team_lead):
    agents = team_lead.agents.all()

    best_agent = None
    min_count = 999

    for agent in agents:
        count = Ticket.objects.filter(
            assigned_to=agent,
            status__in=['ASSIGNED', 'IN_PROGRESS']
        ).count()

        if count < 10 and count < min_count:
            best_agent = agent
            min_count = count

    if not best_agent:
        raise ValidationError("No agents available")

    assign_ticket(ticket, best_agent)


def create_ticket_from_alert(data):
    alert_id = data.get("alert_id")

    if Ticket.objects.filter(alert_id=alert_id).exists():
        return None

    return Ticket.objects.create(
        alert_id=alert_id,
        title=data.get("title"),
        description=data.get("description", ""),
        site=data.get("site"),
        camera=data.get("camera"),
        priority=data.get("priority", 3),
        created_at=parse_datetime(data.get("timestamp"))
    )
    

"""
-------------------------------------------------
    @Fathima_DEV :: Filter Alerts 
-------------------------------------------------
"""
# Day 1

def get_priority(alert_type):
    return PRIORITY_MAP.get(alert_type.lower(), 0)


# -------------------------------------------------
# Filter alerts based on rules
# -------------------------------------------------
def filter_alerts_queryset(queryset, min_priority=1):
    """
    Filtering logic:
    - Ignore alerts in IGNORE_ALERTS
    - Always include IMPORTANT_ALERTS
    - Include alerts above min_priority
    """

    filtered = []

    for ticket in queryset:

        alert_type = (ticket.title or "").strip().lower()

        # ignore low value alerts
        if alert_type in IGNORE_ALERTS:
            continue

        # always include important alerts
        if alert_type in IMPORTANT_ALERTS:
            filtered.append(ticket)
            continue

        # filter by priority
        if ticket.priority >= min_priority:
            filtered.append(ticket)

    return filtered


# -------------------------------------------------
# Return only important alerts
# -------------------------------------------------
def get_important_alerts():

    return Ticket.objects.filter(
        title__in=[alert.title() for alert in IMPORTANT_ALERTS]
    ).order_by("-priority", "-created_at")
    
# Day 2
import pika
import json
from django.conf import settings
from django.utils.timezone import now

from tickets.services import create_ticket_from_alert


def consume_alerts_from_queue(max_messages=10):
    count = 0
    results = []

    credentials = pika.PlainCredentials(
        settings.RABBITMQ["USER"],
        settings.RABBITMQ["PASSWORD"]
    )

    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=settings.RABBITMQ["HOST"],
            port=settings.RABBITMQ["PORT"],
            virtual_host=settings.RABBITMQ.get("VHOST", "/"),
            credentials=credentials
        )
    )

    channel = connection.channel()

    channel.queue_declare(
        queue=settings.RABBITMQ["QUEUE"],
        durable=True
    )

    # 🔁 Manual consume loop (not blocking forever)
    for method_frame, properties, body in channel.consume(
        settings.RABBITMQ["QUEUE"],
        inactivity_timeout=2
    ):
        if body:
            try:
                data = json.loads(body)

                if not isinstance(data.get("timestamp"), str):
                    data["timestamp"] = now().isoformat()

                ticket = create_ticket_from_alert(data)

                if ticket:
                    results.append(f"Created: {ticket.id}")
                else:
                    results.append("Duplicate skipped")

                channel.basic_ack(method_frame.delivery_tag)
                count += 1

                if count >= max_messages:
                    break

            except Exception as e:
                results.append(f"Error: {str(e)}")
                channel.basic_nack(method_frame.delivery_tag, requeue=True)

        else:
            break  # no more messages

    channel.close()
    connection.close()

    return results


# ✅ Clear ALL alerts
def clear_all_alerts():
    count, _ = Ticket.objects.all().delete()
    return count


# ✅ Clear only resolved alerts (SAFE option)
def clear_resolved_alerts():
    count, _ = Ticket.objects.filter(status="RESOLVED").delete()
    return count


#--------- 
from .models import Ticket
from accounts.models import User

def auto_assign_tickets(team_lead):

    # 🎯 Get agents under this lead
    agents = list(User.objects.filter(
        role="AGENT",
        team_lead=team_lead
    ))

    if not agents:
        return {"error": "No agents under this team lead"}

    # 🎯 Get unassigned tickets sorted by priority
    tickets = Ticket.objects.filter(
        assigned_to__isnull=True
    ).order_by("priority", "created_at")

    assigned_count = 0
    agent_index = 0

    for ticket in tickets:

        attempts = 0

        while attempts < len(agents):
            agent = agents[agent_index]

            # 🔢 Count active tickets
            active_count = Ticket.objects.filter(
                assigned_to=agent,
                status__in=["ASSIGNED", "IN_PROGRESS", "PENDING"]
            ).count()

            if active_count < 10:
                ticket.assigned_to = agent
                ticket.status = "ASSIGNED"
                ticket.save()

                assigned_count += 1

                # rotate agent (fair distribution)
                agent_index = (agent_index + 1) % len(agents)
                break

            agent_index = (agent_index + 1) % len(agents)
            attempts += 1

    return {"assigned": assigned_count}


