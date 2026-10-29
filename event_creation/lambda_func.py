import json
import os
import boto3
from datetime import date, datetime

s3 = boto3.client("s3")
sns = boto3.client("sns")

BUCKET_NAME = os.environ.get("BUCKET_NAME")
OBJECT_KEY = "events.json"
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")


def response(status_code, message):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({"message": message})
    }


def lambda_handler(event, context):
    try:
        # 1. Vérifier la configuration
        if not BUCKET_NAME:
            return response(500, "Missing BUCKET_NAME configuration")

        if not SNS_TOPIC_ARN:
            return response(500, "Missing SNS_TOPIC_ARN configuration")

        # 2. Lire les données envoyées par API Gateway
        body = event.get("body")

        if isinstance(body, str):
            body = json.loads(body)
        elif not isinstance(body, dict):
            return response(400, "Invalid request body")

        title = body.get("title")
        event_date = body.get("date")
        event_time = body.get("time")
        description = body.get("description", "")
        severity = body.get("severity")

        # 3. Valider les champs obligatoires
        if not all(
            isinstance(value, str) and value.strip()
            for value in (title, event_date, event_time, severity)
        ):
            return response(400, "Missing or invalid required fields")

        try:
            date.fromisoformat(event_date)
            datetime.strptime(event_time, "%H:%M")
        except ValueError:
            return response(400, "Invalid date or time format")

        if severity not in ("info", "warning", "critical"):
            return response(400, "Invalid severity")

        # 4. Lire les événements existants dans S3
        try:
            result = s3.get_object(
                Bucket=BUCKET_NAME,
                Key=OBJECT_KEY
            )
            events = json.loads(result["Body"].read().decode("utf-8"))

            if not isinstance(events, list):
                return response(500, "events.json must contain a JSON array")

        except s3.exceptions.NoSuchKey:
            events = []

        # 5. Créer le nouvel événement
        new_id = max(
            (
                item.get("id", 0)
                for item in events
                if isinstance(item, dict)
                and isinstance(item.get("id"), int)
            ),
            default=0
        ) + 1

        new_event = {
            "id": new_id,
            "title": title.strip(),
            "date": event_date,
            "time": event_time,
            "description": description.strip()
                if isinstance(description, str) else "",
            "severity": severity
        }

        events.append(new_event)

        # 6. Réécrire le fichier JSON dans S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=OBJECT_KEY,
            Body=json.dumps(events, ensure_ascii=False, indent=2),
            ContentType="application/json"
        )

        # 7. Préparer le message de notification
        severity_labels = {
            "info": "Information",
            "warning": "Avertissement",
            "critical": "Critique"
        }

        notification_message = (
            "Un nouvel événement vient d'être publié !\n\n"
            f"Titre : {new_event['title']}\n"
            f"Date : {new_event['date']}\n"
            f"Heure : {new_event['time']}\n"
            f"Sévérité : {severity_labels[new_event['severity']]}\n"
            f"Description : {new_event['description']}\n"
        )

        # 8. Publier la notification sur le topic SNS
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Nouvel événement publié",
            Message=notification_message
        )

        # 9. Retourner le résultat
        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "message": "Event created and notification sent successfully",
                "event": new_event
            })
        }

    except json.JSONDecodeError:
        return response(400, "Invalid JSON")

    except Exception:
        print("Unexpected error while creating event")
        print("Check the Lambda logs for details")
        return response(500, "Internal server error")