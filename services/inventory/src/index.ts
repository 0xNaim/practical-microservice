import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import {
	createInventory,
	getInventoryById,
	getInventoryDetails,
	updateInventory,
} from "./controllers";
import { corsMiddleware } from "./middlewares/corsMiddleware";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "Service UP" });
});

// Apply CORS middleware to all routes
app.use(corsMiddleware);

// Routes
app.get("/inventories/:id/details", getInventoryDetails);
app.get("/inventories/:id", getInventoryById);
app.put("/inventories/:id", updateInventory);
app.post("/inventories", createInventory);

// 404 handler
app.use((_req, res) => {
	res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT || 4002;
const serviceName = process.env.SERVICE_NAME || "Inventory-Service";

app.listen(port, () => {
	console.log(`${serviceName} is running on port ${port}`);
});
