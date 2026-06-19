ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "bank" varchar(100);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "holder" varchar(100);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "expiry" varchar(10);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "gradient_to" varchar(7);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "accent" varchar(7);
