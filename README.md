# Strumify - Production Build

Strumify is a Duolingo-style guitar learning platform that combines structured lessons with real practice tools.

## Final Architecture

```txt
Strumify/
  backend/
    middleware/
    models/
    routes/
    seed.js
    server.js
  frontend/
    public/
      logo.png
    src/
      api/
      components/
      pages/
      store/
      App.jsx
```

Legacy duplicate files and old app folders were removed.

## Brand System

- Logo: `frontend/public/logo.png`
- Primary amber: `#F59E0B`
- Background: `#0B0B0B`
- Surface: `#111111`
- Text: `#EAEAEA`

## Course Data Seeded

Course: **Strumify Beginner Foundation**

Modules:
1. Guitar Basics
2. Chords
3. Strumming
4. Music Theory
5. Power Chords
6. Technique
7. Advanced Basics
8. Musical Thinking
9. Final Stage

Total lessons seeded: **31**

## Backend API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `GET /api/courses`
- `GET /api/courses/:id/modules`
- `GET /api/modules/:id/lessons`
- `POST /api/lessons/complete`

## Practice Tools in Lesson Player

- Metronome (BPM, tap tempo, visual beat)
- Guitar tuner (pitch detection with E A D G B E)
- Practice timer (session tracking)
- Real-time listener (pitch feedback)
- Audio recorder
- Webcam recording
- Floating YouTube player
- Short reel tips panel

## Environment Variables

### Backend (Render)

- `MONGO_URI`
- `JWT_SECRET`
- `PORT`
- `CLIENT_ORIGIN` (recommended for CORS)

### Frontend (Vercel)

- `VITE_API_URL` (for example: `https://your-backend.onrender.com/api`)

## Local Run

```bash
npm install
npm run seed
npm run dev
```

Seed runs manually only. It never runs during server startup.

## Deployment Safety

- No hardcoded localhost API URLs in source code.
- JWT auth enforced in middleware for all protected routes.
- MongoDB is connected before `app.listen()` to avoid startup race conditions.
- Business logic (XP, streak, level, completion) stays in backend for future React Native reuse.
