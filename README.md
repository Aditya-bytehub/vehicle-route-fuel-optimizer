# RouteX — Vehicle Route & Fuel Cost Optimizer

A static academic logistics optimizer built with HTML, CSS and Vanilla JavaScript. The existing cinematic 3D visual identity is retained using Three.js CDN for the hero/auth scenes.

## Demo accounts
- User: demo@routex.app / demo1234
- Admin: admin@routex.app / admin1234

## Core algorithms
1. Haversine distance
2. Priority-aware Nearest Neighbor
3. 2-Opt route improvement
4. Time-window simulation (waiting, on-time, at-risk, late)
5. Fuel = distance / mileage
6. Fuel cost = fuel × price

## Priority logic
Urgent, high, normal and low stops are scored together with distance, arrival time and deadline risk. Urgent stops are not blindly placed first; feasibility and travel distance are considered.

## Delivery windows
Each stop stores earliest time, latest time and service duration. The simulator computes arrival, waiting, service start, departure and late minutes.

## Storage
The demo uses localStorage keys: routex_users, routex_current_user, routex_routes, routex_vehicles, routex_preferences and routex_route_draft.

> This is a frontend-only academic demonstration. localStorage authentication is not secure for real production accounts. Use a secure backend for real authentication and authorization.

## Run
Use VS Code Live Server or any local HTTP server. Static hosting is supported.
