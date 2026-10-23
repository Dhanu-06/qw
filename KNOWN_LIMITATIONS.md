# QW Survey — Known Limitations

This document distinguishes confirmed scope limitations from implementation details that still need verification. Items listed under “Items to verify” should not be treated as confirmed defects until checked against the final code and application.

## 1. Authentication and authorization

- Authentication and authorization are not implemented.
- The application is intended as an assignment/demo project, not a production system for confidential surveys or sensitive responses.
- Anyone who can reach the API may be able to call its endpoints. Do not use real sensitive data without adding suitable access controls.

## 2. Items to verify before submission

The following points were identified in earlier implementation notes. Check them against the final repository and remove or update each item after verification.

### Pagination validation

- Verify that the survey-list and response-list endpoints consistently reject invalid or over-limit pagination values, as required by the assignment.
- The implementation notes refer to `limit` as the page-size parameter, while the assignment uses the term `pageSize`. Document the actual API parameter consistently. If the two endpoints behave differently, either fix the difference or clearly record the remaining limitation.

### Survey description persistence

- Verify that a survey description is preserved when a survey is saved and then retrieved by ID.
- Earlier implementation notes identified a possible issue in `MongoSurveyRepository.findById()` where the stored description might not be passed to `Survey.rehydrate()`.
- If the issue is still present, pass the stored description into rehydration and add a regression test. If the test passes in the final version, remove this item from the document.

### Domain-level validation

- Verify that business rules are enforced by the domain and application operations, not only by HTTP route validation.
- Earlier notes indicate that blank-title validation may be handled by the API route and publication operation rather than the `Survey` constructor itself. Check whether invalid state can be created by calling domain or application operations directly. If it can, add validation at the appropriate boundary.

## 3. Architecture trade-off

- Routing, request validation, use-case invocation, and error mapping are combined in the route implementation.
- This is a pragmatic choice for a small assignment. Separating controller responsibilities and centralizing error handling could improve maintainability as the application grows. This is an architectural trade-off, not necessarily a functional defect.

## 4. Deployment and data protection

- Database connectivity depends on the configured MongoDB URI and hosting network settings.
- Keep database credentials in backend environment variables only. Do not expose them through frontend environment variables or commit them to Git.
- Restrict hosted database network access where practical, and use fictional demo data for the assignment.