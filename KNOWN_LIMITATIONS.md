# QW Survey — Known Limitations

This document records implementation limitations and items that should be verified before submission. It is based on the available project notes and should be checked against the final source code and deployed application. Do not describe an item as a confirmed current defect unless you have reproduced it in the final version.

## 1. Authentication and authorization

- Authentication and authorization are not implemented in this assignment.
- The application should be treated as a demonstration project, not a production system for confidential surveys or sensitive responses.
- Anyone who can reach the public API may be able to call endpoints unless access restrictions are configured outside the application.

## 2. Pagination validation should be consistent

- The implementation notes indicate that the survey-list endpoint may default or clamp invalid pagination values, while the response-list endpoint validates them more strictly.
- The assignment expects invalid or over-limit pagination values to be rejected. Verify the current behavior of both endpoints and make them consistent before submission.
- The API uses `limit` for the page-size parameter in the documented implementation notes, whereas the assignment uses the term `pageSize`. Keep the actual API parameter documented consistently, or align the API with the assignment if needed.

## 3. Survey description rehydration — verify and fix if still present

- The available architecture notes identify a possible issue in `MongoSurveyRepository.findById()`: the stored description may not be passed to `Survey.rehydrate()`.
- If this remains in the final code, retrieving a survey by ID may return an empty description even when one was saved. Verify by creating a survey with a description, reloading it through the API, and checking the returned value.
- If reproduced, pass the stored description into rehydration and add a regression test. Remove this item from the limitations list once it is fixed and verified.

## 4. Domain validation boundary

- The available architecture notes indicate that blank-title validation is performed by the API route and during publication, rather than being enforced by the `Survey` constructor itself.
- Verify that all entry points and application operations enforce the relevant business rules, not only the HTTP route. If a business rule can be bypassed by calling the domain or application operation directly, consider moving or adding validation at the appropriate boundary.

## 5. HTTP route responsibilities

- Routing, request validation, use-case invocation, and error mapping are combined in the route implementation.
- This is a pragmatic choice for a small assignment, but separating controller responsibilities and centralizing error handling could make the code easier to maintain as it grows. This is an architectural trade-off, not necessarily a functional defect.

## 6. Deployment and data protection

- Database access depends on the configured MongoDB connection and hosting network settings.
- Keep MongoDB credentials in backend environment variables only. Do not expose them through frontend variables or commit them to Git.
- Restrict hosted database network access where practical. Use fictional demo data for the assignment.

## 7. Scope limitations

- The project does not provide authentication or role-based access control.
- The project is an assignment-scale survey application and is not intended to be treated as a production survey service without additional security, monitoring, operational safeguards, and review.

## Verification record

Before final submission, review each item above against the current repository:

- [ ] Confirmed whether survey pagination rejects invalid and over-limit values consistently.
- [ ] Confirmed whether `findById()` preserves the survey description after saving and reloading.
- [ ] Confirmed validation rules are enforced by the relevant domain/application operations as well as the API.
- [ ] Confirmed `.env` files and database credentials are not committed.
- [ ] Updated or removed any item above that is no longer applicable.

Only report defects that are present in the final implementation. If an item is fixed, remove it from the active limitations section or record it as fixed and tested.
