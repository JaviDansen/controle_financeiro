ALTER TABLE "import_sessions" ALTER COLUMN "image_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD COLUMN "session_token" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD COLUMN "ignore_keywords" varchar(500) DEFAULT 'reserva, guardar ao gastar';