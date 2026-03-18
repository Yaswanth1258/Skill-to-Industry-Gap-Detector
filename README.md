# Skill-to-Industry Gap Detector

A full-stack application that helps students compare their current skills with industry role requirements, identify skill gaps, and generate learning roadmaps.

## Features

- Student profile creation and update
- Industry role exploration
- Skill gap analysis between student profile and selected role
- AI-powered roadmap generation
- Career insights dashboard

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB + Mongoose

### Frontend

- React (Create React App)
- Tailwind CSS
- Framer Motion
- Recharts / Chart.js

## Project Structure

```text
backend/
frontend/
```

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB (Atlas or local instance)

## Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Note: The backend includes a fallback MongoDB URI in code, but using your own `MONGODB_URI` in `.env` is strongly recommended.

## Installation

### 1) Install backend dependencies

```bash
cd backend
npm install
```

### 2) Install frontend dependencies

```bash
cd ../frontend
npm install
```

## Run Locally

### Start backend server

```bash
cd backend
npm run dev
```

Backend runs on http://localhost:5000

### Start frontend app

```bash
cd frontend
npm start
```

Frontend runs on http://localhost:3000

## Useful Backend Scripts

From `backend/`:

- `npm start` - start server in production mode
- `npm run dev` - start server with nodemon
- `npm run init-db` - initialize database collections

## API Base URL

Frontend currently targets:

- `http://localhost:5000`

## Main API Routes

- `/api/health`
- `/api/student`
- `/api/roles`
- `/api/analysis`
- `/api/roadmap`
- `/api/insights`

## License

MIT
