# QW Survey

A full-stack survey management application built with React, TypeScript, Express, and MongoDB. It allows users to create surveys, manage questions, publish surveys, collect responses, and view results.

## Features

- Create and manage surveys.
- Add, edit, and delete survey questions.
- Support short text, long text, single choice, multiple choice, and rating questions.
- Preview surveys before publishing.
- Publish and close surveys.
- Submit responses through a dedicated respondent page.
- View response summaries, option counts, text answers, and average ratings.
- Browse surveys using status filters and server-side pagination.
- Browse submitted responses using server-side pagination.
- Persist data in MongoDB.

## Technology Stack

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

### Development and Testing
- Docker Compose
- Vitest

## Project Structure

\`\`\`text
qw_survey/
├── backend/
│   └── src/
│       ├── application/
│       ├── domain/
│       ├── infrastructure/
│       └── presentation/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── assets/
│       ├── App.tsx
│       └── App.css
├── docker-compose.yml
├── .gitignore
└── README.md
\`\`\`

## Prerequisites

Install the following before running the project:

- Node.js and npm
- Docker Desktop
- Git

## Getting Started

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/Dhanu-06/qw.git
cd qw
\`\`\`

### 2. Start MongoDB

From the project root, run:

\`\`\`bash
docker compose up -d
\`\`\`

### 3. Configure the backend

Create a \`backend/.env\` file and configure the MongoDB connection string using the environment variable expected by \`backend/src/infrastructure/database.ts\`.

Do not commit your real environment file or credentials.

### 4. Start the backend

Open a terminal:

\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### 5. Start the frontend

Open a separate terminal from the project root:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Open the local URL printed by Vite in your terminal, usually http://localhost:5173.

## Testing

Run the backend tests:

\`\`\`bash
cd backend
npm test
\`\`\`

Build the frontend:

\`\`\`bash
cd frontend
npm run build
\`\`\`

## Architecture

The backend follows a Domain-Driven Design-inspired layered structure:

- **Domain:** Survey entities, question definitions, response models, and business rules.
- **Application:** Use cases for creating surveys, managing questions, submitting responses, and calculating results.
- **Infrastructure:** MongoDB models and repository implementations.
- **Presentation:** Express routes that expose the application through HTTP APIs.

The React frontend provides the survey dashboard, survey builder, respondent form, and results page.

## API Overview

Base URL: \`http://localhost:5000/api/surveys\`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | \`/api/surveys\` | List surveys with pagination and optional status filtering |
| POST | \`/api/surveys\` | Create a survey |
| GET | \`/api/surveys/:id\` | Retrieve a survey |
| POST | \`/api/surveys/:id/questions\` | Add a question |
| PUT | \`/api/surveys/:id/questions/:questionId\` | Update a question |
| DELETE | \`/api/surveys/:id/questions/:questionId\` | Delete a question |
| POST | \`/api/surveys/:id/publish\` | Publish a survey |
| POST | \`/api/surveys/:id/close\` | Close a survey |
| POST | \`/api/surveys/:id/responses\` | Submit a response |
| GET | \`/api/surveys/:id/responses\` | List responses with server-side pagination |
| GET | \`/api/surveys/:id/results\` | Retrieve survey result summaries |

Pagination endpoints accept query parameters such as \`page\` and \`limit\`. The survey listing also supports a \`status\` filter.

## Notes

- Configure environment variables locally before starting the backend.
- Keep credentials and secrets out of version control.
- Survey response submission is available only while the survey is published.

