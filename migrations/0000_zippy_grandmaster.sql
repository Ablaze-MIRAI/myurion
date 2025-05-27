CREATE TABLE "note_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"name" text,
	"icon_name" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"title" text,
	"content" text,
	"category_id" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"passkey_user_id" text,
	"name" text,
	"created_at" timestamp DEFAULT now(),
	"public_key" text,
	"user_id" text,
	"transports" text,
	"counter" integer DEFAULT 0,
	CONSTRAINT "passkeys_passkey_user_id_unique" UNIQUE("passkey_user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"quick_note_content" text,
	"quick_note_updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "note_categories" ADD CONSTRAINT "note_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_category_id_note_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."note_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "note_category_name_user_id_idx" ON "note_categories" USING btree ("name","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "title_category_id_idx" ON "notes" USING btree ("title","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "name_user_id_idx" ON "passkeys" USING btree ("name","user_id");