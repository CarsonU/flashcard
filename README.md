# Flashcard

A self-hosted, minimalist flashcard app for university students. Designed as a calmer alternative to Anki — no daily debt, no streaks, just focused study sessions.

## Features

- **Deck management** — create and organize multiple decks
- **Card creation** — text and optional image URL on each side
- **Binary review** — mark cards as *Still Learning* or *Got It* during a session
- **Flexible study sessions** — focus on cards still being learned, or turn on learned-card review to study the full deck
- **Keyboard-driven entry** — add many cards quickly without lifting your hands from the keyboard (`Tab` between fields, `Ctrl+Enter` to save, `Esc` to finish)
- **Minimalist UI** — clean, low-stress design

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose (included in Docker Desktop)

No other dependencies are required. Node, pnpm, and PostgreSQL all run inside containers.

## Setup

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd flashcard
```

**2. Build and start**

```bash
docker compose up --build -d
```

This builds the API and web containers, starts a PostgreSQL database, and runs all database migrations automatically.

**3. Open the app**

Navigate to [http://localhost:8080](http://localhost:8080).

## Updating

Pull the latest changes from GitHub, then rebuild:

```bash
git pull
docker compose up --build -d
```

- Database migrations run automatically when the API container starts.
- Your data is stored in a Docker volume (`postgres_data`) and is preserved across rebuilds.

## Stopping

```bash
# Stop containers, keep all data
docker compose down

# Stop containers and delete all data (irreversible)
docker compose down -v
```
