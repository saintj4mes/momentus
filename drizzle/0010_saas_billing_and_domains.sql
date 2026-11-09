-- Migration 0010: SaaS Subscription Plans, Commercial Billing, Hardware Orders, and Multi-Tenant Domains

CREATE TABLE IF NOT EXISTS "subscription_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price_monthly" integer NOT NULL,
  "price_annual" integer NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "max_events" integer NOT NULL,
  "max_guests_per_event" integer NOT NULL,
  "features" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "organization_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "plan_id" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "billing_interval" text DEFAULT 'month' NOT NULL,
  "current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
  "current_period_end" timestamp with time zone NOT NULL,
  "cancel_at_period_end" boolean DEFAULT false NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "event_billing_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "plan_id" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "guest_allowance" integer NOT NULL,
  "payment_provider" text NOT NULL,
  "external_reference" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "hardware_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "event_id" uuid,
  "product_id" text NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" integer NOT NULL,
  "total_price" integer NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "shipping_address" jsonb NOT NULL,
  "status" text DEFAULT 'processing' NOT NULL,
  "tracking_number" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tenant_domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "event_id" uuid,
  "hostname" text NOT NULL UNIQUE,
  "subdomain" text,
  "status" text DEFAULT 'active' NOT NULL,
  "verified" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Constraints & Foreign Keys
ALTER TABLE "organization_subscriptions" 
  ADD CONSTRAINT "org_subs_org_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "event_billing_purchases" 
  ADD CONSTRAINT "event_billing_org_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "event_billing_purchases" 
  ADD CONSTRAINT "event_billing_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "hardware_orders" 
  ADD CONSTRAINT "hardware_orders_org_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "hardware_orders" 
  ADD CONSTRAINT "hardware_orders_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "tenant_domains" 
  ADD CONSTRAINT "tenant_domains_org_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "tenant_domains" 
  ADD CONSTRAINT "tenant_domains_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_billing_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Public Read for Subscription Plans
CREATE POLICY subscription_plans_public_read ON public.subscription_plans
  FOR SELECT TO authenticated, anon
  USING (true);
--> statement-breakpoint

-- Organization Scoped Read for Subscriptions & Orders
CREATE POLICY org_subscriptions_read ON public.organization_subscriptions
  FOR SELECT TO authenticated
  USING (private.can_manage_event(organization_id));
--> statement-breakpoint

CREATE POLICY hardware_orders_read ON public.hardware_orders
  FOR SELECT TO authenticated
  USING (private.can_manage_event(organization_id));
--> statement-breakpoint

CREATE POLICY tenant_domains_read ON public.tenant_domains
  FOR SELECT TO authenticated
  USING (private.can_manage_event(organization_id));
--> statement-breakpoint

-- Seed Standard MOMENTUS Commercial Plans
INSERT INTO "subscription_plans" ("id", "name", "description", "price_monthly", "price_annual", "currency", "max_events", "max_guests_per_event", "features")
VALUES
  ('starter', 'Single Event Starter', 'Perfect for intimate private dinners, milestone birthdays, and celebrations.', 149, 119, 'USD', 1, 100, '["1 Live Event Microsite", "100 Guest Quota", "Atomic QR Scanning", "Standard Guest List Export", "12-Month Post-Event Retrospective"]'),
  ('bespoke', 'Bespoke Celebration', 'Our signature experience for grand weddings, luxury debuts, and galas.', 349, 279, 'USD', 1, 350, '["Full Visual Studio Designer", "Up to 350 Guests", "Web NFC & Rapid QR Staff Scanning", "Seating Chart Concierge", "Dietary Course Tracking", "25 NFC Keepsake Cards Included"]'),
  ('grand', 'Grand Production', 'Built for festivals, high-throughput summits, and athletic marathons.', 799, 639, 'USD', 3, 2000, '["Up to 2,000 Guests per Event", "Turnstile Staff Scanner PWA", "Multi-Station PIN Dispatch", "Custom Domain Routing (*.yourbrand.events)", "VIP Lounge Scoped Passes", "100 NFC Wooden Keepsake Cards"]'),
  ('agency_pro', 'Agency & Event Planner', 'Complete operating system for event directors, luxury planners, and agencies.', 249, 199, 'USD', 15, 800, '["Up to 15 Active Concurrent Events", "White-Label Guest Microsites", "Multi-Client Tenant Workspaces", "Wholesale NFC Hardware Pricing", "Priority 24/7 Live Desk Support"]'),
  ('enterprise', 'Enterprise & Stadium', 'Dedicated infrastructure and SLAs for stadium festivals, arenas, and global tours.', 1499, 1199, 'USD', 9999, 50000, '["Unlimited Multi-Tenant Events", "Custom Turnstile Hardware Encoder Integration", "Dedicated Isolated Postgres Cluster", "On-Site MOMENTUS Flight Engineer", "99.99% Availability SLA"]')
ON CONFLICT ("id") DO NOTHING;

