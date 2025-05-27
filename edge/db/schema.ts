import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { ulid } from "ulid";

export const users = pgTable(
    "users",
    {
        id: text("id").primaryKey().$defaultFn(() => ulid()),
        name: text("name"),
        quickNoteContent: text("quick_note_content"),
        quickNoteUpdatedAt: timestamp("quick_note_updated_at")
    }
);

export const userRelations = relations(users, ({ many }) => ({
    passkeys: many(passkeys),
    noteCategories: many(noteCategories),
    notes: many(notes)
}));

export const passkeys = pgTable(
    "passkeys",
    {
        id: text("id").primaryKey().$defaultFn(() => ulid()),
        passkeyUserId: text("passkey_user_id").unique(),
        name: text("name"),
        createdAt: timestamp("created_at").defaultNow(),
        publicKey: text("public_key"),
        userId: text("user_id").references(() => users.id),
        transports: text("transports"),
        counter: integer("counter").default(0)
    },
    (table) => [
        uniqueIndex("name_user_id_idx").on(table.name, table.userId)
    ]
);

export const passkeyRelations = relations(passkeys, ({ one }) => ({
    user: one(users, {
        fields: [passkeys.userId],
        references: [users.id]
    })
}));

export const noteCategories = pgTable(
    "note_categories",
    {
        id: text("id").primaryKey().$defaultFn(() => ulid()),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at"),
        name: text("name"),
        iconName: text("icon_name"),
        userId: text("user_id").references(() => users.id, { onDelete: "cascade" })
    },
    (table) => [
        uniqueIndex("note_category_name_user_id_idx").on(table.name, table.userId)
    ]
);

export const noteCategoryRelations = relations(noteCategories, ({ one, many }) => ({
    user: one(users, {
        fields: [noteCategories.userId],
        references: [users.id]
    }),
    notes: many(notes)
}));

export const notes = pgTable(
    "notes",
    {
        id: text("id").primaryKey().$defaultFn(() => ulid()),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at"),
        title: text("title"),
        content: text("content"),
        categoryId: text("category_id").references(() => noteCategories.id, { onDelete: "cascade" }),
        userId: text("user_id").references(() => users.id)
    },
    (table) => [
        uniqueIndex("title_category_id_idx").on(table.title, table.categoryId)
    ]
);

export const noteRelations = relations(notes, ({ one }) => ({
    category: one(noteCategories, {
        fields: [notes.categoryId],
        references: [noteCategories.id]
    }),
    user: one(users, {
        fields: [notes.userId],
        references: [users.id]
    })
}));
