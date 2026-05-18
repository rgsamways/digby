# Digby.rocks

An Airbnb-style marketplace for rockhound site access — connecting mineral enthusiasts with landowners and guided tour operators across Ontario and Canada.

## Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Python 3.12, FastAPI, Beanie (MongoDB)  |
| Database   | MongoDB Atlas                           |
| Frontend   | Next.js 15, Tailwind CSS, Mapbox GL     |
| Payments   | Stripe Connect                          |
| Deployment | Railway                                 |
| CI/CD      | GitHub Actions                          |

## Local Development

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- Python 3.12+ with `uv`

### Quick Start

```bash
cp .env.example .env
# fill in .env values

docker compose up
```

Backend: http://localhost:8000  
Frontend: http://localhost:3000  
API docs: http://localhost:8000/docs

### Without Docker

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
digby/
├── backend/          # FastAPI app
│   └── app/
│       ├── api/      # Route handlers
│       ├── core/     # Config, DB, security
│       └── models/   # Beanie document models
├── frontend/         # Next.js 15 app
│   └── app/
│       ├── (auth)/   # Login/register
│       ├── sites/    # Discovery + booking
│       └── dashboard/# Operator portal
└── .github/workflows/
```

## Deployment

Both services deploy independently to Railway. See `backend/railway.toml` and `frontend/railway.toml`.
