# Deploying to Render with Neon Postgres

This repository deploys the React app and Express API as one Render web
service. Neon hosts the PostgreSQL database. The application uses the standard
`DATABASE_URL` environment variable, so it needs no code changes for Neon.

## One-time setup

1. Create a free project in [Neon](https://neon.com). Select a region close to
   your Render service (Frankfurt is a good choice for this Blueprint).
2. In the Neon project dashboard, click **Connect** and copy the **pooled**
   PostgreSQL connection string. It begins with `postgresql://` and includes
   all required SSL settings. Keep this value secret.
3. Commit and push this repository, including `render.yaml`, to GitHub.
4. In Render, choose **New** > **Blueprint**, connect the repository, and
   select the branch to deploy. Render detects `render.yaml` and prompts for
   `DATABASE_URL`; paste the Neon pooled connection string.
5. Apply the Blueprint and wait for the build to finish. Its build command runs
   `drizzle-kit push`, which creates the `decks` and `cards` tables in Neon.
6. Open the service's `onrender.com` URL. Verify the API at
   `https://YOUR-SERVICE.onrender.com/api/healthz`.

## If the Render service already exists

1. Push the updated `render.yaml`, then sync the Blueprint in Render.
2. Open the web service in Render and select **Environment**.
3. Add or replace `DATABASE_URL` with the Neon pooled connection string.
4. Choose **Save, rebuild, and deploy**. A `sync: false` variable is prompted
   for only when a Blueprint is first created, so existing services must be
   updated in the dashboard.
5. Confirm the deploy and application work before removing any old database.

## Important notes

- Never add the Neon connection string to `render.yaml`, Git, or a browser
  build variable. It belongs only in Render's secret environment variables.
- This Blueprint no longer creates a Render database. If an old
  Blueprint-managed Render database already exists, removing it from
  `render.yaml` does not delete it. Delete it manually in Render only after
  you have verified that Neon contains your data.
- Neon Free currently provides 1 GB of PostgreSQL storage and monthly compute
  limits. Monitor its dashboard; free-plan allowances can change.
- Render's Free web service can still sleep after 15 minutes of inactivity.
