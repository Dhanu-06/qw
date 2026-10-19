# QW Survey

A full-stack survey management application built with React, TypeScript, Express, and MongoDB. It allows authors to create surveys, manage questions, preview and publish surveys, collect responses, and view results.

## Features

- Create and manage surveys.
- Add, edit, and delete survey questions while a survey is a draft.
- Support short text, long text, single choice, multiple choice, and rating questions.
- Preview surveys before publishing.
- Publish and close surveys.
- Submit responses through a dedicated respondent page.
- View response summaries, option counts, text answers, and average ratings.
- Browse surveys using status filters and server-side pagination.
- Browse submitted responses using server-side pagination.
- Persist data in MongoDB.

## Technology stack

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose

### Development and testing
- Docker Compose
- Vitest

## Project structure

```text
qw/
├── backend/
│   └── src/
│       ├── application/
│       ├── domain/
│       ├── infrastructure/
│       └── presentation/
├── frontend/
│   └── src/
├── docker-compose.yml
├── API_Documentation.md
├── ARCHITECTURE.md
├── ACCEPTANCE_CHECKLIST.md
├── KNOWN_LIMITATIONS.md
├── .gitignore
└── README.md
```

The acceptance checklist and known-limitations files are supporting submission documents. Ensure they exist in the repository before submitting.

## Prerequisites

Install the following:

- Git
- Node.js and npm (a current Node.js LTS release is recommended)
- Docker Desktop with Docker Compose

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Dhanu-06/qw.git
cd qw
```

### 2. Start MongoDB

From the repository root, run:

```bash
docker compose up -d
docker compose ps
```

The Compose configuration should use a named volume if you want local MongoDB data to persist when the containers are stopped and recreated.

### 3. Configure the backend

Create a `backend/.env` file for local development:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/qw_survey
PORT=5000
```

Do not commit `.env` files or real credentials. If you use MongoDB Atlas instead of the local Compose database, set `MONGODB_URI` to your Atlas connection string in the local environment or hosting provider.

### 4. Install backend dependencies and start the API

From the repository root:

```bash
cd backend
npm install
npm run dev
```

The API should start on `http://localhost:5000` when `PORT=5000`. Keep this terminal open.

To build the backend:

```bash
npm run build
```

To run the built backend:

```bash
npm start
```

### 5. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create a `frontend/.env` file for local development:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Then start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Vite environment variables are read when the app starts or builds. Restart the development server after changing `frontend/.env`.

For production deployment, set `VITE_API_URL` in the frontend hosting settings to the deployed backend URL ending in `/api`. Do not put database credentials in frontend environment variables.

## Seed demo data

The backend includes a seed script that creates 12 demo surveys and 3 sample responses.

The demo surveys include draft, published, and closed statuses. The sample responses include choice answers, text answers, and ratings, and are associated with the Employee Onboarding Feedback survey.

Run the following commands from the repository root:

```bash
cd backend
npm install
npm run seed
```

Before recreating the demo dataset, the script deletes existing survey responses and surveys marked with `isSeedData: true`. Records not marked as demo data are not targeted by these deletion queries.

Running the seed command again recreates the demo dataset. It is not a full database reset.

## Stop the application

- Stop the frontend development server by pressing `Ctrl+C` in its terminal.
- Stop the backend development server by pressing `Ctrl+C` in its terminal.
- Stop MongoDB from the repository root:

```bash
docker compose down
```

`docker compose down` stops and removes the Compose containers and network but preserves named volumes.

## Reset data

### Reset the demo dataset

From the repository root:

```bash
cd backend
npm run seed
```

This recreates the demo records according to the seed script. Records not marked with `isSeedData: true` are not targeted by the cleanup queries.

### Completely reset local MongoDB data

**Warning:** This permanently deletes data stored in the Compose MongoDB volume, including surveys and responses that are not demo data.

From the repository root:

```bash
docker compose down -v
docker compose up -d
```

Then restore demo data if needed:

```bash
cd backend
npm run seed
```

Only run `docker compose down -v` when you deliberately want to delete all data in the local Compose volume. Do not use this command against a production database.

## Testing and builds

Run backend tests:

```bash
cd backend
npm test
```

Build the backend:

```bash
cd backend
npm run build
```

Build the frontend:

```bash
cd frontend
npm run build
```

Record the actual outcome of each manual acceptance scenario in `ACCEPTANCE_CHECKLIST.md`. Do not mark a scenario as passed until it has been tested. Include screenshots or API responses as evidence where useful.

## Architecture

The backend follows a lightweight Domain-Driven Design (DDD) approach:

- **Domain:** Survey entities, question definitions, response models, and business rules.
- **Application:** Use cases for creating surveys, managing questions, submitting responses, and calculating results.
- **Infrastructure:** MongoDB models and repository implementations.
- **Presentation:** Express routes that expose application operations through HTTP APIs.

The `Survey` domain entity owns question definitions and lifecycle rules. Repository interfaces separate application logic from MongoDB/Mongoose-specific code. The React frontend provides the survey dashboard, builder and preview, respondent form, and results views.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the detailed architecture, request flow, design tradeoffs, and implementation notes.

## API documentation

The local surveys API base URL is:

```text
http://localhost:5000/api/surveys
```

The backend health check is available at `GET http://localhost:5000/`.

See [API_Documentation.md](API_Documentation.md) for endpoint details, request and response examples, question and answer validation, pagination, and error behavior.

## Acceptance checklist and known limitations

- [Acceptance checklist](ACCEPTANCE_CHECKLIST.md) — record the steps, expected results, actual results, and evidence for each required scenario.
- [Known limitations](KNOWN_LIMITATIONS.md) — document incomplete requirements and confirmed issues honestly.

Ensure these files exist before submission. Only record results that have actually been verified.

## Deployment

The frontend and backend can be deployed separately. Set the frontend's `VITE_API_URL` to the public backend API base, for example `https://your-backend-domain/api`, and configure the backend's `MONGODB_URI` and `PORT` through the hosting provider's environment settings.

Use fictional demo data only. Keep database credentials on the backend, do not expose MongoDB credentials to the browser, and restrict hosted database network access where practical.

## Notes

- Survey response submission is allowed only while a survey is published.
- Authentication and authorization are not implemented in this exercise; do not treat the public API as access-controlled.
