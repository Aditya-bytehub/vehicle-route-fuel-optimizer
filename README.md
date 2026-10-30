# RouteForge — Clean Frontend + Backend 2.0

This package separates the static frontend and the Express/MongoDB backend.

## Structure

- `frontend/` — HTML pages, CSS, and browser JavaScript
- `backend/` — Backend 2.0 (Express, JWT authentication, MongoDB/Mongoose)
- `backend/.env.example` — Safe environment-variable template

The frontend is configured to use this Render API by default:

`https://routeforge-backend2-0.onrender.com/api`

## Run the frontend locally

From the project root, start a static server:

```powershell
npx serve frontend -l 5500
```

Open the local URL printed by `serve`. Do not open the HTML files directly using `file://`.

## Run the backend locally

Use Node.js 18 or newer. In a second terminal:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and set your real `MONGODB_URI` and a strong `JWT_SECRET` of at least 32 characters. Then run:

```powershell
npm run dev
```

Health check: `http://localhost:5000/api/health`

For local development, if you want the frontend to call your local backend instead of Render, add this before `js/api.js` loads on the frontend pages:

```html
<script>window.ROUTEFORGE_API_URL = 'http://localhost:5000/api';</script>
```

## Render deployment notes

The frontend's default API URL already points to the supplied Render service. For a separate backend deployment, use `backend` as the Render Root Directory, `npm install` as the build command, and `npm start` as the start command.

Set these in Render's Environment settings (do not commit secrets):
- `MONGODB_URI`
- `JWT_SECRET` (at least 32 characters)
- `CLIENT_ORIGIN` (comma-separated exact frontend origins, including the deployed Netlify URL)
- `NODE_ENV=production`

Render supplies `PORT` automatically.

## Main API endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `GET/POST /api/routes`
- `GET/PUT/DELETE /api/routes/:id`
- `GET/POST /api/vehicles`
- `PUT/DELETE /api/vehicles/:id`
- Admin: `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id`

Protected endpoints use `Authorization: Bearer <token>`.

## Security

- The real `.env` from the uploaded backend archive was intentionally excluded.
- `.git` history and `node_modules` are not included.
- Keep real database credentials and JWT secrets in Render environment settings or a private local `.env` file.
