# ParkEase – Smart Parking Management System

A dynamic web application for managing a 12-slot parking facility, built as a CCA 2 project for **Cloud Computing and DevOps (CSE30040)** at MIT World Peace University, Pune.

## 1. Project Overview

ParkEase lets users view live parking slot availability, book an available slot with their name and vehicle number, release a slot when leaving, and see an estimated parking fee based on elapsed time. It demonstrates a complete DevOps workflow: automated testing, linting, containerization, CI/CD, and cloud deployment.

## 2. Problem Statement

Manual parking management (paper logs, verbal tracking) is error-prone and doesn't scale. ParkEase solves this with a simple, real-time digital system that tracks slot status, vehicle details, and parking duration automatically.

## 3. Features

- View all 12 parking slots with live status (Available / Occupied)
- Book a slot with name, vehicle number, and slot selection
- Input validation (empty fields, vehicle number format, duplicate active bookings, occupied slot rejection)
- Release a slot to make it available again
- Live dashboard: total/available/occupied slots, active vehicles
- Estimated parking fee calculation (₹20 first hour, ₹10 each additional hour)
- Git commit ID displayed in the footer and via `/health`
- Fully responsive design (desktop, tablet, mobile)

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22, Express.js |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Testing | Node.js built-in `node:test`, `node:assert` |
| Linting | ESLint |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Deployment | Render (Docker-based Web Service) |

## 5. Project Structure
parkease/
├── .github/workflows/ci-cd.yml
├── public/
│ ├── index.html
│ ├── style.css
│ └── script.js
├── test/
│ └── app.test.js
├── app.js
├── server.js
├── package.json
├── Dockerfile
├── .dockerignore
├── .gitignore
└── README.md

## 6. How to Run Locally

```bash
git clone <ADD_GITHUB_URL>
cd parkease
npm install
npm start
```

Visit `http://localhost:3000`.

## 7. API Endpoints

| Method | Endpoint | Purpose | Request Body | Success Response | Status Codes |
|---|---|---|---|---|---|
| GET | `/health` | Health check | – | `{"status":"ok","commit":"abc1234"}` | 200 |
| GET | `/api/slots` | List all parking slots | – | Array of slot objects | 200 |
| GET | `/api/bookings` | List active bookings with fee estimate | – | Array of booking objects | 200 |
| POST | `/api/book` | Book an available slot | `{"userName","vehicleNumber","slotId"}` | `{"message","slot"}` | 201, 400, 404, 409 |
| POST | `/api/release/:slotId` | Release an occupied slot | – | `{"message","slot"}` | 200, 400, 404 |

## 8. Testing

```bash
npm test
```

Runs 6 automated tests covering the health check, successful booking, duplicate/occupied slot rejection, invalid vehicle number rejection, and slot release.

## 9. Linting

```bash
npm run lint
```

ESLint enforces consistent code style across `app.js`, `server.js`, and test files.

## 10. Docker

```bash
docker build -t parkease .
docker run -p 3000:3000 parkease
```

Visit `http://localhost:3000`.

## 11. CI/CD Pipeline

Defined in `.github/workflows/ci-cd.yml`, runs on every push and pull request:

1. **Lint** – runs ESLint
2. **Test** – runs the automated test suite
3. **Docker Build** – builds the production image
4. **Smoke Test** – runs the container and checks `/health`
5. **Deploy** – (only on push to `main`) triggers a Render deploy hook

If lint, test, or the Docker smoke test fails, later stages are skipped and deployment does not happen.

## 12. Git Workflow

- Feature work happens on branches (e.g. `feature/add-fee-info-note`)
- Pull Requests are opened into `main`, triggering CI (lint + test + Docker build, no deploy)
- After checks pass, the PR is merged into `main`, which triggers the full pipeline including deployment

## 13. Deployment

Live on **Render** as a Docker-based Web Service, with Auto-Deploy disabled — deployments are triggered exclusively via a GitHub Actions step calling Render's Deploy Hook, ensuring only tested, passing code reaches production.

- **Live Application**: <ADD_RENDER_URL>
- **GitHub Repository**: <ADD_GITHUB_URL>
- **GitHub Actions**: <ADD_ACTIONS_URL>

## 14. Screenshots

_(Add screenshots here: live app, dashboard, successful pipeline run, failed pipeline run)_

## 15. Future Scope

- Persistent database storage (currently in-memory)
- Admin authentication for managing slots
- Payment gateway integration for fee collection
- Slot reservation in advance