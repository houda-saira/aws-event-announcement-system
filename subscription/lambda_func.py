import json
import boto3

sns = boto3.client("sns")

TOPIC_ARN = "arn:aws:sns:eu-north-1:450257688635:EventAnnouncements"


def lambda_handler(event, context):

    body = json.loads(event["body"])

    email = body["email"]

    sns.subscribe(
        TopicArn=TOPIC_ARN,
        Protocol="email",
        Endpoint=email
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Subscription request sent"
        })
    }