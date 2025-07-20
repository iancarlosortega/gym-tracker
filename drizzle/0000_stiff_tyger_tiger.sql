CREATE TYPE "public"."account_type" AS ENUM('email', 'google');--> statement-breakpoint
CREATE TYPE "public"."roles" AS ENUM('USER', 'CUSTOMER', 'EMPLOYEE', 'ADMIN');--> statement-breakpoint
CREATE TABLE "users_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"accountType" "account_type" NOT NULL,
	"google_id" text,
	"password" text,
	"salt" text,
	CONSTRAINT "users_accounts_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "users_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"displayName" text,
	"imageId" text,
	"image" text,
	"phone" text,
	"identification_card" text,
	"ruc" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "users_profiles_identification_card_unique" UNIQUE("identification_card"),
	CONSTRAINT "users_profiles_ruc_unique" UNIQUE("ruc")
);
--> statement-breakpoint
CREATE TABLE "users_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"email_verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_new_user" boolean DEFAULT true NOT NULL,
	"role" "roles" DEFAULT 'USER' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users_accounts" ADD CONSTRAINT "users_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_profiles" ADD CONSTRAINT "users_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;