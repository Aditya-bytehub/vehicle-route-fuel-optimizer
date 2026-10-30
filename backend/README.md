# RouteForge Backend — Final

Express + MongoDB/Mongoose API used by the RouteForge frontend.

## Deploy to Render

For a repository containing only the contents of this `backend` folder:
- Root Directory: leave blank or `.`
- Build Command: `npm install`
- Start Command: `npm start`

If the backend folder is inside a larger repository:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Set these in Render → Environment:
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: long random secret, minimum 32 characters
- `CLIENT_ORIGIN`: comma-separated exact frontend origins, e.g. your Netlify domain and `http://127.0.0.1:5500`
- `NODE_ENV`: `production`

Do not upload `.env` or real credentials. For local development, copy `.env.example` to `.env`.

## Health checks

- `GET /`
- `GET /api/health` — expected `{"status":"ok","service":"RouteForge API"}`

If a route returns 404, inspect the returned `method`, `path`, and `hint`; confirm Render deployed the latest commit and that the root directory points to this backend.

## Authentication

- `POST /api/auth/signup` — JSON `{ "name": "Name", "email": "user@example.com", "phone": "", "password": "at-least-8-chars" }`
- `POST /api/auth/login` — JSON `{ "email": "user@example.com", "password": "..." }`
- `GET /api/auth/me` — Bearer token required
- `PUT /api/auth/me` — Bearer token required; JSON `{ "name": "New Name", "phone": "" }`

Passwords are hashed with bcrypt. JWT tokens expire after 7 days. Signup always creates a regular `user`; public signup cannot grant admin privileges.

## Admin setup (one-time)

1. Sign up for the intended account through the app.
2. In the backend directory, configure local `.env` to point at the same MongoDB database used by Render. Alternatively, run the script in a secure environment where the same environment variables are set.
3. Run: `npm run set-admin -- your-email@example.com`
4. Sign in again, then use the newly issued token.

The script promotes only the supplied existing account and does not create a public admin endpoint. Never share your token or `.env`.

## API routes

All admin endpoints require `Authorization: Bearer <token>` and an active account whose database role is `admin`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/signup` | Public | Create regular user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | User | Current profile |
| PUT | `/api/auth/me` | User | Update own profile |
| GET | `/api/routes` | User | Own routes |
| GET | `/api/routes?all=true` | Admin | All routes |
| POST | `/api/routes` | User | Create route |
| GET | `/api/routes/:id` | Owner/Admin | Read route |
| PUT | `/api/routes/:id` | Owner/Admin | Update route |
| DELETE | `/api/routes/:id` | Owner/Admin | Delete route |
| GET | `/api/vehicles` | User | Own vehicles |
| GET | `/api/vehicles?all=true` | Admin | All vehicles |
| POST | `/api/vehicles` | User | Create vehicle |
| PUT | `/api/vehicles/:id` | Owner/Admin | Update vehicle |
| DELETE | `/api/vehicles/:id` | Owner/Admin | Delete vehicle |
| GET | `/api/admin/users` | Admin | List users |
| PATCH | `/api/admin/users/:id` | Admin | Update user role/status |
| DELETE | `/api/admin/users/:id` | Admin | Delete user and associated routes/vehicles |

## Data schemas

### User
- `name`: string, required, max 80
- `email`: unique lowercase string, required
- `phone`: string, optional
- `passwordHash`: bcrypt hash, never returned by API
- `role`: `user` or `admin` (default `user`)
- `status`: `active` or `blocked` (default `active`)
- `createdAt`, `updatedAt`: timestamps

### Route
- `userId`: authenticated owner's ObjectId (server-assigned)
- `routeName`: string, required, max 120
- `vehicleId`: string
- `depot`: object/mixed
- `startTime`, `startDate`: strings
- `stops`: array of stop objects (flexible structure to support planner fields such as name, coordinates, priority, time windows)
- `originalOrder`, `optimizedOrder`: arrays of strings
- `originalDistance`, `optimizedDistance`, `fuelUsed`, `fuelCost`: numbers
- `urgentCount`, `lateCount`: numbers
- `onTimeRate`: number (default 100)
- `algorithm`: string
- timestamps

Example route payload (the server assigns `userId`):
```json
{
  "routeName": "Morning Delivery Route",
  "vehicleId": "vehicle-id-or-empty",
  "depot": {"name":"Warehouse","lat":30.7,"lng":76.7},
  "startTime": "09:00",
  "startDate": "2026-10-28",
  "stops": [
    {"id":"stop-1","name":"Customer A","lat":30.71,"lng":76.72,"priority":"urgent","windowStart":"10:00","windowEnd":"12:00"}
  ],
  "originalOrder": ["stop-1"],
  "optimizedOrder": ["stop-1"],
  "originalDistance": 12.5,
  "optimizedDistance": 10.8,
  "fuelUsed": 1.2,
  "fuelCost": 120,
  "urgentCount": 1,
  "lateCount": 0,
  "onTimeRate": 100,
  "algorithm": "Haversine + Priority-Aware NN + 2-Opt"
}
```

### Vehicle
- `userId`: authenticated owner's ObjectId (server-assigned)
- `name`: string, required, max 100
- `reg`: string
- `fuelType`: `Petrol`, `Diesel`, `CNG`, `Electric`, `Hybrid`, or `Other`
- `mileage`, `fuelPrice`, `capacity`, `speed`: non-negative numbers (defaults: 0, 0, 0, 40)
- timestamps

### Error responses
- `400`: invalid input/schema
- `401`: missing/invalid/expired token or unavailable account
- `403`: valid user lacks required role/ownership, or CORS origin rejected
- `404`: endpoint/record not found
- `409`: duplicate unique value
- `500`: server error (generic in production)

## Notes

- Route `stops` is deliberately flexible (`Mixed`) because the planner stores multiple stop attributes. The API persists optimization results; it does not itself run the route optimizer.
- Do not add a public endpoint that allows a caller to set their own role to admin.
