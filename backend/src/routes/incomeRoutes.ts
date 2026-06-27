import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * Create Income
 */
router.post("/", async (req, res) => {
  try {
    const {
      event_id,
      source,
      amount,
      income_date,
      received_by,
      payment_mode,
      notes,
    } = req.body;

    if (!event_id) {
      return res.status(400).json({
        error: "Event is required",
      });
    }

    if (!source) {
      return res.status(400).json({
        error: "Source is required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than zero",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO cultural.income
      (
        event_id,
        source,
        amount,
        income_date,
        received_by,
        payment_mode,
        notes
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        event_id,
        source,
        amount,
        income_date,
        received_by,
        payment_mode,
        notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to create income",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { eventId } = req.query;

    let query = `
      SELECT
        i.*,
        e.name AS event_name
      FROM cultural.income i
      LEFT JOIN cultural.events e
      ON e.id = i.event_id
      WHERE i.is_deleted = FALSE
    `;

    const params: any[] = [];

    if (eventId) {
      query += ` AND i.event_id = $1 `;
      params.push(eventId);
    }

    query += `
      ORDER BY i.income_date DESC
    `;

    const result = await pool.query(
      query,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch income",
    });
  }
});

/**
 * Income Summary
 */
router.get("/summary", async (req, res) => {
  try {
    const { eventId } = req.query;

    let totalQuery = `
      SELECT COALESCE(SUM(amount),0) total
      FROM cultural.income
      WHERE is_deleted = FALSE
    `;

    let sourceQuery = `
      SELECT
        source,
        SUM(amount) amount
      FROM cultural.income
      WHERE is_deleted = FALSE
    `;

    const params: any[] = [];

    if (eventId) {
      totalQuery += ` AND event_id = $1`;
      sourceQuery += ` AND event_id = $1`;
      params.push(eventId);
    }

    sourceQuery += `
      GROUP BY source
      ORDER BY amount DESC
    `;

    const totalIncome = await pool.query(
      totalQuery,
      params
    );

    const sourceSummary = await pool.query(
      sourceQuery,
      params
    );

    res.json({
      totalIncome: Number(
        totalIncome.rows[0].total
      ),
      bySource: sourceSummary.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch income summary",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      event_id,
      source,
      amount,
      income_date,
      received_by,
      payment_mode,
      notes,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE cultural.income
      SET
        event_id = $1,
        source = $2,
        amount = $3,
        income_date = $4,
        received_by = $5,
        payment_mode = $6,
        notes = $7
      WHERE id = $8
      RETURNING *
      `,
      [
        event_id,
        source,
        amount,
        income_date,
        received_by,
        payment_mode,
        notes,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to update income",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE cultural.income
      SET is_deleted = TRUE
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      message: "Income deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to delete income",
    });
  }
});

export default router;