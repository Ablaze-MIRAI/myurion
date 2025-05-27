import { drizzle } from "drizzle-orm/pglite";

import { users, passkeys, noteCategories, notes } from "./schema.ts";

// データベースをファイルシステムに保存
const db = drizzle("../data");

export { db, users, passkeys, noteCategories, notes }; 
