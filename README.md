\# AWS Event Announcement System



A serverless application for event creation, email subscriptions, and automated event notifications, built with AWS managed services.



\## Architecture Overview



| Component | Responsibility |

|---|---|

| Amazon S3 | Static website hosting and event data storage |

| Amazon API Gateway | HTTP API exposure and request routing |

| AWS Lambda | Subscription processing and event creation |

| Amazon SNS | Email notification distribution |

| AWS IAM | Permissions between AWS services |



\*\*Region:\*\* `eu-north-1` (Europe — Stockholm)



\## Technical Workflow



\### 1. Frontend Layer



The frontend consists of HTML, CSS, and JavaScript files hosted on Amazon S3. It provides the user interface for interacting with the application.



\### 2. API Layer



Amazon API Gateway exposes two HTTP endpoints that route incoming requests to dedicated Lambda functions.



| Method | Endpoint | Lambda Integration |

|---|---|---|

| `POST` | `/subscribe` | `event-announcement-subscription` |

| `POST` | `/event` | `event-announcement-create-event` |



\### 3. Subscription Workflow



1\. The frontend submits a subscription request to `POST /subscribe`.

2\. API Gateway invokes the subscription Lambda function.

3\. Lambda processes the request and interacts with Amazon SNS to manage the email subscription.

4\. SNS handles subscription confirmation and notification delivery to confirmed subscribers.



\### 4. Event Creation Workflow



1\. A client submits an event creation request to `POST /event`.

2\. API Gateway invokes `event-announcement-create-event`.

3\. Lambda retrieves the existing event collection from Amazon S3.

4\. The function updates `events.json` with the new event and writes the updated object back to S3.

5\. Lambda publishes an announcement to the `EventAnnouncements` SNS topic.

6\. SNS distributes the notification to confirmed email subscribers.



\### 5. Storage and Notification Configuration



\*\*Amazon S3\*\*

\- Website assets: `index.html`, `style.css`, `app.js`.

\- Event data: `events.json`.

\- Lambda configuration: `annonces-bucket`.



\*\*Amazon SNS\*\*

\- Topic: `EventAnnouncements`.

\- Lambda configuration: `arn:aws:sns:eu-north-1:450257688635:EventAnnouncements`.

\- Email subscriptions require confirmation before notifications are delivered.



\*\*AWS IAM\*\*



Lambda execution roles grant the permissions required to access S3 and publish messages to SNS.



\## Repository Structure



```text

project-events/

├── index.html

├── style.css

├── app.js

├── events.json

├── README.md

└── .gitignore

```



\## Technology Stack



\- \*\*Cloud:\*\* AWS

\- \*\*Frontend Hosting and Storage:\*\* Amazon S3

\- \*\*API Management:\*\* Amazon API Gateway

\- \*\*Compute:\*\* AWS Lambda

\- \*\*Messaging:\*\* Amazon SNS

\- \*\*Access Management:\*\* AWS IAM

\- \*\*Languages:\*\* HTML, CSS, JavaScript

\- \*\*Version Control:\*\* Git and GitHub

