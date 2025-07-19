import { integer, json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { user } from "./auth";

export type Note = {
  id: number;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

export const canvas = pgTable("canvas", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  description: text(),
  width: integer().notNull().default(3000),
  height: integer().notNull().default(3000),
  notes: json().$type<Note[]>().notNull().default([]),
  createdAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  userId: uuid().notNull(),
});

export const canvasRelations = relations(canvas, ({ one }) => ({
  user: one(user, {
    fields: [canvas.userId],
    references: [user.id],
  }),
}));
