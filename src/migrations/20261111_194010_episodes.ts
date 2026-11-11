import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_episodes_kind" AS ENUM('podcast', 'video');
  CREATE TABLE "episodes_legacy_slugs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "episodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"youtube_id" varchar NOT NULL,
  	"kind" "enum_episodes_kind" DEFAULT 'podcast' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"episode_number" numeric,
  	"published_at" timestamp(3) with time zone,
  	"duration" numeric,
  	"cover_id" integer,
  	"description" varchar,
  	"spotify_url" varchar,
  	"search_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "episodes_id" integer;
  ALTER TABLE "episodes_legacy_slugs" ADD CONSTRAINT "episodes_legacy_slugs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "episodes" ADD CONSTRAINT "episodes_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "episodes_legacy_slugs_order_idx" ON "episodes_legacy_slugs" USING btree ("_order");
  CREATE INDEX "episodes_legacy_slugs_parent_id_idx" ON "episodes_legacy_slugs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "episodes_slug_idx" ON "episodes" USING btree ("slug");
  CREATE UNIQUE INDEX "episodes_youtube_id_idx" ON "episodes" USING btree ("youtube_id");
  CREATE INDEX "episodes_kind_idx" ON "episodes" USING btree ("kind");
  CREATE INDEX "episodes_published_at_idx" ON "episodes" USING btree ("published_at");
  CREATE INDEX "episodes_cover_idx" ON "episodes" USING btree ("cover_id");
  CREATE INDEX "episodes_updated_at_idx" ON "episodes" USING btree ("updated_at");
  CREATE INDEX "episodes_created_at_idx" ON "episodes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_episodes_fk" FOREIGN KEY ("episodes_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_episodes_id_idx" ON "payload_locked_documents_rels" USING btree ("episodes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "episodes_legacy_slugs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "episodes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "episodes_legacy_slugs" CASCADE;
  DROP TABLE "episodes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_episodes_fk";
  
  DROP INDEX "payload_locked_documents_rels_episodes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "episodes_id";
  DROP TYPE "public"."enum_episodes_kind";`)
}
