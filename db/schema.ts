import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { PlanDay, Profile, Targets } from "../app/planner";

export const healthProfiles = pgTable("health_profiles", {
  userId: uuid("user_id").primaryKey(),
  profile: jsonb("profile").$type<Profile>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  seed: integer("seed").default(0).notNull(),
  status: varchar("status", { length: 16 }).default("draft").notNull(),
  profileSnapshot: jsonb("profile_snapshot").$type<Profile>().notNull(),
  targetsSnapshot: jsonb("targets_snapshot").$type<Targets>().notNull(),
  planSnapshot: jsonb("plan_snapshot").$type<PlanDay[]>().notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("meal_plans_user_updated_idx").on(table.userId, table.updatedAt)]);

export const savedMeals = pgTable("saved_meals", {
  userId: uuid("user_id").notNull(),
  mealKey: text("meal_key").notNull(),
  mealName: text("meal_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.mealKey] })]);

export const groceryItemStates = pgTable("grocery_item_states", {
  planId: uuid("plan_id").notNull().references(() => mealPlans.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  itemKey: text("item_key").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.planId, table.itemKey] }),
  index("grocery_item_states_user_idx").on(table.userId),
]);
