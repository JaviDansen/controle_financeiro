CREATE TABLE "import_extracted_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" varchar(300),
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(10) NOT NULL,
	"date" date NOT NULL,
	"time" varchar(10),
	"payment_method" varchar(100),
	"date_inferred" boolean DEFAULT false NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"category_id" uuid,
	"transaction_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_images" ADD COLUMN "tokens_prompt" integer;--> statement-breakpoint
ALTER TABLE "import_images" ADD COLUMN "tokens_output" integer;--> statement-breakpoint
ALTER TABLE "import_images" ADD COLUMN "tokens_total" integer;--> statement-breakpoint
ALTER TABLE "import_images" ADD COLUMN "cost_brl" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "import_extracted_transactions" ADD CONSTRAINT "import_extracted_transactions_image_id_import_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."import_images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_extracted_transactions" ADD CONSTRAINT "import_extracted_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_extracted_transactions" ADD CONSTRAINT "import_extracted_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_extracted_transactions" ADD CONSTRAINT "import_extracted_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;