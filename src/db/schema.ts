import { pgTable, timestamp, varchar, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 256 }).unique().notNull(),
  ...timestamps,
});

export const chirps = pgTable("chirps", {
  id: uuid("id").primaryKey().defaultRandom(),
  body: varchar({ length: 140 }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

export type NewUser = typeof users.$inferInsert;
export type NewChirp = typeof chirps.$inferInsert;
