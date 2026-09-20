# Deploying the gym tracker

One box, one Compose stack, two subdomains of a domain you own. The box is
shared with other applications, so every service declares a memory limit and
Postgres is a database and role rather than a server of its own.

## Once, on the box

1. Point both subdomains at the server's address:

   ```
   gym.example.com      A   <the server>
   api.gym.example.com  A   <the server>
   ```

   They must share a registrable domain. The API validates this at startup and
   refuses to run otherwise, because a cross-site session cookie would be
   dropped by the browser and nobody could stay signed in.

2. Copy the configuration and fill it in:

   ```sh
   cp .env.example .env
   ```

   `POSTGRES_PASSWORD` and the matching password in `DATABASE_URL` are the only
   two that must be set. For pocketed rest alerts, also generate a VAPID pair:

   ```sh
   npx web-push generate-vapid-keys
   ```

   Leave them empty and everything still runs; the application says pocketed
   alerts are unavailable and the foreground rest timer is unaffected.

3. Bring it up:

   ```sh
   docker compose up -d --build
   ```

   Migrations run as their own service before the API starts, so a failed
   migration stops the deployment rather than leaving a process serving a
   schema it does not have. Caddy issues the certificates itself — there is no
   certbot and no cron to maintain.

4. Create the single account, once:

   ```sh
   docker compose run --rm api node dist/commands/seed-account.command.js you@example.com 'a long passphrase'
   ```

   Registration is not a route. There is one account, and this is how it comes
   into existence.

## Afterwards

```sh
docker compose pull && docker compose up -d --build   # deploy a new build
docker compose logs -f api                            # watch the API
docker compose exec postgres pg_dump -U gymtracker gymtracker > backup.sql
```

Backup automation is deliberately not set up here — that was left to the
operator. The command above is the whole of it.

## What runs, and what it may use

| Service    | Memory | Why it is there |
|------------|--------|-----------------|
| `caddy`    | 128M   | TLS and routing for both subdomains |
| `postgres` | 768M   | This application's database and role |
| `migrate`  | 256M   | Runs once per deploy, then exits |
| `api`      | 512M   | Nest, including the one-second rest-alert tick |
| `web`      | 512M   | Next, serving the installed app |

The limits are the co-tenancy contract. An unbounded container on a shared box
is one that can starve everything beside it.
