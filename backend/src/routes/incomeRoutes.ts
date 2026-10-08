import express from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";

const router = express.Router();
const incomeSources = ["Puja Donation", "Sponsorship", "Subscription"];

interface BulkIncomeRecord {
  source: string;
  received_from: string;
  block: string;
  flat_no: string;
  amount: string;
  income_date: string;
  payment_mode: string;
  payment_status: string;
  notes: string;
}

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
      received_from,
      block,
      flat_no,
      payment_mode,
      payment_status,
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

    if (
      source === "Puja Donation" &&
      !["Paid", "Pending"].includes(payment_status)
    ) {
      return res.status(400).json({
        error: "Payment status must be Paid or Pending for Puja Donation",
      });
    }

    if (typeof received_from !== "string" || !received_from.trim()) {
      return res.status(400).json({
        error: "Received from is required",
      });
    }

    if (!income_date) {
      return res.status(400).json({
        error: "Income date is required",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
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
        received_from,
        block,
        flat_no,
        payment_mode,
        payment_status,
        notes
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        event_id,
        source,
        amount,
        income_date,
        received_from.trim(),
        typeof block === "string" ? block.trim() || null : null,
        typeof flat_no === "string" ? flat_no.trim() || null : null,
        payment_mode,
        source === "Puja Donation" ? payment_status : null,
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

router.post("/bulk", async (req, res) => {
  const { event_id, records } = req.body ?? {};
  const eventId = typeof event_id === "number" ? event_id : Number.NaN;

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({ error: "A valid event is required" });
  }

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "The CSV contains no income records" });
  }

  if (records.length > 1000) {
    return res.status(400).json({
      error: "Upload a maximum of 1,000 income records at a time",
    });
  }

  const errors: { row: number; message: string }[] = [];
  const validRecords: BulkIncomeRecord[] = [];

  records.forEach((record: unknown, index: number) => {
    const rowNumber = index + 2;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push({ row: rowNumber, message: "Invalid row data" });
      return;
    }

    const row = record as Record<string, unknown>;
    const text = (field: string) =>
      typeof row[field] === "string" ? row[field].trim() : "";
    const source = text("source");
    const receivedFrom = text("received_from");
    const amount = text("amount");
    const incomeDate = text("income_date");
    const block = text("block");
    const flatNo = text("flat_no");
    const paymentMode = text("payment_mode");
    const paymentStatus = text("payment_status");
    const notes = text("notes");
    const rowErrors: string[] = [];

    if (!incomeSources.includes(source)) {
      rowErrors.push("Source must be Puja Donation, Sponsorship, or Subscription");
    }
    if (!receivedFrom) rowErrors.push("Received from is required");
    if (receivedFrom.length > 100) {
      rowErrors.push("Received from must be 100 characters or fewer");
    }
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      rowErrors.push("Amount must be positive with no more than 2 decimal places");
    }
    const parsedDate = new Date(`${incomeDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(incomeDate) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== incomeDate
    ) {
      rowErrors.push("Income date must be a valid date in YYYY-MM-DD format");
    }
    if (block.length > 100) rowErrors.push("Block must be 100 characters or fewer");
    if (flatNo.length > 100) {
      rowErrors.push("Flat No. must be 100 characters or fewer");
    }
    if (paymentMode.length > 50) {
      rowErrors.push("Payment mode must be 50 characters or fewer");
    }
    if (
      source === "Puja Donation" &&
      !["Paid", "Pending"].includes(paymentStatus)
    ) {
      rowErrors.push("Payment status must be Paid or Pending for Puja Donation");
    }
    if (source !== "Puja Donation" && paymentStatus) {
      rowErrors.push("Payment status is only used for Puja Donation");
    }

    if (rowErrors.length) {
      errors.push({ row: rowNumber, message: rowErrors.join("; ") });
      return;
    }

    validRecords.push({
      source,
      received_from: receivedFrom,
      block,
      flat_no: flatNo,
      amount,
      income_date: incomeDate,
      payment_mode: paymentMode,
      payment_status: paymentStatus,
      notes,
    });
  });

  if (errors.length) {
    return res.status(400).json({
      error: "No records were imported. Correct the CSV errors and try again.",
      errors,
    });
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const eventResult = await client.query(
      "SELECT id FROM cultural.events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({ error: "Selected event does not exist" });
    }

    const values: unknown[] = [];
    const placeholders = validRecords.map((record, index) => {
      const offset = index * 10;
      values.push(
        eventId,
        record.source,
        record.amount,
        record.income_date,
        record.received_from,
        record.block || null,
        record.flat_no || null,
        record.payment_mode || null,
        record.payment_status || null,
        record.notes || null
      );
      return `(${Array.from({ length: 10 }, (_, field) => `$${offset + field + 1}`).join(",")})`;
    });

    await client.query(
      `INSERT INTO cultural.income
        (event_id, source, amount, income_date, received_from, block, flat_no, payment_mode, payment_status, notes)
       VALUES ${placeholders.join(",")}`,
      values
    );
    await client.query("COMMIT");
    transactionStarted = false;

    res.status(201).json({ imported: validRecords.length });
  } catch (error) {
    if (transactionStarted && client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to roll back income import transaction", rollbackError);
      }
    }
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to import income records" });
    }
  } finally {
    client?.release();
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
      received_from,
      block,
      flat_no,
      payment_mode,
      payment_status,
      notes,
    } = req.body;

    if (!event_id || !source) {
      return res.status(400).json({
        error: "Event and source are required",
      });
    }

    if (
      source === "Puja Donation" &&
      !["Paid", "Pending"].includes(payment_status)
    ) {
      return res.status(400).json({
        error: "Payment status must be Paid or Pending for Puja Donation",
      });
    }

    if (typeof received_from !== "string" || !received_from.trim()) {
      return res.status(400).json({
        error: "Received from is required",
      });
    }

    if (!income_date) {
      return res.status(400).json({
        error: "Income date is required",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        error: "Amount must be greater than zero",
      });
    }

    const result = await pool.query(
      `
      UPDATE cultural.income
      SET
        event_id = $1,
        source = $2,
        amount = $3,
        income_date = $4,
        received_from = $5,
        block = $6,
        flat_no = $7,
        payment_mode = $8,
        payment_status = $9,
        notes = $10
      WHERE id = $11
      RETURNING *
      `,
      [
        event_id,
        source,
        amount,
        income_date,
        received_from.trim(),
        typeof block === "string" ? block.trim() || null : null,
        typeof flat_no === "string" ? flat_no.trim() || null : null,
        payment_mode,
        source === "Puja Donation" ? payment_status : null,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Income not found" });
    }

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