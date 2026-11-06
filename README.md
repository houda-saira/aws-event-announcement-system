# AWS Event Announcement System

A serverless application for event creation, email subscriptions, and automated event notifications, built using AWS managed services.

<img width="960" height="390" alt="image" src="https://github.com/user-attachments/assets/6e8befab-bdaf-4c9c-87b0-1a3fe4bef8a2" /><img width="960" height="346" alt="image" src="https://github.com/user-attachments/assets/2ead7f37-de86-4e6a-a4a2-6a40d6d53226" />


**Live Demo:** [Gather – Event Announcement System](https://d2ip8xq39wmurj.cloudfront.net/)

## Architecture Overview

| Component | Responsibility |
|---|---|
| Amazon S3 | Static website hosting and event data storage |
| Amazon CloudFront | HTTPS content delivery and caching |
| Amazon Cognito | Administrator authentication and access management |
| Amazon API Gateway | HTTP API exposure, request routing, and JWT authorization |
| AWS Lambda | Subscription processing and event creation |
| Amazon SNS | Email subscription management and notification distribution |
| AWS IAM | Permissions between AWS services |

**Region:** `eu-north-1` (Europe — Stockholm)

## Technical Workflow

### 1. Frontend Layer

The frontend consists of HTML, CSS, and JavaScript files stored in Amazon S3 and delivered through Amazon CloudFront over HTTPS.

CloudFront uses Origin Access Control (OAC) to securely access the S3 bucket.

### 2. API Layer

Amazon API Gateway exposes two HTTP endpoints connected to dedicated Lambda functions.

| Method | Endpoint | Lambda Integration |
|---|---|---|
| `POST` | `/subscribe` | `event-announcement-subscription` |
| `POST` | `/event` | `event-announcement-create-event` |

The `/event` endpoint is protected by a JWT authorizer integrated with Amazon Cognito.

### 3. Subscription Workflow

1. The frontend submits a subscription request to `POST /subscribe`.
2. API Gateway invokes the subscription Lambda function.
3. Lambda processes the request and interacts with Amazon SNS to create an email subscription.
4. SNS sends a confirmation email to the subscriber.
5. Confirmed subscribers receive future event notifications.

### 4. Event Creation Workflow

1. An administrator authenticates through Amazon Cognito.
2. The frontend obtains an access token using OAuth 2.0 Authorization Code Grant with PKCE.
3. The frontend submits an event creation request to `POST /event`, including the access token.
4. API Gateway validates the JWT before invoking the Lambda function.
5. Lambda retrieves the existing event collection from Amazon S3.
6. The function updates `events.json` with the new event and writes the updated object back to S3.
7. Lambda publishes an announcement to the `EventAnnouncements` SNS topic.
8. SNS distributes the notification to confirmed email subscribers.

### 5. Storage and Notification Configuration

**Amazon S3**
- Website assets: `index.html`, `style.css`, `app.js`.
- Event data: `events.json`.
- Bucket: `annonces-bucket`.

**Amazon CloudFront**
- HTTPS distribution for frontend delivery.
- Origin Access Control (OAC) for secure S3 access.
- Cache invalidation for updated frontend assets and event data.

**Amazon Cognito**
- User Pool for administrator authentication.
- OAuth 2.0 Authorization Code Grant with PKCE.
- JWT tokens for API authorization.

**Amazon SNS**
- Topic: `EventAnnouncements`.
- Email subscriptions require confirmation before notifications are delivered.

**AWS IAM**

Lambda execution roles grant the permissions required to access S3 and publish messages to SNS.

## Repository Structure

```text
project-events/
├── index.html
├── style.css
├── app.js
├── events.json
├── README.md
└── .gitignore
```

## Technology Stack

- **Cloud:** AWS
- **Frontend Hosting and Storage:** Amazon S3
- **Content Delivery:** Amazon CloudFront
- **Authentication:** Amazon Cognito
- **API Management:** Amazon API Gateway
- **Compute:** AWS Lambda (Python)
- **Messaging:** Amazon SNS
- **Access Management:** AWS IAM
- **Security:** OAuth 2.0, PKCE, JWT, OAC
- **Languages:** HTML, CSS, JavaScript, Python
- **Version Control:** Git and GitHub
