import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_kind" AS ENUM('noticia', 'artigo', 'coluna', 'caixa-indie', 'podcast');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_kind" AS ENUM('noticia', 'artigo', 'coluna', 'caixa-indie', 'podcast');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_reviews_copy" AS ENUM('provided', 'bought', 'gamepass');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__reviews_v_version_copy" AS ENUM('provided', 'bought', 'gamepass');
  CREATE TYPE "public"."enum__reviews_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_games_platforms" AS ENUM('Xbox Series X|S', 'Xbox One', 'PC', 'PlayStation 5', 'Nintendo Switch', 'Mobile');
  CREATE TYPE "public"."enum_media_origin" AS ENUM('own', 'press', 'source', 'legacy');
  CREATE TYPE "public"."enum_candidates_status" AS ENUM('pending', 'approved', 'scheduled', 'published', 'discarded');
  CREATE TYPE "public"."enum_sources_kind" AS ENUM('rss', 'youtube');
  CREATE TYPE "public"."enum_sources_language" AS ENUM('en', 'pt');
  CREATE TYPE "public"."enum_sources_trust" AS ENUM('official', 'trusted', 'rumor');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor', 'author');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TABLE "posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"kind" "enum_posts_kind" DEFAULT 'noticia',
  	"excerpt" varchar,
  	"hero_image_id" integer,
  	"content" jsonb,
  	"legacy_html" varchar,
  	"category_id" integer,
  	"game_id" integer,
  	"author_id" integer,
  	"author_name" varchar,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"source_name" varchar,
  	"source_url" varchar,
  	"source_comment" varchar,
  	"source_rumor" boolean DEFAULT false,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_posts_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_kind" "enum__posts_v_version_kind" DEFAULT 'noticia',
  	"version_excerpt" varchar,
  	"version_hero_image_id" integer,
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_category_id" integer,
  	"version_game_id" integer,
  	"version_author_id" integer,
  	"version_author_name" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_source_name" varchar,
  	"version_source_url" varchar,
  	"version_source_comment" varchar,
  	"version_source_rumor" boolean DEFAULT false,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "reviews_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "reviews_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"game_id" integer,
  	"dek" varchar,
  	"hero_image_id" integer,
  	"score" numeric,
  	"subscores_gameplay" numeric,
  	"subscores_visual" numeric,
  	"subscores_sound" numeric,
  	"subscores_performance" numeric,
  	"platform_tested" varchar,
  	"play_time" varchar,
  	"copy" "enum_reviews_copy" DEFAULT 'provided',
  	"content" jsonb,
  	"legacy_html" varchar,
  	"author_id" integer,
  	"author_name" varchar,
  	"published_at" timestamp(3) with time zone,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"wp_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_reviews_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_reviews_v_version_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_reviews_v_version_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_reviews_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_game_id" integer,
  	"version_dek" varchar,
  	"version_hero_image_id" integer,
  	"version_score" numeric,
  	"version_subscores_gameplay" numeric,
  	"version_subscores_visual" numeric,
  	"version_subscores_sound" numeric,
  	"version_subscores_performance" numeric,
  	"version_platform_tested" varchar,
  	"version_play_time" varchar,
  	"version_copy" "enum__reviews_v_version_copy" DEFAULT 'provided',
  	"version_content" jsonb,
  	"version_legacy_html" varchar,
  	"version_author_id" integer,
  	"version_author_name" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_wp_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__reviews_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "games_platforms" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_games_platforms",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "games" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"developer" varchar,
  	"publisher" varchar,
  	"release_date" timestamp(3) with time zone,
  	"game_pass" boolean DEFAULT false,
  	"game_pass_entry" timestamp(3) with time zone,
  	"game_pass_exit" timestamp(3) with time zone,
  	"cover_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"color" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar,
  	"origin" "enum_media_origin" DEFAULT 'own',
  	"source_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "candidates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_candidates_status" DEFAULT 'pending' NOT NULL,
  	"scheduled_for" timestamp(3) with time zone,
  	"title" varchar NOT NULL,
  	"summary" varchar,
  	"comment" varchar,
  	"original_title" varchar,
  	"source_name" varchar,
  	"source_id" integer,
  	"url" varchar NOT NULL,
  	"guid" varchar NOT NULL,
  	"image_url" varchar,
  	"relevance" numeric,
  	"is_rumor" boolean DEFAULT false,
  	"needs_rewrite" boolean DEFAULT false,
  	"category_id" integer,
  	"duplicates" numeric DEFAULT 0,
  	"auto_discarded" boolean DEFAULT false,
  	"discard_reason" varchar,
  	"post_id" integer,
  	"fetched_at" timestamp(3) with time zone,
  	"source_published_at" timestamp(3) with time zone,
  	"telegram_notified" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "enum_sources_kind" DEFAULT 'rss',
  	"url" varchar NOT NULL,
  	"language" "enum_sources_language" DEFAULT 'en',
  	"trust" "enum_sources_trust" DEFAULT 'trusted',
  	"active" boolean DEFAULT true,
  	"only_xbox_feed" boolean DEFAULT false,
  	"last_checked_at" timestamp(3) with time zone,
  	"last_error" varchar,
  	"failures" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'author' NOT NULL,
  	"bio" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"reviews_id" integer,
  	"games_id" integer,
  	"categories_id" integer,
  	"media_id" integer,
  	"candidates_id" integer,
  	"sources_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_version_tags" ADD CONSTRAINT "_posts_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_game_id_games_id_fk" FOREIGN KEY ("version_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews_pros" ADD CONSTRAINT "reviews_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews_cons" ADD CONSTRAINT "reviews_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v_version_pros" ADD CONSTRAINT "_reviews_v_version_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reviews_v_version_cons" ADD CONSTRAINT "_reviews_v_version_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_parent_id_reviews_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_game_id_games_id_fk" FOREIGN KEY ("version_game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reviews_v" ADD CONSTRAINT "_reviews_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "games_platforms" ADD CONSTRAINT "games_platforms_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "games" ADD CONSTRAINT "games_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_candidates_fk" FOREIGN KEY ("candidates_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sources_fk" FOREIGN KEY ("sources_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_tags_order_idx" ON "posts_tags" USING btree ("_order");
  CREATE INDEX "posts_tags_parent_id_idx" ON "posts_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_kind_idx" ON "posts" USING btree ("kind");
  CREATE INDEX "posts_hero_image_idx" ON "posts" USING btree ("hero_image_id");
  CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");
  CREATE INDEX "posts_game_idx" ON "posts" USING btree ("game_id");
  CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX "posts_wp_id_idx" ON "posts" USING btree ("wp_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_version_tags_order_idx" ON "_posts_v_version_tags" USING btree ("_order");
  CREATE INDEX "_posts_v_version_tags_parent_id_idx" ON "_posts_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_kind_idx" ON "_posts_v" USING btree ("version_kind");
  CREATE INDEX "_posts_v_version_version_hero_image_idx" ON "_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_posts_v_version_version_category_idx" ON "_posts_v" USING btree ("version_category_id");
  CREATE INDEX "_posts_v_version_version_game_idx" ON "_posts_v" USING btree ("version_game_id");
  CREATE INDEX "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX "_posts_v_version_version_wp_id_idx" ON "_posts_v" USING btree ("version_wp_id");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  CREATE INDEX "reviews_pros_order_idx" ON "reviews_pros" USING btree ("_order");
  CREATE INDEX "reviews_pros_parent_id_idx" ON "reviews_pros" USING btree ("_parent_id");
  CREATE INDEX "reviews_cons_order_idx" ON "reviews_cons" USING btree ("_order");
  CREATE INDEX "reviews_cons_parent_id_idx" ON "reviews_cons" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "reviews_slug_idx" ON "reviews" USING btree ("slug");
  CREATE INDEX "reviews_game_idx" ON "reviews" USING btree ("game_id");
  CREATE INDEX "reviews_hero_image_idx" ON "reviews" USING btree ("hero_image_id");
  CREATE INDEX "reviews_author_idx" ON "reviews" USING btree ("author_id");
  CREATE INDEX "reviews_wp_id_idx" ON "reviews" USING btree ("wp_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "reviews__status_idx" ON "reviews" USING btree ("_status");
  CREATE INDEX "_reviews_v_version_pros_order_idx" ON "_reviews_v_version_pros" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_pros_parent_id_idx" ON "_reviews_v_version_pros" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_version_cons_order_idx" ON "_reviews_v_version_cons" USING btree ("_order");
  CREATE INDEX "_reviews_v_version_cons_parent_id_idx" ON "_reviews_v_version_cons" USING btree ("_parent_id");
  CREATE INDEX "_reviews_v_parent_idx" ON "_reviews_v" USING btree ("parent_id");
  CREATE INDEX "_reviews_v_version_version_slug_idx" ON "_reviews_v" USING btree ("version_slug");
  CREATE INDEX "_reviews_v_version_version_game_idx" ON "_reviews_v" USING btree ("version_game_id");
  CREATE INDEX "_reviews_v_version_version_hero_image_idx" ON "_reviews_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_reviews_v_version_version_author_idx" ON "_reviews_v" USING btree ("version_author_id");
  CREATE INDEX "_reviews_v_version_version_wp_id_idx" ON "_reviews_v" USING btree ("version_wp_id");
  CREATE INDEX "_reviews_v_version_version_updated_at_idx" ON "_reviews_v" USING btree ("version_updated_at");
  CREATE INDEX "_reviews_v_version_version_created_at_idx" ON "_reviews_v" USING btree ("version_created_at");
  CREATE INDEX "_reviews_v_version_version__status_idx" ON "_reviews_v" USING btree ("version__status");
  CREATE INDEX "_reviews_v_created_at_idx" ON "_reviews_v" USING btree ("created_at");
  CREATE INDEX "_reviews_v_updated_at_idx" ON "_reviews_v" USING btree ("updated_at");
  CREATE INDEX "_reviews_v_latest_idx" ON "_reviews_v" USING btree ("latest");
  CREATE INDEX "_reviews_v_autosave_idx" ON "_reviews_v" USING btree ("autosave");
  CREATE INDEX "games_platforms_order_idx" ON "games_platforms" USING btree ("order");
  CREATE INDEX "games_platforms_parent_idx" ON "games_platforms" USING btree ("parent_id");
  CREATE UNIQUE INDEX "games_slug_idx" ON "games" USING btree ("slug");
  CREATE INDEX "games_cover_idx" ON "games" USING btree ("cover_id");
  CREATE INDEX "games_updated_at_idx" ON "games" USING btree ("updated_at");
  CREATE INDEX "games_created_at_idx" ON "games" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "candidates_status_idx" ON "candidates" USING btree ("status");
  CREATE INDEX "candidates_source_idx" ON "candidates" USING btree ("source_id");
  CREATE UNIQUE INDEX "candidates_guid_idx" ON "candidates" USING btree ("guid");
  CREATE INDEX "candidates_relevance_idx" ON "candidates" USING btree ("relevance");
  CREATE INDEX "candidates_category_idx" ON "candidates" USING btree ("category_id");
  CREATE INDEX "candidates_post_idx" ON "candidates" USING btree ("post_id");
  CREATE INDEX "candidates_fetched_at_idx" ON "candidates" USING btree ("fetched_at");
  CREATE INDEX "candidates_updated_at_idx" ON "candidates" USING btree ("updated_at");
  CREATE INDEX "candidates_created_at_idx" ON "candidates" USING btree ("created_at");
  CREATE INDEX "sources_updated_at_idx" ON "sources" USING btree ("updated_at");
  CREATE INDEX "sources_created_at_idx" ON "sources" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_games_id_idx" ON "payload_locked_documents_rels" USING btree ("games_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_candidates_id_idx" ON "payload_locked_documents_rels" USING btree ("candidates_id");
  CREATE INDEX "payload_locked_documents_rels_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("sources_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "posts_tags" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v_version_tags" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "reviews_pros" CASCADE;
  DROP TABLE "reviews_cons" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "_reviews_v_version_pros" CASCADE;
  DROP TABLE "_reviews_v_version_cons" CASCADE;
  DROP TABLE "_reviews_v" CASCADE;
  DROP TABLE "games_platforms" CASCADE;
  DROP TABLE "games" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "candidates" CASCADE;
  DROP TABLE "sources" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_posts_kind";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_kind";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_reviews_copy";
  DROP TYPE "public"."enum_reviews_status";
  DROP TYPE "public"."enum__reviews_v_version_copy";
  DROP TYPE "public"."enum__reviews_v_version_status";
  DROP TYPE "public"."enum_games_platforms";
  DROP TYPE "public"."enum_media_origin";
  DROP TYPE "public"."enum_candidates_status";
  DROP TYPE "public"."enum_sources_kind";
  DROP TYPE "public"."enum_sources_language";
  DROP TYPE "public"."enum_sources_trust";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
