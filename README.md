# JumpApp Challenge

A meeting automation platform built with modern web technologies.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Bun** (Package manager and runtime) - [Installation guide](https://bun.sh/docs/installation)
- **Docker** (For running the database) - [Installation guide](https://docs.docker.com/get-docker/)
- **Node.js** (Required for some dependencies) - [Installation guide](https://nodejs.org/)
- **Git** (Version control)

## Project Structure

This is a monorepo containing:

- `apps/backend/` - Elysia.js API server with Prisma ORM
- `apps/web/` - React frontend with Vite and TanStack Router
- `package.json` - Root monorepo configuration

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd jumpapp-challenge
```

### 2. Install root dependencies

```bash
bun install
```

### 3. Install backend dependencies

```bash
cd apps/backend
bun install
cd ..
```

### 4. Install web dependencies

```bash
cd apps/web
bun install
cd ..
```

## Development Setup

### 1. Configure Environment Variables

Before starting the development servers, you need to set up the environment variables:

```bash
# Backend environment
cd apps/backend
cp env.example .env.development.local
# Edit .env.development.local with your API keys

# Frontend environment
cd ../web
cp env.example .env.local
# Frontend is mostly pre-configured for development
```

### 2. Start the database and backend services

From the web directory, run:

```bash
cd apps/web
bun run deps:up
```

This command will:
- Generate Prisma client
- Start Docker containers (PostgreSQL database)
- Push database schema
- Seed the database with initial data
- Start the backend development server

### 3. Start the frontend development server

Open a new terminal and run:

```bash
cd apps/web
bun run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

## Available Scripts

### Root Level Scripts

- `bun run check` - Run Biome linter on all apps
- `bun run check:fix` - Auto-fix linting issues
- `bun run clean` - Remove all node_modules directories
- `bun run lint` - Lint all apps
- `bun run lint:backend` - Lint backend only
- `bun run lint:web` - Lint web only

### Backend Scripts (from `apps/backend/`)

- `bun run dev` - Start backend development server
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema to database (with force reset)
- `bun run db:seed` - Seed database with initial data
- `bun run deps:up` - Setup database and start backend
- `bun run compose:up` - Start Docker containers
- `bun run prisma:dev` - Open Prisma Studio

### Web Scripts (from `apps/web/`)

- `bun run dev` - Start frontend development server
- `bun run build` - Build for production
- `bun run serve` - Preview production build
- `bun run typecheck` - Run TypeScript type checking
- `bun run deps:up` - Setup backend and start it (then start web dev server)

## Environment Variables

The project uses environment variables for configuration. You need to create the required `.env` files based on the provided examples:

### Backend Environment Setup

1. Copy the environment template:
   ```bash
   cd apps/backend
   cp env.example .env.development.local
   ```

2. Fill in the required values in `.env.development.local`:
   - **Google OAuth**: Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - **AI Services**: Get API keys from respective providers
   - **Database**: Already configured for local Docker setup

### Frontend Environment Setup

1. Copy the environment template:
   ```bash
   cd apps/web
   cp env.example .env.local
   ```

2. The frontend environment is mostly pre-configured for development

### Required Environment Files

- `apps/backend/.env.development.local` - Backend configuration (see `apps/backend/env.example`)
- `apps/web/.env.local` - Frontend configuration (see `apps/web/env.example`)

**Note**: Never commit actual `.env` files to version control. The example files (`env.example`) are safe to commit.

## Database

The project uses PostgreSQL with Prisma ORM. The database runs in Docker containers managed by the `docker-compose.yaml` file in `apps/backend/dev-ops/`.

## Development Workflow

1. Make sure Docker is running
2. Run `cd apps/web && bun run deps:up` to start backend and database
3. In another terminal, run `cd apps/web && bun run dev` to start frontend
4. Access the application at the provided URL (usually `http://localhost:5173`)

## Tech Stack

### Backend
- **Elysia.js** - Fast web framework for Bun
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Better Auth** - Authentication
- **AI SDK** - AI integration (Anthropic, Google, OpenAI)

### Frontend
- **React 19** - UI framework
- **TanStack Router** - Client-side routing
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Development Tools
- **Bun** - Package manager and runtime
- **Biome** - Linter and formatter
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Docker** - Containerization

## Contributing

1. Follow the existing code style
2. Run `bun run check` before committing
3. Write tests for new features
4. Update documentation as needed

## License

This project is part of a development challenge.
