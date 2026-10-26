# QW Survey — Acceptance Checklist



Use this checklist to verify the application against the assignment requirements. Record actual outcomes and evidence as you test. Mark a check as Pass only after the expected behavior has been observed.



## Status key



Not Tested — not checked yet.



Pass — the observed behavior matches the expected result.



Fail — the observed behavior does not match the expected result.



## Test environment



Date tested: 2026-10-26



Browser / version: Google Chrome



Frontend URL: https://qw-five-red.vercel.app/



Backend URL: https://qw-backend-z8pd.onrender.com/



Database: MongoDB Atlas



---



## 1. Draft editing and preview



Goal: Confirm drafts support the five question types, can be edited, and previewing does not create a response.



The user reported creating a draft with all five question types, reloading and seeing them, editing a question, editing a choice option, deleting a question, and confirming the changes persisted. The user also reported completing the sixth-question and preview checks. Confirm each expected outcome before treating the corresponding row as Pass.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 1.1 | Create a draft with a title and description. Add short text, long text, single choice, multiple choice, and rating questions. | The draft is created and all five question types can be added. | Created a draft survey and added all five question types; they remained visible after reload. | Pass |
| 1.2 | Edit a question label or its settings, then save. | The updated question is saved. | Edited a question and confirmed the change persisted after reload. | Pass |
| 1.3 | Edit or remove an option from a choice question. | The option change is saved and the removed option no longer appears. | Edited a choice option and confirmed the change persisted after reload. | Pass |
| 1.4 | Delete a question and save the draft. | The question is removed and remains removed after reload. | Deleted a question and confirmed it remained deleted after reload. | Pass |
| 1.5 | Reload the draft after making changes. | The saved title, description, questions, and options persist. | Confirmed the questions and changes remained visible after reload. | Pass |
| 1.6 | Try to add a sixth question. | The application rejects the sixth question and explains the limit. | Verified: the sixth-question limit behaves as expected. | Pass |
| 1.7 | Open Preview without submitting the survey. Check the response count or response list before and after. | Preview shows the current form and does not create a response. | Verified: preview works without creating a response. | Pass |



## 2. Publication validation



Goal: Confirm only valid surveys can be published and drafts cannot receive responses.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 2.1 | Attempt to publish a survey with a blank title. | Publication is rejected with a useful validation message. | Verified: invalid publication is rejected. | Pass |
| 2.2 | Attempt to publish a survey with no questions. | Publication is rejected with a useful validation message. | Verified: empty-survey publication was blocked. | Pass |
| 2.3 | Attempt to publish a survey with a blank question label. | Publication is rejected with a useful validation message. | Verified: blank-label validation works as expected. | Pass |
| 2.4 | Attempt to publish a choice question with invalid options. | Publication is rejected with a useful validation message. | Verified: invalid choice-option validation works as expected. | Pass |
| 2.5 | Correct the invalid survey and publish it. | The valid survey changes from Draft to Published. | Verified: a valid test survey was published successfully. | Pass |
| 2.6 | Send a direct API request to submit a response to a Draft survey. | The API rejects the submission and does not save a response. | Verified directly through Postman: the API rejected submission to a Draft survey. | Pass |



## 3. Published questions stay fixed



Goal: Confirm question definitions cannot be changed after publication and invalid lifecycle transitions are rejected.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 3.1 | In the UI, try to edit a published question. | Published question definitions remain unchanged; editing is unavailable or rejected. | Verified in the UI: published surveys have no edit option. | Pass |
| 3.2 | In the UI, try to add or delete a question after publication. | The published survey's question definitions remain unchanged. | Verified in the UI: adding and deleting questions is unavailable for published surveys. | Pass |
| 3.3 | In the UI, try to change or delete a choice option after publication. | The published survey's options remain unchanged. | Verified in the UI: choice options cannot be edited for published questions. | Pass |
| 3.4 | Send direct API requests to edit, add, or delete questions/options on a Published survey. | The API rejects the changes and the stored definition remains unchanged. | Verified with Postman: the backend rejects attempts to modify questions on a published survey. | Pass |
| 3.5 | Repeat the publish request or attempt an invalid lifecycle transition. | The API handles the transition safely and does not reset or corrupt the survey. | Verified in the UI: no Publish action is available for an already-published survey; invalid lifecycle behavior was checked. | Pass |
| 3.6 | Repeat the API checks after the survey has responses. | Question definitions remain immutable even after responses exist. | Verified: published survey details and questions remained unchanged after refresh and response submission. | Pass |



## 4. Valid answers persist



Goal: Confirm valid responses are accepted, optional questions may be skipped, and saved data survives restarts.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 4.1 | Start local dependencies using docker compose up -d from the repository root. | Docker Compose starts the configured dependencies successfully. | Verified: the configured local dependency setup works. | Pass |
| 4.2 | Publish a survey containing all five question types and submit a valid response. | The respondent sees a clear confirmation and the response is saved. | Verified: a valid response was submitted and confirmation appeared. | Pass |
| 4.3 | Submit a second valid response while omitting an optional question. | The response is accepted and the optional unanswered question is omitted. | Verified: a response was accepted with an optional question left blank. | Pass |
| 4.4 | Reload the results or response list. | Saved answers and the response count remain correct. | Verified: both submitted responses remained visible and the count stayed unchanged after refresh. | Pass |
| 4.5 | Restart the API and restart the Compose stack without removing volumes. | Previously saved surveys and responses remain available. | Verified: persistence behavior across the tested restart scenario worked as expected. | Pass |
| 4.6 | Inspect the stored response or API result. | The response is associated with the correct survey and has a submission timestamp. | Verified: saved responses were associated with the correct survey and displayed in the application. | Pass |



## 5. Invalid answers are rejected by the API



Goal: Confirm server-side validation rejects invalid payloads even when browser validation is bypassed.



For each case, record the HTTP status or error response and verify that the saved response count does not increase.



| ID | Direct API test | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 5.1 | Submit a blank or missing required answer. | Request is rejected; no response is saved. | Verified in the UI and with Postman: a missing required answer is rejected and invalid submissions are not saved. | Pass |
| 5.2 | Submit an answer with the wrong data type for its question. | Request is rejected; no response is saved. | Verified with Postman: wrong-type answers are rejected. | Pass |
| 5.3 | Submit an answer for an unknown question ID. | Request is rejected; no response is saved. | Verified with Postman: answers referencing unknown question IDs are rejected. | Pass |
| 5.4 | Submit an unknown option for a choice question. | Request is rejected; no response is saved. | Verified with Postman: unknown choice options are rejected. | Pass |
| 5.5 | Include more than one answer for the same question. | Request is rejected; no response is saved. | Verified with Postman: repeated answers for the same question are rejected. | Pass |
| 5.6 | Submit an empty selection for a required multiple-choice question. | Request is rejected; no response is saved. | Verified with Postman: an empty selection for a required multiple-choice question is rejected. | Pass |
| 5.7 | Submit ratings of 0, 6, and 2.5 in separate requests. | Each request is rejected; no response is saved. | Verified with Postman: invalid rating values are rejected. | Pass |
| 5.8 | Submit duplicate selections for a multiple-choice question. | Duplicate selections do not inflate option counts; behavior matches the API's documented validation policy. | Verified with Postman: duplicate multiple-choice selections are handled according to validation rules and do not inflate counts. | Pass |
| 5.9 | Submit a response to a Closed survey. | Request is rejected; no response is saved. | Verified with Postman: responses to a Closed survey are rejected. | Pass |



## 6. Closing stops response collection



Goal: Confirm closing a survey prevents new submissions without removing existing data.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 6.1 | Open the respondent form for a Published survey in one browser tab. | The respondent form is available. | Verified: the respondent form can be opened for a Published survey. | Pass |
| 6.2 | Close that survey from the author interface in another tab. | The survey status changes to Closed. | Verified: closing a survey changes its status to Closed. | Pass |
| 6.3 | Submit the already-open respondent form. | The API rejects the submission because the survey is Closed. | Verified: a submission to a Closed survey is rejected, including a form already open before closure. | Pass |
| 6.4 | Reopen the results and response list. | Existing responses and results remain available and unchanged by the failed submission. | Verified: existing responses and results remain available after closing. | Pass |
| 6.5 | Open or refresh the respondent page for the Closed survey. | The page clearly communicates that the survey is closed and cannot accept responses. | Verified: the respondent experience communicates that a Closed survey cannot accept responses. | Pass |



## 7. Both lists really paginate



Goal: Confirm pagination is server-side for the survey dashboard and each survey's response list.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 7.1 | Use seeded data and navigate through multiple survey dashboard pages. Inspect network requests or API responses. | The frontend requests pages from the server rather than fetching all records and slicing them only in the browser. | Verified: survey dashboard pagination is handled by the server. | Pass |
| 7.2 | Navigate through multiple pages of a survey's responses. Inspect network requests or API responses. | The response list is paginated by the server and reports the correct total count. | Verified: response-list pagination is handled by the server and reports totals. | Pass |
| 7.3 | Compare adjacent pages without changing the data. | Ordering is stable and records do not overlap across pages. | Verified: page ordering is stable and records do not overlap across pages. | Pass |
| 7.4 | Change the dashboard status filter. | Filtering is applied before pagination and the current page resets to page 1. | Verified: status filtering works with pagination and resets the page appropriately. | Pass |
| 7.5 | Test the first and last pages of each list. | Navigation and current-page information are correct; unavailable navigation is disabled appropriately. | Verified: first/last-page navigation and current-page information work as expected. | Pass |
| 7.6 | Apply a filter that returns no matching surveys. | A clear empty state is shown and totals are correct. | Verified: empty filter results show a clear empty state. | Pass |
| 7.7 | Request a valid page number beyond the last page. | The API returns an empty item list with correct pagination metadata and total count. | Verified: requesting a valid page beyond the last page returns the expected empty result and metadata. | Pass |
| 7.8 | Send requests with zero, negative, non-integer, or over-limit page-size values. | Invalid or over-limit pagination values are rejected as documented by the API. | Verified: invalid or over-limit pagination values are handled according to the API validation rules. | Pass |
| 7.9 | Trigger a slow request or an API failure. | The UI shows loading and error states and offers an appropriate retry path. | Verified: loading and error states behave as expected. | Pass |
| 7.10 | Change page size, if supported by the UI. | The page resets to page 1 and the API request uses the selected page size. | Verified: changing page size, where supported, updates pagination as expected. | Pass |
| 7.11 | Type multiple characters into the survey search box without clicking it again. | The search input retains focus while typing and search results update correctly. | Current issue reported: after entering one character, the search box loses focus and must be clicked again. | Fail |



## 8. Results summaries



Goal: Confirm summary calculations use all saved responses, not only the currently displayed response page.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 8.1 | Open results for a survey with responses. | The total response count matches the saved responses. | Verified: the total response count matches saved responses. | Pass |
| 8.2 | Inspect single-choice and multiple-choice result counts. | Each option count is correct; a selection is counted only once per response. | Verified: choice-option counts are correct and selections are not double-counted. | Pass |
| 8.3 | Inspect text-question results. | Submitted text answers are displayed correctly. | Verified: submitted text answers display correctly. | Pass |
| 8.4 | Inspect rating results with multiple answered and unanswered ratings. | The average includes answered ratings only and is calculated correctly. | Verified: average rating calculations include answered ratings only. | Pass |
| 8.5 | Compare results while viewing different response-list pages. | Summary totals and aggregates cover all saved responses, regardless of the current page. | Verified: result summaries cover all responses, not only the currently displayed page. | Pass |
| 8.6 | Open results for a survey with no responses or a question with no answers. | A clear empty state appears; invalid values such as NaN are not displayed. | Verified: empty result states are handled without invalid numeric output. | Pass |



## 9. Respondent experience and form validation



Goal: Confirm the respondent form communicates requirements and submission outcomes clearly.



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 9.1 | Open a Published survey's respondent route. | The form displays the correct survey and question labels. | Verified: the respondent route displays the correct survey and question labels. | Pass |
| 9.2 | Inspect required questions and try to submit missing required answers. | Required indicators and readable validation messages appear. | Verified: required indicators and validation messages work as expected. | Pass |
| 9.3 | Submit an invalid form and correct the answers. | User input is preserved where appropriate, and the user can retry. | Verified: invalid form submissions are handled and respondents can correct answers. | Pass |
| 9.4 | Submit a valid form. | A clear submission confirmation appears and repeat submission is prevented or handled safely. | Verified: valid submission displays confirmation and is handled safely. | Pass |
| 9.5 | Navigate the form using a keyboard and inspect it at a smaller viewport. | Controls are labelled, interactions are keyboard-accessible, and the layout remains usable. | Verified: respondent controls and layout were checked for usability. | Pass |



## 10. Documentation and final checks



| ID | Steps | Expected result | Actual result / evidence | Status |
| --- | --- | --- | --- | --- |
| 10.1 | Follow the README setup steps from a clean checkout. | Setup instructions and commands match the repository and allow the app to run. | Not tested yet. | Not Tested |
| 10.2 | Compare API documentation with actual routes, request/response shapes, pagination rules, and errors. | API_Documentation.md accurately describes the implemented API. | Not tested yet. | Not Tested |
| 10.3 | Review ARCHITECTURE.md against the actual source code. | The documented architecture and known trade-offs match the implementation. | Not tested yet. | Not Tested |
| 10.4 | Run npm test from backend. | Tests complete successfully, or any failures are recorded accurately. | Not tested yet. | Not Tested |
| 10.5 | Run npm run build from backend. | The backend build completes successfully, or any failure is recorded. | Not tested yet. | Not Tested |
| 10.6 | Run npm run build from frontend. | The frontend build completes successfully, or any failure is recorded. | Not tested yet. | Not Tested |
| 10.7 | Review KNOWN_LIMITATIONS.md. | Confirmed limitations and incomplete requirements are documented honestly. | Not tested yet. | Not Tested |



---



## Evidence log



Screenshots are stored in the repository's evidence/ folder. The relative links below assume the filenames match the names used in this checklist.



| Evidence ID | Related checks | Evidence file | What it demonstrates |
| --- | --- | --- | --- |
| E1 | 1.1–1.5 | [Draft editing](evidence/01-draft-editing.png) | Draft question creation, editing, deletion, and persistence |
| E2 | 2.2–2.5 | [Publication validation](evidence/02-publish-validation.png) | Invalid publication is rejected and a valid survey can be published |
| E3 | 3.1–3.4 | [Published survey](evidence/03-published-survey.png) | Published survey UI restrictions |
| E4 | 4.2–4.4 | [Valid response and persistence](evidence/04-valid-response.png) | Successful submission and saved responses after refresh |
| E5 | 5.1–5.9 | [Postman invalid-response validation](evidence/05-postman-invalid-response.png) | Backend validation using Postman |
| E6 | 8.1–8.6 | [Survey results](evidence/06-survey-results.png) | Results and summary calculations |
| E7 | 7.1–7.10 | [Pagination](evidence/07-pagination.png) | Pagination UI and page navigation |






## Final summary



Checks passed: Functional checks reported as passing in Sections 1–9, excluding the failed check 7.11. Results are based on the user's reported verification.



Checks failed: 7.11 — the survey search input loses focus after one character and requires another click.



Checks not tested: Section 10 automated test/build/documentation review rows remain unverified unless separately run and confirmed.



Known issues to disclose: Link to KNOWN_LIMITATIONS.md



Verification note: Functional results are based on the user's reported checks, including backend checks in Postman. Check 7.11 is a reported failure. Confirm evidence filenames match the files in evidence/. Automated tests and builds remain Not Tested unless their commands were run and results confirmed.
