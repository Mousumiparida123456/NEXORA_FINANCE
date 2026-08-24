import express from "express";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config({ path: resolve(__dirname, "../.env"), override: true });

console.log("STEP 1: ENV LOADED");

const { pool } = require("./db");

console.log("STEP 2: DB LOADED");

const app = require("../api/index").default;

console.log("STEP 3: API LOADED");

const PORT = Number(process.env.PORT) || 9999;

console.log("STEP 4: STARTING SERVER ON PORT", PORT);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("NEXORA SERVER IS RUNNING");
  console.log(`http://localhost:${PORT}`);
  console.log("=================================");
});

server.on("error", (error: any) => {
  console.error("SERVER ERROR:", error);
});

server.on("close", () => {
  console.log("SERVER CLOSED");
});

console.log("STEP 5: app.listen() CALLED");

export default app;
