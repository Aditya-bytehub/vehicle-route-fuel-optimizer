# RouteForge — Vehicle Route Fuel Optimizer

RouteForge includes a vanilla HTML/CSS/JavaScript frontend and a Node.js + Express API using MongoDB/Mongoose. This package is configured for **MongoDB Atlas**, so you do not need to install MongoDB Server locally.

## 1. Requirements
- Node.js 18 or newer
- A free MongoDB Atlas account: https://www.mongodb.com/cloud/atlas

## 2. Create your MongoDB Atlas database
1. Sign in to MongoDB Atlas and create a project.
2. Create a free database deployment/cluster.
3. In **Database Access**, create a database user and password. These are separate from your Atlas website login.
4. In **Network Access**, add your current IP address. For temporary development only, Atlas allows `0.0.0.0/0` (access from anywhere); avoid this for production if you can, and use a strong database password.
5. Open **Database → Connect → Drivers → Node.js** and copy the connection string.
6. Replace the username, password, and cluster host placeholders. Keep `/routeforge` as the database name. If your password contains special characters, URL-encode them before putting them in the connection string.

Example format (not a working URI):
```text
mongodb+srv://DB_USERNAME:DB_PASSWORD@cluster-name.xxxxx.mongodb.net/routeforge?retryWrites=true&w=majority&appName=RouteForge
```

## 3. Configure the backend
Open a terminal in this project's `backend` folder and run:
```powershell
npm install
```
Copy `backend/.env.example` to a new file named `backend/.env`. Edit `.env` and replace the `MONGODB_URI` placeholders with your real Atlas connection string. Change `JWT_SECRET` to a long random value of at least 32 characters. Do not share or commit `.env`.

On Windows PowerShell, from the project root you can copy the example with:
```powershell
Copy-Item backend/.env.example backend/.env
```
Then edit `backend/.env` in VS Code.

## 4. Start the backend
From the `backend` folder, run:
```powershell
npm run dev
```
You should see a message indicating MongoDB connected and the API is running on port 5000. Test in a browser or Postman:
- `GET http://localhost:5000/api/health`
- Expected response: `{ "status": "ok", "service": "RouteForge API" }`

If the connection fails, check that the Atlas IP allowlist includes your current public IP, the database username/password are correct, the URI host is copied exactly, and the database password is URL-encoded if necessary.

## 5. Run the frontend locally
Keep the backend running. Open a second terminal in the project root and run:
```powershell
npx serve . -l 5500
```
If `serve` asks to install, confirm. Open the local URL it prints. The frontend API defaults to `https://routeforge-backend-1.onrender.com/api`; see `RENDER_DEPLOY.md` for backend deployment and environment settings.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | Sign in and receive a JWT |
| GET | `/api/auth/me` | Current authenticated user |
| GET | `/api/routes` | List the signed-in user's routes |
| POST | `/api/routes` | Save a route to MongoDB |
| GET | `/api/routes/:id` | Get a route the user owns |
| PUT | `/api/routes/:id` | Update a route the user owns |
| DELETE | `/api/routes/:id` | Delete a route the user owns |
| GET | `/api/vehicles` | List the signed-in user's vehicles |
| POST | `/api/vehicles` | Add a vehicle |
| PUT | `/api/vehicles/:id` | Update a vehicle |
| DELETE | `/api/vehicles/:id` | Delete a vehicle |

Protected endpoints require `Authorization: Bearer <token>`.

## Notes
- Do not commit `backend/.env`; it contains secrets. The `.env.example` contains placeholders only.
- Signup/login and saving a newly planned route are connected to the API. Some existing route/vehicle UI actions still use browser storage and may need additional integration for full cross-device synchronization.
- The frontend should be served from a local web server rather than opened as a `file://` URL.
- For deployment, configure `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and `NODE_ENV` in the hosting provider's environment settings. Never upload `.env` to a public repository.

## Backend deployment
See [`RENDER_DEPLOY.md`](RENDER_DEPLOY.md) for instructions to deploy the existing `backend/` API on Render and connect the frontend.

## Render API integration update

Vehicle and route listing, create, duplicate, delete, dashboard summaries, profile updates, and admin user-management operations are wired to the Render API in this version. See `RENDER_DEPLOY.md` before deployment. The updated backend must be deployed to Render for the new `/api/admin/*` and `PUT /api/auth/me` endpoints to work; frontend-only deployment is not enough.
