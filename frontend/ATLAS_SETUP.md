# RouteForge — MongoDB Atlas Setup (Windows / VS Code)

## 1. Secure your Atlas account first
The database password was visible in a chat screenshot/message. In MongoDB Atlas, open **Database Access** and change that database user's password. Use the NEW password in your local `.env` file. Do not share it or commit `.env` to Git.

## 2. Create the local environment file
In VS Code, open the `backend` folder. Copy `backend/.env.example` to a new file named `backend/.env`.
In `.env`, replace `YOUR_NEW_PASSWORD` with the new Atlas database password, and replace the JWT secret placeholder with a unique random value at least 32 characters long.
If the password contains special characters such as `@`, `#`, `/`, or `:`, URL-encode those characters in the URI.

The Atlas URI should keep this format:
`mongodb+srv://aditya3098beai24_db_user:YOUR_NEW_PASSWORD@cluster0.qh0s7if.mongodb.net/routeforge?retryWrites=true&w=majority`

## 3. Allow your IP in Atlas
In Atlas, open **Network Access** and add your current IP address. Save the change.

## 4. Install and start the backend
Open a terminal in VS Code and run:
```powershell
cd backend
npm install
npm run dev
```
If the terminal is already in `backend`, do not run `cd backend` again.

## 5. Test the health endpoint
In Postman, send a GET request to:
`http://localhost:5000/api/health`
Expected response:
```json
{"status":"ok","service":"RouteForge API"}
```

If the connection fails, check that Atlas has finished creating the cluster, the IP address is allowed, and the new database username/password are correct.
