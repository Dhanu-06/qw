# QW Survey — Architecture Explanation

## 1. Purpose

QW Survey is a full-stack survey builder. An author creates a draft, defines questions, publishes the survey, respondents submit answers, and the author reviews responses and summaries.

The backend uses TypeScript, Express, MongoDB, and Mongoose. The frontend is a React application. The backend is organized using a lightweight Domain-Driven Design (DDD) approach: business concepts and rules live in the domain layer, application classes coordinate use cases, repository interfaces define persistence contracts, and MongoDB-specific code lives in infrastructure.

This is intentionally a small application architecture. It does not use microservices, CQRS, or domain events because those would add complexity without being necessary for this assignment.

## 2. High-level structure

```text
React frontend
     |
     | HTTP + JSON
     v
Express server
  server.ts
     |
     v
Presentation / API routes
  presentation/surveyRoutes.ts
  - parses request data
  - performs basic request-shape checks
  - calls application operations
  - maps outcomes to HTTP responses
     |
     v
Application layer
  CreateSurvey
  AddQuestion
  UpdateQuestion
  DeleteQuestion
  SubmitSurveyResponse
  GetSurveyResults
  - coordinates use cases
  - loads and saves through repository contracts
     |
     +--------------------+
     |                    |
     v                    v
Domain layer          Repository interfaces
  Survey                SurveyRepository
  Question              SurveyResponseRepository
  SurveyResponse              |
  - business rules             v
                         Infrastructure layer
                           MongoSurveyRepository
                           MongoSurveyResponseRepository
                           SurveyModel
                           SurveyResponseModel
                           database.ts
                                |
                                v
                             MongoDB
```

The dependency direction is deliberate: the domain does not import Express or Mongoose. Application operations depend on repository interfaces rather than directly on database models. Infrastructure implements those interfaces using Mongoose.

## 3. Layer responsibilities

### Domain — `backend/src/domain/`

The domain layer represents the main business concepts.

- `survey.ts` contains the `Survey` entity and its lifecycle and validation behavior.
- `question.ts` defines the `Question` structure and supported question types.
- `SurveyResponse.ts` defines `SurveyResponse` and the `Answer` structure.

The `Survey` entity owns its question definitions. Operations such as `addQuestion`, `updateQuestion`, `deleteQuestion`, `publish`, `close`, and `validateAnswers` keep related rules together instead of relying only on the UI or route handlers.

The domain code uses TypeScript values and ordinary errors; it does not need an HTTP request or a database connection to validate a survey.

### Application — `backend/src/application/`

Application classes express actions the system can perform:

| Class | Responsibility |
|---|---|
| `CreateSurvey` | Creates a new draft with a generated ID and persists it. |
| `AddQuestion` | Loads a survey, asks the domain to add a question, and saves it. |
| `UpdateQuestion` | Loads a survey, applies a domain question update, and saves it. |
| `DeleteQuestion` | Loads a survey, applies the domain deletion, and saves it. |
| `SubmitSurveyResponse` | Loads the survey, validates the complete answer set through the domain, creates a response, and saves it only after validation succeeds. |
| `GetSurveyResults` | Loads a survey and its responses, then calculates response totals and question-level summaries. |

These classes coordinate the workflow. They do not contain Mongoose query syntax. Repository interfaces are passed into constructors, which makes the operations easier to test with test doubles.

The route handlers currently perform publishing and closing directly by loading the survey, invoking `publish()` or `close()`, and saving through the repository. Those two actions follow the same domain-first rule enforcement, although they are not currently separate application classes.

### Repository contracts — `backend/src/application/`

- `SurveyRepository.ts` defines saving, lookup, listing, and paginated survey retrieval.
- `SurveyResponseRepository.ts` defines response saving, lookup by survey, and paginated response retrieval.

These interfaces describe what the application needs from persistence without specifying how the data is stored.

### Infrastructure — `backend/src/infrastructure/`

- `MongoSurveyRepository.ts` implements survey persistence and rehydrates stored survey documents into `Survey` domain objects.
- `MongoSurveyResponseRepository.ts` stores and reconstructs `SurveyResponse` objects.
- `SurveyModel.ts` defines the Mongoose survey schema, including question subdocuments.
- `SurveyResponseModel.ts` defines the Mongoose response schema and answer subdocuments.
- `database.ts` reads `MONGODB_URI` and connects Mongoose to MongoDB.

Survey and response IDs are strings generated with `crypto.randomUUID()`, and the Mongoose schemas declare string `_id` fields. Questions are stored within their owning survey document, which fits the rule that the survey owns its question definitions.

### Presentation / API boundary — `backend/src/presentation/surveyRoutes.ts`

The Express route handlers expose the HTTP API. They read path parameters, query parameters, and JSON request bodies; perform basic shape checks; call application operations or domain methods; and return status codes and JSON.

For example, the response route checks that `answers` is an array, then delegates the detailed checks to `SubmitSurveyResponse` and `Survey.validateAnswers`. This matters because the backend must reject invalid direct API calls even if the browser has its own validation.

`backend/src/server.ts` configures JSON parsing and CORS, mounts the survey routes at `/api/surveys`, connects to MongoDB, and starts listening on the configured port.

## 4. Domain model and business rules

### Survey lifecycle

The supported statuses are:

```text
draft  --->  published  --->  closed
```

The `Survey` entity enforces these transitions:

- A new survey starts as `draft`.
- Questions can be added, updated, or deleted only while the survey is a draft.
- A survey can contain at most five questions.
- Question IDs must be unique within the survey and cannot be changed during an update.
- Publishing is allowed only from draft status, requires a non-blank title and at least one question, and validates the question definitions.
- Closing is allowed only from published status.
- Only published surveys accept responses.
- Published and closed surveys cannot have their questions changed through the domain operations.

There is no operation to reopen a closed survey, which is consistent with the assignment scope.

### Question validation

The supported question types are `short_text`, `long_text`, `single_choice`, `multiple_choice`, and `rating`.

- Every question needs a non-blank label and a supported type.
- Single-choice and multiple-choice questions need at least two distinct, non-blank options.
- Rating questions must not contain options.
- A survey cannot exceed five questions.

The domain validates question definitions when they are added or updated and again when a survey is published.

### Response validation

`Survey.validateAnswers()` validates the full answer set before the response is saved:

- The survey must be published.
- The answers value must be an array.
- Each answer must reference a question in the survey.
- A question cannot be answered more than once in the same submission.
- Required questions must be answered.
- Text answers must be strings; required text cannot be blank.
- Single-choice answers must match a configured option.
- Multiple-choice answers must be arrays of configured options and cannot contain duplicate selections; required multiple-choice questions need at least one selection.
- Ratings must be whole numbers from 1 through 5.

`SubmitSurveyResponse` calls this validation before constructing and saving the `SurveyResponse`. If validation throws, the save operation is not reached. The response records its survey ID, answers, generated ID, and submission timestamp.

## 5. Database integration and persistence

MongoDB is accessed through Mongoose models and repository adapters. The application layer calls repository methods such as `findById`, `save`, and `findPaginated`; it does not construct Mongoose queries.

For a survey, `MongoSurveyRepository` maps the domain entity to a document when saving and uses `Survey.rehydrate()` to rebuild a domain object after reading. For a response, `MongoSurveyResponseRepository` stores the response's survey reference, answers, and timestamp, and reconstructs a `SurveyResponse` when reading.

Pagination is performed by MongoDB, not by fetching every record and slicing it in the frontend. The repositories use `skip` and `limit`, request a total count, and use explicit sort orders. Survey queries sort by creation time and `_id`; response queries sort by submission time and `_id`.

The server reads `MONGODB_URI` from the environment and connects to MongoDB before it begins listening. Docker Compose is used to run the local MongoDB dependency, and a named volume is intended to preserve data across normal container restarts.

## 6. Example request flow: submitting a response

1. A respondent submits JSON to `POST /api/surveys/:id/responses`.
2. The Express route checks that `answers` is an array.
3. The route calls `SubmitSurveyResponse.execute(surveyId, answers)`.
4. The use case asks `SurveyRepository` to load the survey.
5. The use case calls `survey.validateAnswers(answers)`.
6. If the survey state or any answer violates a rule, validation throws and no response is saved.
7. If validation passes, the use case creates a `SurveyResponse` with an ID and timestamp.
8. `SurveyResponseRepository.save()` persists it through `MongoSurveyResponseRepository` and Mongoose.
9. The route returns `201 Created` with the saved response details.

The same domain validation runs for a request sent directly to the API; it is not dependent on the React form.

## 7. Results and summaries

`GetSurveyResults` retrieves the survey and all its responses through repository contracts. It then calculates:

- the total number of responses;
- the average and count of submitted ratings;
- counts for each configured choice option, counting each multiple-choice selection once;
- submitted text answers.

The summary is calculated from all saved responses rather than only the current response-list page. If there are no rating answers, the average is represented as `null` rather than dividing by zero.

## 8. Testing approach

The backend includes Vitest tests for domain behavior and application/repository behavior. For example:

- `domain/Survey.test.ts` checks question validation, lifecycle rules, and response validation.
- `application/SubmitSurveyResponse.test.ts` checks that invalid responses are not saved and valid responses include the survey reference and timestamp.
- `application/CreateSurvey.test.ts` and `infrastructure/MongoSurveyRepository.test.ts` cover creation and persistence-related behavior.

Automated tests complement, but do not replace, the required manual acceptance checklist. The submission should include actual outcomes and evidence for each acceptance scenario rather than marking scenarios as passed without running them.

Run backend tests from the `backend` directory with:

```bash
npm test
```

## 9. Tradeoffs and scope

- **Small DDD model:** `Survey` owns the lifecycle and question rules, while `SurveyResponse` represents a submission. This is enough to make the main business boundaries visible without adding unnecessary architectural machinery.
- **Embedded questions:** Questions are stored inside the survey document because they are part of the survey definition and are read and updated with it.
- **Separate responses:** Responses are stored separately because a survey can receive many submissions and they need their own pagination and result aggregation.
- **Repository interfaces:** These separate application use cases from Mongoose and make unit tests possible with test doubles.
- **No authentication:** Authentication and authorization are outside the assignment scope. The current API should therefore be treated as publicly accessible unless access controls are added.
- **HTTP error mapping:** Route handlers currently map thrown domain/application errors to HTTP responses. This is straightforward for a small assignment, but dedicated error types and centralized error handling would make error mapping more robust as the application grows.

## 10. Known implementation notes to verify before submission

These notes are based on the source snapshot used to prepare this document. Recheck them against the final repository before treating them as current.

1. `MongoSurveyRepository.findById()` calls `Survey.rehydrate()` without passing the stored description. Since the rehydration method defaults description to an empty string, an individual survey loaded by ID can lose its description in the returned domain object. The paginated listing passes the description explicitly. This should be fixed by passing `document.description ?? ""` in `findById()`.
2. The survey-list endpoint defaults or clamps page and limit values rather than rejecting every invalid or over-limit value. The response-list endpoint strictly validates `page` and `limit`. The assignment asks for positive integer pagination values and rejection of invalid or over-limit values, so this difference should be checked and documented or corrected.
3. The API uses `limit` as the pagination parameter and response field, while the assignment describes `pageSize`. This is acceptable if consistently documented, but the README and API documentation should use the actual parameter name.
4. The domain model requires at least one question before publication, but the shown `Survey` constructor itself does not reject a blank title. The create route checks the title, and publication checks it again. This means the rule is enforced at the API boundary and publish operation rather than at initial entity construction.
5. The current route file combines routing, request validation, use-case invocation, and error mapping. This is a pragmatic choice for the assignment size; it is not a separate controller class per endpoint.

## 11. Summary

The core architectural decision is to keep survey behavior in the `Survey` domain entity, coordinate user actions in application use cases, define persistence requirements through repository interfaces, and implement those interfaces using MongoDB/Mongoose adapters. Express provides the HTTP boundary, while React calls the API. This separation makes the main business rules easier to test and explain, and keeps database-specific code out of the domain model.
