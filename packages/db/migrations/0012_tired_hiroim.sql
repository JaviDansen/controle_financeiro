ALTER TABLE "import_extracted_transactions" DROP CONSTRAINT "import_extracted_transactions_transaction_id_transactions_id_fk";
--> statement-breakpoint
ALTER TABLE "import_extracted_transactions" ADD CONSTRAINT "import_extracted_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;