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

export default router;