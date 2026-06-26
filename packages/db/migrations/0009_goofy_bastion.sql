ALTER TABLE "import_images" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "import_images" ADD COLUMN "file_path" varchar(500);