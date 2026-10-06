CREATE TYPE "public"."card_purpose" AS ENUM('google_review', 'instagram', 'facebook', 'tiktok', 'menu', 'business_card', 'website', 'custom');--> statement-breakpoint
CREATE TYPE "public"."destination_type" AS ENUM('none', 'url', 'tap_page', 'vcard');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('awaiting_payment', 'paid', 'in_production', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."profile_type" AS ENUM('business', 'personal');--> statement-breakpoint
CREATE TYPE "public"."tap_device" AS ENUM('ios', 'android', 'other');--> statement-breakpoint
CREATE TYPE "public"."tap_source" AS ENUM('nfc', 'qr');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"order_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"purpose" "card_purpose" NOT NULL,
	"destination_type" "destination_type" DEFAULT 'none' NOT NULL,
	"destination_url" text,
	"tap_page_id" uuid,
	"vcard" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"written_at" timestamp with time zone,
	"design" jsonb NOT NULL,
	"design_approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cards_code_unique" UNIQUE("code"),
	CONSTRAINT "cards_destination_target" CHECK (("cards"."destination_type" <> 'url' or "cards"."destination_url" is not null) and ("cards"."destination_type" <> 'tap_page' or "cards"."tap_page_id" is not null) and ("cards"."destination_type" <> 'vcard' or "cards"."vcard" is not null))
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"facebook" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"package_key" text NOT NULL,
	"card_count" integer NOT NULL,
	"price_php" integer NOT NULL,
	"regular_price_php" integer,
	"status" "order_status" DEFAULT 'awaiting_payment' NOT NULL,
	"paid_at" timestamp with time zone,
	"notes" text,
	"design" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tap_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"profile_type" "profile_type" DEFAULT 'business' NOT NULL,
	"color" text NOT NULL,
	"cover_url" text,
	"avatar_url" text,
	"show_cover" boolean DEFAULT true NOT NULL,
	"show_avatar" boolean DEFAULT true NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tap_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "taps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"tapped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "tap_source" NOT NULL,
	"device" "tap_device" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_tap_page_id_tap_pages_id_fk" FOREIGN KEY ("tap_page_id") REFERENCES "public"."tap_pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_pages" ADD CONSTRAINT "tap_pages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taps" ADD CONSTRAINT "taps_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cards_order_idx" ON "cards" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "tap_pages_customer_idx" ON "tap_pages" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "taps_card_time_idx" ON "taps" USING btree ("card_id","tapped_at");