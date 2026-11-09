import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "search_text" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_search_text" varchar;
  ALTER TABLE "reviews" ADD COLUMN "search_text" varchar;
  ALTER TABLE "_reviews_v" ADD COLUMN "version_search_text" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "search_text";
  ALTER TABLE "_posts_v" DROP COLUMN "version_search_text";
  ALTER TABLE "reviews" DROP COLUMN "search_text";
  ALTER TABLE "_reviews_v" DROP COLUMN "version_search_text";`)
}
