import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import financialYearRoutes from "./routes/financialYearRoutes";
import eventRoutes from "./routes/eventRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import incomeRoutes from "./routes/incomeRoutes";
import path from "path";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");

  res.json({
    message: "Cultural Expense API Running",
    dbTime: result.rows[0],
  });
});

const PORT = process.env.PORT || 3000;

app.use("/financial-years", financialYearRoutes);

app.use("/events", eventRoutes);

app.use("/expenses", expenseRoutes);

app.use("/income", incomeRoutes);

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