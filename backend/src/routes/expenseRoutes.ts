import express from "express";
import { pool } from "../db";
import upload from "../upload";

const router = express.Router();

/**
 * Create Expense
 */
router.post("/", async (req, res) => {
  try {
    const {
      event_id,
      category,
      vendor,
      amount,
      expense_date,
      paid_by,
      payment_mode,
      notes,
      bill_image_path,
    } = req.body;

    if (!event_id) {
      return res.status(400).json({
        error: "Event is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        error: "Category is required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than zero",
      });
    }    

    const result = await pool.query(
      `
      INSERT INTO cultural.expenses
      (
        event_id,
        category,
        vendor,
        amount,
        expense_date,
        paid_by,
        payment_mode,
        notes,
        bill_image_path
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        event_id,
        category,
        vendor,
        amount,
        expense_date,
        paid_by,
        payment_mode,
        notes,
        bill_image_path,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to create expense",
    });
  }
});

/**
 * Get Expenses
 */
router.get("/", async (req, res) => {
  try {
    const { eventId } = req.query;

    let query = `
      SELECT
          e.id,
          e.event_id,
          ev.name AS event_name,
          e.category,
          e.vendor,
          e.amount,
          e.expense_date,
          e.payment_mode,
          e.paid_by,
          e.notes,
          e.bill_image_path
      FROM cultural.expenses e
      LEFT JOIN cultural.events ev
      ON ev.id = e.event_id
    `;

    const params: any[] = [];

    query += ` WHERE e.is_deleted = FALSE `;
    
    if (eventId) {
      query += ` AND e.event_id = $1 `;
      params.push(eventId);
    }

    query += ` ORDER BY e.expense_date DESC`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch expenses",
    });
  }
});

/**
 * Expense Summary
 */
router.get("/summary", async (req, res) => {
  try {
    const { eventId } = req.query;

    let totalQuery = `
      SELECT COALESCE(SUM(amount),0) total
      FROM cultural.expenses
    `;

    let categoryQuery = `
      SELECT
          category,
          SUM(amount) amount
      FROM cultural.expenses
    `;

    const params: any[] = [];

    totalQuery += `
      WHERE is_deleted = FALSE
    `;

    categoryQuery += `
      WHERE is_deleted = FALSE
    `;

    if (eventId) {
      totalQuery += `
        AND event_id = $1
      `;

      categoryQuery += `
        AND event_id = $1
      `;

      params.push(eventId);
    }

    categoryQuery += `
      GROUP BY category
      ORDER BY amount DESC
    `;

    const totalExpense = await pool.query(
      totalQuery,
      params
    );

    const categorySummary = await pool.query(
      categoryQuery,
      params
    );

    res.json({
      totalExpense: Number(
        totalExpense.rows[0].total
      ),
      byCategory: categorySummary.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch summary",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      event_id,
      category,
      vendor,
      amount,
      expense_date,
      paid_by,
      payment_mode,
      notes,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE cultural.expenses
      SET
        event_id=$1,
        category=$2,
        vendor=$3,
        amount=$4,
        expense_date=$5,
        paid_by=$6,
        payment_mode=$7,
        notes=$8
      WHERE id=$9
      RETURNING *
      `,
      [
        event_id,
        category,
        vendor,
        amount,
        expense_date,
        paid_by,
        payment_mode,
        notes,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to update expense",
    });
  }
});

router.post(
  "/upload",
  upload.single("bill"),
  async (req, res) => {
    res.json({
      path: req.file?.path,
    });
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE cultural.expenses
      SET is_deleted = TRUE
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      message: "Expense deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to delete expense",
    });
  }
});

export default router;