# GYM TRACKER

## Development environment

- Clone the repository
- Install dependencies: `npm install`
- Create a `.env` from `.env.template` and set the environment variables
- Start the local database: `docker-compose up -d`, be sure to have **Docker Desktop** running
- Run the migrations: `npm run db:migrate`
- Seed the database: `npm run db:seed`
- Start the development server: `npm run dev`

## Run migrations
- Generate a new migration: `npm run db:migrate:generate`
- Run the migrations: `npm run db:migrate`

## Run migrations on production
- Install the global package: `npm install -g dotenv-cli`
- Run the migrations: `npm run db:migrate:prod`