import json
import uuid
import pika
from django.conf import settings
from django.utils.timezone import now
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def bulk_custom_alerts(request):

    alerts = request.data

    if not isinstance(alerts, list):
        return Response(
            {"error": "Request body must be a list of alerts"},
            status=400
        )

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

    count = 0

    for alert in alerts:

        # Auto generate alert_id
        alert["alert_id"] = str(uuid.uuid4())

        # Auto set current timestamp
        alert["created_at"] = now().isoformat()

        channel.basic_publish(
            exchange="",
            routing_key=settings.RABBITMQ["QUEUE"],
            body=json.dumps(alert),
            properties=pika.BasicProperties(delivery_mode=2)
        )

        count += 1

    connection.close()

    return Response({
        "status": "success",
        "alerts_sent": count
    })