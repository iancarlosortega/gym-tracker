-- The user's routine order. Routines that existed before it start in
-- alphabetical order per user, ties broken by id so the backfill is
-- deterministic; positions count from zero.
ALTER TABLE "routine" ADD COLUMN "position" integer;--> statement-breakpoint
UPDATE "routine" AS r SET "position" = o.rn - 1 FROM (SELECT "id", ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "name", "id") AS rn FROM "routine") AS o WHERE r."id" = o."id";--> statement-breakpoint
ALTER TABLE "routine" ALTER COLUMN "position" SET NOT NULL;
