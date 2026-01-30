# Local Development Setup

This guide explains how to set up and run the project locally with Supabase.

## Prerequisites

- Node.js (v18 or higher)
- Docker Desktop (for running Supabase locally)
- Supabase CLI (install with `npm install -g supabase`)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Supabase locally**
   ```bash
   supabase start
   ```
   
   This will:
   - Start all Supabase services in Docker containers
   - Apply all migrations from `supabase/migrations/`
   - Run seed data from `supabase/seed.sql`
   - Display local connection details

3. **Update environment variables**
   
   Create a `.env.local` file (or update `.env`) with the local Supabase credentials:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from supabase start output>
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Supabase Studio: http://127.0.0.1:54323
   - Mailpit (email testing): http://127.0.0.1:54324

## Supabase Local Services

When you run `supabase start`, the following services are available:

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://127.0.0.1:54321 | REST API endpoint |
| GraphQL | http://127.0.0.1:54321/graphql/v1 | GraphQL endpoint |
| Studio | http://127.0.0.1:54323 | Database management UI |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct database connection |
| Mailpit | http://127.0.0.1:54324 | Email testing interface |

## Migration Management

### Viewing Migration Status

```bash
# Check local migration status
supabase migration list --local

# Check remote migration status (requires linking)
supabase migration list
```

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new <migration_name>

# Example
supabase migration new add_user_preferences
```

### Applying Migrations

Migrations are automatically applied when you run `supabase start`. To manually apply:

```bash
# Reset local database and reapply all migrations
supabase db reset

# Push local migrations to remote (after testing locally)
supabase db push
```

## Seed Data

The `supabase/seed.sql` file contains sample data for local development:
- 2 test users (Aditi Rao, Ravi Iyer)
- 1 community (Bangalore Bikers)
- 1 event (Sunday Nandi Ride)
- Sample discussions and comments

This data is automatically loaded when you run `supabase start`.

## Common Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# View status
supabase status

# Reset database (WARNING: deletes all local data)
supabase db reset

# View logs
supabase logs

# Link to remote project
supabase link --project-ref <your-project-ref>
```

## Troubleshooting

### Port Conflicts

If you get port conflict errors, check if services are already running:
```bash
lsof -i :54321  # API
lsof -i :54322  # Database
lsof -i :54323  # Studio
```

### Migration Errors

If migrations fail:
1. Check the error message in the terminal
2. Fix the migration file
3. Run `supabase db reset` to start fresh
4. Migrations are applied in order, so ensure dependencies are correct

### Docker Issues

If Docker containers fail to start:
```bash
# Stop all Supabase containers
supabase stop --no-backup

# Remove all containers and volumes
docker system prune -a

# Start again
supabase start
```

## Switching Between Local and Remote

### For Local Development
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local anon key>
```

### For Remote/Production
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<remote anon key>
```

## Migration History Sync

The local and remote databases track migrations independently. If you need to sync:

```bash
# Mark migrations as applied on remote (without running them)
supabase migration repair <version> --status applied

# Example: Mark all as applied
supabase migration repair 20250805130146 20250806091345 ... --status applied
```

## Next Steps

- Review the [Testing Plan](./02-testing-plan) for running tests
- Check [Environment Variables](./02-env.md) for configuration details
- See [RLS Policies](./03-rls-policies.sql) for security setup

