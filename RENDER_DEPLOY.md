# Deploying to Render

This repository includes `render.yaml`, which creates one Node web service and
one managed Render PostgreSQL database in Frankfurt. The web service serves both
the React app and its `/api` routes, so no public API URL or CORS configuration
is required.

## Deploy

1. Commit and push this project to GitHub.
2. In [Render](https://dashboard.render.com/), select **New** > **Blueprint**,
   connect the repository, and select the branch to deploy.
3. Render detects `render.yaml`. Review the proposed `tricky-flashcards` web
   service and `tricky-flashcards-db` PostgreSQL database, then click **Apply**.
4. Wait for the database and first deploy to finish. Render passes its private
   database connection string to the service as `DATABASE_URL` and runs
   `drizzle-kit push` at the end of the build, before the service starts,
   creating the `decks` and `cards` tables. This works with the Free plan,
   which does not support a pre-deploy command.
5. Open the service's `onrender.com` URL. You can confirm the API is healthy at
   `https://YOUR-SERVICE.onrender.com/api/healthz`.

Render automatically redeploys the selected branch after future pushes.

## Important notes

- The Blueprint requests Render's `free` plans. If that plan is unavailable for
  your account or region, select an available plan in Render and keep the web
  service and database in the same region.
- `DATABASE_URL` is provisioned by Render; do not paste a database password into
  the repository or Render YAML.
- For local database work, copy `.env.example` to `.env`, provide your local
  connection string, then run `pnpm --filter @workspace/db push`.
