import express from "express";
import { pool } from "../db";

const router = express.Router();

/**
 * Create Financial Year
 */
router.post("/", async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;

    const query = `
      INSERT INTO cultural.financial_year
      (name, start_date, end_date)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [name, start_date, end_date];

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create financial year",
    });
  }
});

/**
 * Get All Financial Years
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM cultural.financial_year
      ORDER BY start_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch financial years",
    });
  }
});

/**
 * Get Financial Year By ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM cultural.financial_year
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Financial year not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch financial year",
    });
  }
});

/**
 * Update Financial Year
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { name, start_date, end_date } = req.body;

    const query = `
      UPDATE cultural.financial_year
      SET
        name = $1,
        start_date = $2,
        end_date = $3
      WHERE id = $4
      RETURNING *
    `;

    const values = [name, start_date, end_date, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Financial year not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update financial year",
    });
  }
});

/**
 * Delete Financial Year
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM cultural.financial_year
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Financial year not found",
      });
    }

    res.json({
      message: "Financial year deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete financial year",
    });
  }
});

export default router;