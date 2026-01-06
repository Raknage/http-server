import { pgTable, timestamp, varchar, uuid, boolean } from "drizzle-orm/pg-core";

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
  hashedPassword: varchar("hashed_password").notNull().default("unset"),
  isChirpyRed: boolean("is_chirpy_red").default(false).notNull(),
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

export const refreshTokens = pgTable("refresh_tokens", {
  token: varchar().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  ...timestamps,
});

export type NewUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type NewChirp = typeof chirps.$inferInsert;
