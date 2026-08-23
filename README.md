# RouteForge 🚚

> **Vehicle Route & Fuel Cost Optimizer** — a browser-based route planning and delivery management system that helps users build, optimize, save, and analyze multiple delivery routes while considering distance, fuel cost, delivery priority, and time windows.

RouteForge is designed as a clean, frontend-first project using **HTML, CSS, and vanilla JavaScript**. It demonstrates real algorithmic route optimization instead of depending on a map-routing API for the core optimization logic.

---

## ✨ What RouteForge Does

RouteForge turns a list of delivery stops into an optimized route and gives the user practical delivery metrics.

### Core capabilities

- 📍 Add multiple delivery/pickup stops
- 🧭 Calculate distance between coordinates using the **Haversine formula**
- ⚡ Prioritize urgent deliveries
- ⏰ Support delivery time windows
- 🧠 Generate an initial route using a **priority-aware nearest-neighbor heuristic**
- 🔄 Improve the route using **2-Opt optimization**
- ⛽ Estimate fuel consumption
- 💰 Estimate fuel/travel cost
- 💾 Save multiple independent routes per user
- 📊 View route history and analytics
- 🚗 Manage vehicles
- 👤 User authentication using browser storage
- 🛡️ Admin dashboard for users, routes, urgent deliveries, late deliveries, and analytics
- 🎨 Responsive RouteForge UI with animated landing/auth experiences

---

## 🎯 Project Objective

The main objective of RouteForge is to provide a practical demonstration of how an algorithmic route optimization system can reduce unnecessary travel distance and help delivery operators make better routing decisions.

Instead of simply displaying locations on a map, RouteForge performs the optimization itself using JavaScript algorithms. This makes the project suitable for demonstrating **data structures, algorithms, optimization heuristics, frontend development, and delivery-management concepts**.

---

## 🧠 Route Optimization Approach

RouteForge uses a simplified version of the Traveling Salesman Problem (TSP) approach.

### 1. Haversine Distance

For latitude/longitude coordinates, RouteForge calculates the great-circle distance between two locations using the Haversine formula.

This provides a much more meaningful distance calculation than treating latitude and longitude as ordinary Cartesian coordinates.

### 2. Priority-Aware Nearest Neighbor

The optimizer builds an initial route by selecting the next useful stop based on a combination of:

- distance from the current location
- delivery priority
- urgent-delivery status
- time-window considerations

This produces a fast initial solution without trying every possible permutation.

### 3. 2-Opt Improvement

The initial route is then improved with the **2-Opt heuristic**.

The algorithm checks whether replacing two route edges with two different edges reduces the total route distance. If an improvement is found, the route segment is reversed.

This process continues until no useful local improvement is found or the configured optimization limit is reached.

### Why heuristics?

For `n` stops, checking every possible route becomes computationally expensive very quickly. RouteForge therefore uses heuristics to produce a strong route in practical time.

> **Important:** RouteForge is a heuristic optimizer, not a guaranteed globally optimal TSP solver.

---

## 📦 Project Structure

The project is intentionally separated into three main folders to keep the codebase clean.

```text
RouteForge/
│
├── html/                 # All application pages
│   ├── index.html        # Landing page
│   ├── login.html        # User login
│   ├── signup.html       # User registration
│   ├── dashboard.html    # User dashboard
│   ├── plan-route.html   # Route creation/planning
│   ├── route-result.html # Optimization result
│   ├── routes.html       # Saved routes
│   ├── history.html      # Route history
│   ├── vehicles.html     # Vehicle management
│   ├── analytics.html    # User analytics
│   ├── profile.html      # Profile
│   ├── settings.html     # Settings
│   │
│   └── admin-*.html      # Admin pages
│
├── css/                  # Styling
│   ├── styles.css        # Main visual system/theme
│   └── app.css           # Application/dashboard styles
│
├── js/                   # Application logic
│   ├── core.js           # Shared state, auth, storage, helpers
│   ├── optimizer.js      # Route optimization algorithms
│   ├── planner.js        # Route planning UI logic
│   ├── result.js         # Optimization results/saving
│   ├── dashboard.js      # Dashboard calculations/UI
│   ├── admin.js          # Admin functionality
│   ├── generic.js        # Shared page functionality
│   ├── login.js          # Login handling
│   ├── signup.js         # Registration handling
│   ├── scene.js          # Landing-page visual effects
│   ├── auth-scene.js     # Auth-page visual effects
│   └── app.js            # General application behavior
│
├── .gitignore
└── README.md
```

---

## 🖥️ Application Pages

### Public pages

| Page | Purpose |
|---|---|
| `index.html` | RouteForge landing page and product introduction |
| `login.html` | Login to an existing account |
| `signup.html` | Create a new account |

### User pages

| Page | Purpose |
|---|---|
| `dashboard.html` | Overview of routes, stops, distance, fuel, and cost |
| `plan-route.html` | Create and optimize a new route |
| `route-result.html` | Inspect the optimized route and save it |
| `routes.html` | Browse multiple saved routes |
| `history.html` | Review previous route activity |
| `vehicles.html` | Add/manage delivery vehicles |
| `analytics.html` | Analyze route and delivery performance |
| `profile.html` | Manage user profile information |
| `settings.html` | Application/user settings |

### Admin pages

| Page | Purpose |
|---|---|
| `admin-dashboard.html` | Admin command center and overview |
| `admin-users.html` | View and manage all users |
| `admin-routes.html` | View routes across all users |
| `admin-urgent.html` | Monitor urgent deliveries |
| `admin-late.html` | Monitor late/problem deliveries |
| `admin-analytics.html` | Overall system analytics |

---

## 👥 Multi-User & Multi-Route System

A major part of RouteForge is that a user is **not limited to one route**.

The relationship is conceptually:

```text
User
 ├── Route 1
 │    ├── Stop 1
 │    ├── Stop 2
 │    └── Stop 3
 │
 ├── Route 2
 │    ├── Stop 1
 │    └── Stop 2
 │
 └── Route 3
      ├── Stop 1
      ├── Stop 2
      └── Stop 3
```

Creating a new route does not overwrite older routes.

The application keeps route ownership associated with the logged-in user, while administrators can inspect system-wide route information.

---

## 💾 Data Storage

This version is a **frontend-only demonstration application** and uses browser `localStorage` rather than a production database.

Typical stored entities include:

```text
routeforge_users
routeforge_routes
routeforge_vehicles
routeforge_session
routeforge_settings
```

Because the data is stored in the browser:

- data is tied to the current browser/device
- clearing site data can remove stored records
- it is not suitable for production authentication
- there is no real server-side access control

For a production deployment, the storage layer should be replaced with a backend database and secure authentication service.

---

## 🔐 Demo Credentials

### User account

```text
Email:    demo@routeforge.app
Password: demo1234
```

### Admin account

```text
Email:    admin@routeforge.app
Password: admin1234
```

The application also initializes demo users when needed so the Admin → Users section can be demonstrated without manually creating every account.

> These credentials are for demonstration purposes only and must not be used as real production credentials.

---

## 🚀 How to Run

RouteForge does not require Node.js, npm, Python, a database, or a build process for the current frontend version.

### Option 1 — Open directly

1. Extract the ZIP.
2. Open the project folder.
3. Open:

```text
html/index.html
```

4. Use the landing page to navigate to Login/Signup.

### Option 2 — Recommended: run a local server

Using a small local web server is preferable because browsers handle local files differently from files served over HTTP.

For example, with Python installed:

```bash
cd RouteForge
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/html/index.html
```

---

## 🧪 Suggested Demo Flow

For a project presentation or evaluation, use this sequence:

1. Open the RouteForge landing page.
2. Explain the problem: delivery routing can become inefficient as stops increase.
3. Login as a user.
4. Open **Plan Route**.
5. Add several stops with different priorities.
6. Add at least one urgent delivery.
7. Configure delivery time windows.
8. Run optimization.
9. Explain the Haversine distance calculation.
10. Explain the nearest-neighbor initial solution.
11. Explain how 2-Opt improves the route.
12. Show total distance, fuel, and cost.
13. Save the route.
14. Create another route to demonstrate the multi-route system.
15. Open **My Routes** and show that both routes remain available.
16. Open **Analytics/History**.
17. Open **Vehicles** and demonstrate vehicle management.
18. Logout.
19. Login as admin.
20. Demonstrate Users, Routes, Urgent, Late, and Analytics pages.

---

## 📊 Important Metrics

RouteForge can present practical routing metrics such as:

- Total distance
- Estimated fuel consumption
- Estimated fuel/travel cost
- Number of stops
- Urgent delivery count
- Late delivery count
- Route status
- Route history
- User-level route statistics
- System-wide admin statistics

These metrics make the project easier to demonstrate as a complete delivery optimization application rather than only an algorithm demo.

---

## 🎨 UI & Design

The application uses a consistent RouteForge visual identity across the public, authentication, user, and admin areas.

The design includes:

- Responsive layouts
- Dashboard cards
- Sidebar navigation
- Route/result panels
- Animated landing/authentication scenes
- Consistent typography and spacing
- Status and priority indicators
- Empty states and feedback messages

The codebase separates CSS from HTML so visual changes can be made without rewriting page structure.

---

## 🛡️ Admin Capabilities

The Admin area is intended for operational monitoring.

Administrators can inspect:

- Registered users
- User roles
- User status
- Saved routes
- Route owners
- Route distance/cost information
- Urgent deliveries
- Late deliveries
- Overall analytics

Deleting a user is treated as a related-data operation so their associated application records can also be cleaned up.

---

## 🔧 Troubleshooting

### I cannot login with the demo credentials

Use:

```text
admin@routeforge.app / admin1234
```

or:

```text
demo@routeforge.app / demo1234
```

Then perform a hard refresh:

```text
Ctrl + Shift + R
```

If old browser data is interfering, clear the site's local storage and reopen the project.

### My old routes/users are missing

RouteForge uses browser localStorage. Data belongs to the browser profile where it was created.

Changing browsers, private/incognito windows, or clearing site data can result in a different storage state.

### Pages do not open correctly from a file

Run the project through a local HTTP server instead of opening the HTML files directly.

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/html/index.html
```

### I created a new route and the old route disappeared

The current architecture is designed to keep multiple saved routes. If this happens, check that you are using the latest RouteForge version and that browser storage has not been manually cleared.

---

## ⚠️ Production Considerations

This project is intentionally a frontend-focused academic/demo implementation.

For production use, the following should be added:

- Real backend API
- Database such as PostgreSQL/MySQL
- Secure password hashing
- Server-side authentication and authorization
- HTTP-only secure sessions/tokens
- Input validation on the server
- CSRF/XSS protections
- Rate limiting
- Audit logging
- Real geocoding/routing service if road-network distance is required
- Server-side route optimization for large datasets
- Persistent cloud storage

The current localStorage authentication should **not** be considered secure production authentication.

---

## 🧩 Technology Stack

```text
Frontend
├── HTML5
├── CSS3
└── Vanilla JavaScript

Storage
└── Browser localStorage

Optimization
├── Haversine distance
├── Priority-aware Nearest Neighbor
└── 2-Opt heuristic
```

No framework is required for the current version.

---

## 📚 Algorithmic Complexity — High-Level View

A nearest-neighbor construction is substantially cheaper than enumerating all possible routes.

A brute-force TSP approach can require checking approximately:

```text
(n - 1)!
```

possible tours.

RouteForge instead builds a practical initial route and then performs local 2-Opt improvements. The exact runtime depends on the number of stops and the configured optimization loop, but the heuristic approach is much more practical for an interactive browser application.

---

## 🔮 Possible Future Enhancements

Future versions could include:

- Live maps and road-network routing
- GPS tracking
- Driver assignment
- Real-time delivery status
- Multi-vehicle optimization / VRP
- Capacity constraints
- Traffic-aware routing
- Geocoding from addresses
- Backend database synchronization
- Push notifications
- Customer tracking links
- Export route to PDF/CSV
- AI-based delivery-time prediction
- Advanced optimization such as Genetic Algorithms or Simulated Annealing

---

## 🏆 Academic / Viva Highlights

If presenting RouteForge as an academic project, emphasize these points:

### Problem
Delivery companies need to visit multiple locations while minimizing unnecessary travel, fuel consumption, and cost.

### Algorithmic contribution
The project implements its own route optimization logic using distance calculation, nearest-neighbor construction, priority handling, and 2-Opt improvement.

### Why not brute force?
The number of possible routes grows factorially, making exhaustive search impractical as the number of stops increases.

### Why 2-Opt?
Nearest Neighbor is fast but can produce inefficient paths. 2-Opt improves the route by removing unnecessary crossings and reducing total distance.

### Why multiple routes?
Real users may plan different routes for different days, vehicles, regions, or delivery batches. Therefore, the system stores multiple independent routes per user instead of maintaining only one route.

---

## 📄 License / Usage

This project is intended for educational, demonstration, and portfolio purposes. Modify and extend it according to your project requirements.

---

## 👨‍💻 RouteForge

**RouteForge — Plan smarter. Drive less. Deliver better.**

A route optimization and delivery management project focused on combining practical UI design with genuine algorithmic route optimization.
