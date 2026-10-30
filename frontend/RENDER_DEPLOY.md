# RouteForge Render + MongoDB deployment

## Frontend configuration

`js/api.js` uses the deployed API by default:

`https://routeforge-backend2-0.onrender.com/api`

You can override it before loading `js/api.js` by defining `window.ROUTEFORGE_API_URL`.

## Backend deployment (required for all updated admin/profile APIs)

This ZIP includes backend API changes. To make them live, push the contents to the GitHub repository connected to Render, or upload this backend folder to that repository and deploy it. Render settings should be:

- Root Directory: `backend` (the top-level `backend/` folder in this ZIP)
- Build Command: `npm install`
- Start Command: `npm start`

Render environment variables:

- `MONGODB_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: a strong random secret with at least 32 characters
- `CLIENT_ORIGIN`: comma-separated exact origins for every frontend domain, e.g. your Netlify URL and local Live Server URL
- `NODE_ENV`: `production`

Do not put `.env` or database credentials in the frontend or ZIP. Set secrets in Render's Environment settings only.

## API capabilities in this version

- `GET /api/health`
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/me`
- `GET/POST /api/vehicles`, `PUT/DELETE /api/vehicles/:id`
- `GET/POST /api/routes`, `GET/PUT/DELETE /api/routes/:id`
- Admin-only `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id`
- Admin users can request `GET /api/routes?all=true` and `GET /api/vehicles?all=true`

Admin APIs enforce role authorization on the server. An account must already have `role: "admin"` in MongoDB to access them. Do not grant admin role from browser code.
