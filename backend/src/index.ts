import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import financialYearRoutes from "./routes/financialYearRoutes";
import eventRoutes from "./routes/eventRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import incomeRoutes from "./routes/incomeRoutes";
import mealOrderRoutes from "./routes/mealOrderRoutes";
import authRoutes from "./routes/authRoutes";
import { requireAuthentication } from "./middleware/authentication";
import path from "path";

dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "5mb" }));

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");

  res.json({
    message: "Cultural Expense API Running",
    dbTime: result.rows[0],
  });
});

const PORT = process.env.PORT || 3000;

app.use("/auth", authRoutes);
app.use(requireAuthentication);

app.use("/financial-years", financialYearRoutes);

app.use("/events", eventRoutes);

app.use("/expenses", expenseRoutes);

app.use("/income", incomeRoutes);

app.use("/meal-orders", mealOrderRoutes);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});