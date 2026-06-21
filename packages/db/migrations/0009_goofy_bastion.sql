ALTER TABLE "mp_connections" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "mp_connections" CASCADE;--> statement-breakpoint
ALTER TABLE "import_images" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "import_images" ADD COLUMN "file_path" varchar(500);