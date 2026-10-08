import express from "express";
import { pool } from "../db";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      financial_year_id,
      name,
      description,
      event_date,
      budget,
      status,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO cultural.events
      (
        financial_year_id,
        name,
        description,
        event_date,
        budget,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        financial_year_id,
        name,
        description,
        event_date,
        budget,
        status,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
          e.*,
          fy.name AS financial_year_name
      FROM cultural.events e
      JOIN cultural.financial_year fy
      ON fy.id = e.financial_year_id
      ORDER BY e.event_date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      financial_year_id,
      name,
      description,
      event_date,
      budget,
      status,
    } = req.body;

    if (!financial_year_id || !name?.trim() || !event_date) {
      return res.status(400).json({
        error: "Financial year, event name, and event date are required",
      });
    }

    const normalizedBudget =
      budget === "" || budget === undefined ? null : Number(budget);
    if (
      normalizedBudget !== null &&
      (!Number.isFinite(normalizedBudget) || normalizedBudget < 0)
    ) {
      return res.status(400).json({
        error: "Budget must be a non-negative number",
      });
    }

    const result = await pool.query(
      `
      UPDATE cultural.events
      SET
        financial_year_id = $1,
        name = $2,
        description = $3,
        event_date = $4,
        budget = $5,
        status = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        financial_year_id,
        name.trim(),
        description,
        event_date,
        normalizedBudget,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

export default router;