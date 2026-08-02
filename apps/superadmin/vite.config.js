import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || (process.env.NODE_ENV === "production" ? "/super-admin/" : "/"),
  server: { port: 5175 },
});
