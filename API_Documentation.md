# QW Survey — API Documentation

## 1. Overview

QW Survey is a survey-management application built with React, TypeScript, Express, and MongoDB. This document describes the HTTP API implemented in `backend/src/server.ts` and `backend/src/presentation/surveyRoutes.ts`.

The API supports creating surveys, managing questions, publishing and closing surveys, collecting responses, and retrieving response results.

## 2. Base URL

### Local development

```text
http://localhost:5000/api/surveys
```

### Production

Use your deployed backend URL followed by `/api/surveys`.

```text
https://<your-backend-domain>/api/surveys
```

Replace `<your-backend-domain>` with the actual public URL of your backend deployment.

The backend also exposes `GET /` as a simple health check.

## 3. General conventions

- Request and response bodies use JSON.
- For requests with a JSON body, send the `Content-Type: application/json` header.
- No authentication middleware is configured in the current server implementation.
- Survey statuses are `draft`, `published`, and `closed`.
- Question types are `short_text`, `long_text`, `single_choice`, `multiple_choice`, and `rating`.
- Survey IDs and question IDs are strings. The API creates survey IDs and new question IDs using `crypto.randomUUID()`.
- Error responses generally use this shape:

```json
{
  "message": "A human-readable explanation."
}
```

## 4. Endpoint summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API health check |
| `POST` | `/api/surveys` | Create a survey |
| `GET` | `/api/surveys` | List surveys with pagination and optional status filter |
| `GET` | `/api/surveys/:id` | Get one survey |
| `POST` | `/api/surveys/:id/questions` | Add a question |
| `PUT` | `/api/surveys/:id/questions/:questionId` | Update a question |
| `DELETE` | `/api/surveys/:id/questions/:questionId` | Delete a question |
| `POST` | `/api/surveys/:id/publish` | Publish a draft survey |
| `POST` | `/api/surveys/:id/close` | Close a published survey |
| `POST` | `/api/surveys/:id/responses` | Submit a response |
| `GET` | `/api/surveys/:id/responses` | List a survey's responses with pagination |
| `GET` | `/api/surveys/:id/results` | Get aggregated results |

The base path `/api/surveys` is mounted in `backend/src/server.ts`. The endpoint paths in the following sections are shown relative to that base path unless stated otherwise.

---

## 5. Health check

### `GET /`

Checks that the API process responds. The server connects to MongoDB before it begins listening.

**Success — `200 OK`**

```text
QW Survey API is running!
```

Example:

```bash
curl http://localhost:5000/
```

---

## 6. Create a survey

### `POST /api/surveys`

Creates a new survey in `draft` status.

**Request headers**

```text
Content-Type: application/json
```

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Survey title. Must not be blank. |
| `description` | string | No | Survey description. If omitted or not a string, it defaults to an empty string. |

Example:

```json
{
  "title": "Employee Feedback",
  "description": "A short survey about the employee experience."
}
```

**Success — `201 Created`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "description": "A short survey about the employee experience.",
  "status": "draft",
  "questions": []
}
```

The ID above is an example; the API generates a new UUID.

**Errors**

- `400 Bad Request` — title is missing, not a string, or blank.
- `500 Internal Server Error` — survey creation fails.

Example error:

```json
{
  "message": "Survey title is required."
}
```

Example request:

```bash
curl -X POST "http://localhost:5000/api/surveys" \
  -H "Content-Type: application/json" \
  -d '{"title":"Employee Feedback","description":"A short survey"}'
```

---

## 7. List surveys

### `GET /api/surveys`

Returns surveys using server-side pagination. Results are sorted by creation time, newest first.

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Requested page. Values below 1 or not parseable as a number fall back to 1. |
| `limit` | number | `5` | Number of surveys per page. Clamped to the range 1–10. |
| `status` | string | All statuses | Optional filter: `draft`, `published`, or `closed`. Invalid status values are ignored. |

Example:

```text
GET /api/surveys?page=1&limit=5&status=published
```

**Success — `200 OK`**

```json
{
  "surveys": [
    {
      "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
      "title": "Employee Feedback",
      "description": "A short survey about the employee experience.",
      "status": "published",
      "questions": [
        {
          "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
          "label": "How satisfied are you?",
          "type": "rating",
          "required": true
        }
      ]
    }
  ],
  "page": 1,
  "limit": 5,
  "total": 1,
  "totalPages": 1
}
```

The example values are illustrative. `total` is the number of surveys matching the filter; `totalPages` is calculated from `total / limit`. An empty result set returns an empty `surveys` array.

**Errors**

- `500 Internal Server Error` — listing fails. The response contains a `message`.

Example:

```bash
curl "http://localhost:5000/api/surveys?page=1&limit=5&status=draft"
```

---

## 8. Get one survey

### `GET /api/surveys/:id`

Returns a survey's ID, title, description, status, and questions.

**Path parameter**

| Parameter | Description |
|---|---|
| `id` | Survey ID |

**Success — `200 OK`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "description": "",
  "status": "draft",
  "questions": []
}
```

**Errors**

- `404 Not Found` — no survey exists for the supplied ID.
- `500 Internal Server Error` — an unexpected error occurs.

Example:

```bash
curl "http://localhost:5000/api/surveys/c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123"
```

---

## 9. Question object

Questions use the following structure:

```json
{
  "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
  "label": "How satisfied are you?",
  "type": "rating",
  "required": true
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique question ID. Generated by the API when adding a question. |
| `label` | string | Text displayed to the respondent. Must not be blank. |
| `type` | string | One of the supported question types below. |
| `required` | boolean | Whether an answer must be provided. |
| `options` | string array | Used for choice questions; not used for rating questions. |

### Supported question types and values

| Type | Answer value | Rules |
|---|---|---|
| `short_text` | string | Required text answers cannot be blank. |
| `long_text` | string | Required text answers cannot be blank. |
| `single_choice` | string | Must exactly match one of the configured options. |
| `multiple_choice` | string array | Every item must match a configured option; duplicate choices are not allowed. |
| `rating` | integer | Must be a whole number from 1 through 5. Rating questions must not include `options`. |

Choice questions (`single_choice` and `multiple_choice`) must have at least two non-empty, distinct options.

---

## 10. Add a question

### `POST /api/surveys/:id/questions`

Adds a question to a survey. Only surveys in `draft` status can be edited. A survey can contain at most five questions.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | string | Yes | Non-blank question label. |
| `type` | string | Yes | One of the five supported question types. |
| `required` | boolean | Yes | Whether an answer is mandatory. |
| `options` | string array | Conditional | Required by domain rules for choice questions; do not send for rating questions. |

Example — rating question:

```json
{
  "label": "Rate your experience",
  "type": "rating",
  "required": true
}
```

Example — single-choice question:

```json
{
  "label": "Which team are you part of?",
  "type": "single_choice",
  "required": true,
  "options": ["Engineering", "Design", "Operations"]
}
```

**Success — `201 Created`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "status": "draft",
  "questions": [
    {
      "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "label": "Rate your experience",
      "type": "rating",
      "required": true
    }
  ]
}
```

The API generates the new question ID. The response contains the updated question list.

**Errors**

- `400 Bad Request` — invalid question fields, invalid options, duplicate question ID (normally not applicable to a newly generated ID), more than five questions, or the survey cannot be edited.
- `404 Not Found` — survey does not exist.

---

## 11. Update a question

### `PUT /api/surveys/:id/questions/:questionId`

Replaces the specified question's editable fields. Only draft surveys can be edited. The question ID is retained from the path.

**Request body**

Send `label`, `type`, and `required`. Send `options` when applicable.

```json
{
  "label": "How would you rate the onboarding process?",
  "type": "rating",
  "required": true
}
```

**Success — `200 OK`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "status": "draft",
  "questions": [
    {
      "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "label": "How would you rate the onboarding process?",
      "type": "rating",
      "required": true
    }
  ]
}
```

**Errors**

- `400 Bad Request` — invalid fields, invalid question definition, question ID mismatch, question not found within the survey, or survey is not editable.
- `404 Not Found` — survey does not exist.

---

## 12. Delete a question

### `DELETE /api/surveys/:id/questions/:questionId`

Deletes the specified question from a draft survey.

**Success — `200 OK`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "status": "draft",
  "questions": []
}
```

The response includes the updated question list.

**Errors**

- `400 Bad Request` — survey is not editable or another domain rule fails.
- `404 Not Found` — survey does not exist.

---

## 13. Publish a survey

### `POST /api/surveys/:id/publish`

Publishes a draft survey. Publishing requires a non-blank title and at least one valid question. A survey can only be published from `draft` status.

**Request body:** None required.

**Success — `200 OK`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "status": "published",
  "questions": [
    {
      "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "label": "Rate your experience",
      "type": "rating",
      "required": true
    }
  ]
}
```

**Errors**

- `400 Bad Request` — survey is not in draft status or publication validation fails.
- `404 Not Found` — survey does not exist.

---

## 14. Close a survey

### `POST /api/surveys/:id/close`

Closes a published survey. Only surveys in `published` status can be closed. Closed surveys do not accept new responses.

**Request body:** None required.

**Success — `200 OK`**

```json
{
  "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "title": "Employee Feedback",
  "status": "closed",
  "questions": [
    {
      "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "label": "Rate your experience",
      "type": "rating",
      "required": true
    }
  ]
}
```

**Errors**

- `400 Bad Request` — survey is not currently published.
- `404 Not Found` — survey does not exist.

---

## 15. Submit a survey response

### `POST /api/surveys/:id/responses`

Submits a respondent's answers. The survey must exist and be in `published` status.

**Request body**

The body must contain an `answers` array. Each answer has a `questionId` and a `value`.

```json
{
  "answers": [
    {
      "questionId": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "value": 5
    }
  ]
}
```

Examples of values:
- Text questions: `"value": "Very helpful"`
- Single-choice questions: `"value": "Engineering"`
- Multiple-choice questions: `"value": ["Documentation", "Mentoring"]`
- Rating questions: `"value": 5`

**Validation rules**

- `answers` must be an array.
- Each answer must refer to a question belonging to this survey.
- The same question ID cannot appear more than once.
- Required questions must be answered.
- Text values must be strings.
- Single-choice values must match one configured option.
- Multiple-choice values must be an array of configured options without duplicates.
- Ratings must be integers from 1 to 5.
- Only published surveys accept responses.

**Success — `201 Created`**

```json
{
  "id": "6c0e0df3-72b9-4f20-ae3c-2a0e0c9e1234",
  "surveyId": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
  "answers": [
    {
      "questionId": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "value": 5
    }
  ],
  "submittedAt": "2026-10-19T02:00:00.000Z"
}
```

The IDs and timestamp above are examples.

**Errors**

- `400 Bad Request` — missing/non-array `answers`, invalid answer, duplicate answer, missing required answer, invalid choice/rating, or survey not published.
- `404 Not Found` — survey does not exist.

Example:

```bash
curl -X POST "http://localhost:5000/api/surveys/c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123/responses" \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"e9b53a4b-4f4d-4f31-a68d-12ac6bde1234","value":5}]}'
```

---

## 16. List submitted responses

### `GET /api/surveys/:id/responses`

Returns submitted responses for a survey using server-side pagination. Responses are sorted newest first.

**Query parameters**

| Parameter | Type | Default | Validation |
|---|---|---|---|
| `page` | integer | `1` | Must be a positive integer. |
| `limit` | integer | `5` | Must be an integer from 1 to 10. |

Unlike the survey-list endpoint, invalid pagination values return `400 Bad Request` instead of being clamped.

Example:

```text
GET /api/surveys/c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123/responses?page=1&limit=5
```

**Success — `200 OK`**

```json
{
  "responses": [
    {
      "id": "6c0e0df3-72b9-4f20-ae3c-2a0e0c9e1234",
      "surveyId": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
      "answers": [
        {
          "questionId": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
          "value": 5
        }
      ],
      "submittedAt": "2026-10-19T02:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 5,
  "total": 1,
  "totalPages": 1
}
```

**Errors**

- `400 Bad Request` — invalid page or limit.
- `404 Not Found` — survey does not exist.
- `500 Internal Server Error` — response listing fails.

---

## 17. Get survey results

### `GET /api/surveys/:id/results`

Returns the survey, total response count, per-question summaries, and the stored responses.

**Success — `200 OK`**

The `questionResults` entry depends on the question type.

Example response:

```json
{
  "survey": {
    "id": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
    "title": "Employee Feedback",
    "status": "published",
    "questions": [
      {
        "id": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
        "label": "Rate your experience",
        "type": "rating",
        "required": true
      }
    ]
  },
  "totalResponses": 2,
  "questionResults": [
    {
      "questionId": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
      "label": "Rate your experience",
      "type": "rating",
      "averageRating": 4.5,
      "ratingCount": 2
    }
  ],
  "responses": [
    {
      "id": "6c0e0df3-72b9-4f20-ae3c-2a0e0c9e1234",
      "surveyId": "c7c36f7c-51e4-44b9-9d8a-7f82b5c9a123",
      "answers": [
        {
          "questionId": "e9b53a4b-4f4d-4f31-a68d-12ac6bde1234",
          "value": 5
        }
      ],
      "submittedAt": "2026-10-19T02:00:00.000Z"
    }
  ]
}
```

`questionResults` varies by question type:

**Rating question**

```json
{
  "questionId": "question-id",
  "label": "Rate your experience",
  "type": "rating",
  "averageRating": 4.5,
  "ratingCount": 2
}
```

When there are no rating answers, `averageRating` is `null` and `ratingCount` is `0`.

**Single-choice or multiple-choice question**

```json
{
  "questionId": "question-id",
  "label": "Which team are you part of?",
  "type": "single_choice",
  "optionCounts": [
    { "option": "Engineering", "count": 3 },
    { "option": "Design", "count": 2 }
  ]
}
```

For multiple-choice questions, each selected option contributes to its count.

**Short-text or long-text question**

```json
{
  "questionId": "question-id",
  "label": "What should we improve?",
  "type": "long_text",
  "textAnswers": [
    "More onboarding documentation",
    "More team introductions"
  ]
}
```

**Errors**

- `404 Not Found` — survey does not exist.
- `500 Internal Server Error` — results retrieval fails.

---

## 18. Common error responses

Error responses use a JSON object with a `message` field.

| HTTP status | Meaning in this API |
|---|---|
| `400 Bad Request` | Invalid request data or a domain rule was violated. |
| `404 Not Found` | The requested survey does not exist. |
| `500 Internal Server Error` | An unexpected server, database, or retrieval error occurred. |

Examples:

```json
{
  "message": "Survey not found."
}
```

```json
{
  "message": "Only published surveys accept responses."
}
```

Exact error messages depend on the validation rule that failed.

## 19. Survey lifecycle and business rules

Typical lifecycle:

```text
draft  --publish-->  published  --close-->  closed
```

- New surveys start as `draft`.
- Questions can only be added, updated, or deleted while the survey is a draft.
- A survey can contain no more than five questions.
- Publishing requires at least one valid question.
- Only published surveys accept responses.
- Closing is allowed only for published surveys.
- Closed surveys do not accept new responses.
- The current API does not expose an endpoint to reopen a closed survey or delete a survey.

## 20. CORS, authentication, and deployment

- The current Express server enables CORS with `app.use(cors())`.
- No authentication or authorization middleware is configured in the current implementation. Treat the API as publicly accessible unless access controls are added at the hosting or application layer.
- Configure the frontend's `VITE_API_URL` environment variable to the deployed backend URL plus `/api`, for example `https://<your-backend-domain>/api`.
- Configure `MONGODB_URI` and `PORT` in the backend deployment environment. Do not commit database credentials or other secrets to source control.

## 21. Implementation notes

This documentation was written from the source code in the supplied QW project archive, particularly `backend/src/server.ts`, `backend/src/presentation/surveyRoutes.ts`, the domain model, and the application/repository classes.

One implementation detail to be aware of: the `findById` method in `MongoSurveyRepository.ts` rehydrates a survey without passing the stored description. As currently written, `GET /api/surveys/:id` can therefore return an empty description even when one was saved. The list and create routes include the description. This is a code behavior note, not an intended API guarantee.
