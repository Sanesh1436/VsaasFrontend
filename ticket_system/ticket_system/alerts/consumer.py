import pika
import json
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ticket_system.settings')

django.setup()

from django.conf import settings
from tickets.services import create_ticket_from_alert

from django.utils.timezone import now
from datetime import datetime

def callback(ch, method, properties, body):
    try:
        data = json.loads(body)
        timestamp = data.get("timestamp")

        if isinstance(timestamp, str):
            pass
        else:
            data["timestamp"] = now().isoformat()

        ticket = create_ticket_from_alert(data)

        if ticket:
            print(f"✅ Ticket created: {ticket.id}")
        else:
            print("⚠️ Duplicate alert ignored")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print("❌ Error processing message:", e)


def start():
    # 🔐 Credentials
    credentials = pika.PlainCredentials(
        settings.RABBITMQ["USER"],
        settings.RABBITMQ["PASSWORD"]
    )

    # 🔌 Connection params
    connection_params = pika.ConnectionParameters(
        host=settings.RABBITMQ["HOST"],
        port=settings.RABBITMQ["PORT"],
        virtual_host=settings.RABBITMQ.get("VHOST", "/"),
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=30 #300
    )

    connection = pika.BlockingConnection(connection_params)
    channel = connection.channel()

    # 📦 Queue declare (must match producer)
    channel.queue_declare(
        queue=settings.RABBITMQ["QUEUE"],
        durable=True
    )

    # ⚡ Fair dispatch (important when scaling)
    channel.basic_qos(prefetch_count=1)

    # 🎧 Start consuming
    channel.basic_consume(
        queue=settings.RABBITMQ["QUEUE"],
        on_message_callback=callback
    )

    print(f"🚀 Listening on queue: {settings.RABBITMQ['QUEUE']}")
    channel.start_consuming()


if __name__ == "__main__":
    start()