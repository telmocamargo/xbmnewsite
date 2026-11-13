import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_candidates_status" ADD VALUE 'awaiting_opinion' BEFORE 'approved';
  ALTER TYPE "public"."enum_candidates_status" ADD VALUE 'drafting' BEFORE 'approved';
  ALTER TYPE "public"."enum_candidates_status" ADD VALUE 'draft_ready' BEFORE 'approved';
  CREATE TABLE "candidates_draft_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ok" boolean,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "posts" ADD COLUMN "ai_assisted" boolean DEFAULT false;
  ALTER TABLE "_posts_v" ADD COLUMN "version_ai_assisted" boolean DEFAULT false;
  ALTER TABLE "candidates" ADD COLUMN "opinion" varchar;
  ALTER TABLE "candidates" ADD COLUMN "draft_title" varchar;
  ALTER TABLE "candidates" ADD COLUMN "draft_body" varchar;
  ALTER TABLE "candidates" ADD COLUMN "draft_at" timestamp(3) with time zone;
  ALTER TABLE "candidates" ADD COLUMN "opinion_at" timestamp(3) with time zone;
  ALTER TABLE "candidates" ADD COLUMN "prompt_message_id" varchar;
  ALTER TABLE "candidates" ADD COLUMN "source_text" varchar;
  ALTER TABLE "candidates_draft_checks" ADD CONSTRAINT "candidates_draft_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "candidates_draft_checks_order_idx" ON "candidates_draft_checks" USING btree ("_order");
  CREATE INDEX "candidates_draft_checks_parent_id_idx" ON "candidates_draft_checks" USING btree ("_parent_id");
  CREATE INDEX "candidates_opinion_at_idx" ON "candidates" USING btree ("opinion_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "candidates_draft_checks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "candidates_draft_checks" CASCADE;
  ALTER TABLE "candidates" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "candidates" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
  DROP TYPE "public"."enum_candidates_status";
  CREATE TYPE "public"."enum_candidates_status" AS ENUM('pending', 'approved', 'scheduled', 'published', 'discarded');
  ALTER TABLE "candidates" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_candidates_status";
  ALTER TABLE "candidates" ALTER COLUMN "status" SET DATA TYPE "public"."enum_candidates_status" USING "status"::"public"."enum_candidates_status";
  DROP INDEX "candidates_opinion_at_idx";
  ALTER TABLE "posts" DROP COLUMN "ai_assisted";
  ALTER TABLE "_posts_v" DROP COLUMN "version_ai_assisted";
  ALTER TABLE "candidates" DROP COLUMN "opinion";
  ALTER TABLE "candidates" DROP COLUMN "draft_title";
  ALTER TABLE "candidates" DROP COLUMN "draft_body";
  ALTER TABLE "candidates" DROP COLUMN "draft_at";
  ALTER TABLE "candidates" DROP COLUMN "opinion_at";
  ALTER TABLE "candidates" DROP COLUMN "prompt_message_id";
  ALTER TABLE "candidates" DROP COLUMN "source_text";`)
}
