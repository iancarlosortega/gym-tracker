CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"bar_grams" bigint,
	"stack_positions" smallint,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_barbell_has_bar" CHECK ("equipment"."kind" <> 'BARBELL' OR "equipment"."bar_grams" IS NOT NULL),
	CONSTRAINT "equipment_stack_has_positions" CHECK ("equipment"."kind" <> 'STACK' OR "equipment"."stack_positions" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"default_mode" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logged_set" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"raw_value" integer NOT NULL,
	"raw_unit" text,
	"resolved_grams" bigint,
	"stack_position" smallint,
	"snapshot_bar_grams" bigint,
	"snapshot_display_unit" text NOT NULL,
	"reps" smallint NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"synced_at" timestamp with time zone,
	CONSTRAINT "logged_set_mass_xor_position" CHECK (("logged_set"."resolved_grams" IS NOT NULL AND "logged_set"."stack_position" IS NULL)
          OR ("logged_set"."resolved_grams" IS NULL AND "logged_set"."stack_position" IS NOT NULL)),
	CONSTRAINT "logged_set_ordinal_has_no_bar" CHECK ("logged_set"."mode" <> 'STACK_POSITION' OR "logged_set"."snapshot_bar_grams" IS NULL),
	CONSTRAINT "logged_set_per_side_has_bar" CHECK ("logged_set"."mode" <> 'PER_SIDE' OR "logged_set"."snapshot_bar_grams" IS NOT NULL),
	CONSTRAINT "logged_set_reps_positive" CHECK ("logged_set"."reps" >= 1),
	CONSTRAINT "logged_set_revision_non_negative" CHECK ("logged_set"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"invalidated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "scheduled_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"set_id" uuid NOT NULL,
	"fire_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recompute_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"preview_token" text NOT NULL,
	"affected_sets" integer NOT NULL,
	"changes" jsonb NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"equipment_id" uuid,
	"position" smallint NOT NULL,
	"target_sets" smallint,
	"target_reps_min" smallint,
	"target_reps_max" smallint,
	"rest_seconds" integer DEFAULT 180 NOT NULL,
	CONSTRAINT "routine_exercise_rest_positive" CHECK ("routine_exercise"."rest_seconds" > 0),
	CONSTRAINT "routine_exercise_rep_range_ordered" CHECK ("routine_exercise"."target_reps_min" IS NULL OR "routine_exercise"."target_reps_max" IS NULL OR "routine_exercise"."target_reps_min" <= "routine_exercise"."target_reps_max")
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_unit" text DEFAULT 'KG' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logged_set" ADD CONSTRAINT "logged_set_session_id_workout_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logged_set" ADD CONSTRAINT "logged_set_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logged_set" ADD CONSTRAINT "logged_set_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_push" ADD CONSTRAINT "scheduled_push_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recompute_audit" ADD CONSTRAINT "recompute_audit_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_user_id_app_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logged_set_exercise_logged_at_idx" ON "logged_set" USING btree ("exercise_id","logged_at");--> statement-breakpoint
CREATE INDEX "logged_set_session_idx" ON "logged_set" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "push_subscription_user_idx" ON "push_subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_push_due_idx" ON "scheduled_push" USING btree ("fire_at");--> statement-breakpoint
CREATE INDEX "auth_session_user_idx" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_session_user_started_idx" ON "workout_session" USING btree ("user_id","started_at");