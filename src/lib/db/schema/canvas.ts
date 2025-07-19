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

export type SpeechLog = {
  id: string;
  text: string;
  timestamp: Date;
  canvasId: string;
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

export const speechLog = pgTable("speech_log", {
  id: uuid().primaryKey().defaultRandom(),
  text: text().notNull(),
  timestamp: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  canvasId: uuid().notNull(),
  userId: uuid().notNull(),
});

export const canvasRelations = relations(canvas, ({ one, many }) => ({
  user: one(user, {
    fields: [canvas.userId],
    references: [user.id],
  }),
  speechLogs: many(speechLog),
}));

export const speechLogRelations = relations(speechLog, ({ one }) => ({
  canvas: one(canvas, {
    fields: [speechLog.canvasId],
    references: [canvas.id],
  }),
  user: one(user, {
    fields: [speechLog.userId],
    references: [user.id],
  }),
}));
