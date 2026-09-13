import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const mentorRecords = sqliteTable("mentor_records", {
  owner: text("owner").primaryKey(),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(1),
});
