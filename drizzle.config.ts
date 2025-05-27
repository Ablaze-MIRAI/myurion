import { defineConfig } from "drizzle-kit";

export default defineConfig ({
    dialect: "postgresql",
    //@ts-ignore
    driver: "pglite",
    schema: "./edge/db/schema.ts",
    out: "./migrations",
    dbCredentials: {
    //@ts-ignore
        url: "./data",
    },
});