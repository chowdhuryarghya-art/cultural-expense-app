import express from "express";
import type { PoolClient } from "pg";
import { pool } from "../db";
import type { AuthenticatedRequest } from "../middleware/authentication";

const router = express.Router();
const maxHeadCount = 10000;

const isValidDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

interface MenuOption {
  id: string;
  meal_date: string;
  day_label: string;
  meal: "Breakfast" | "Lunch" | "Dinner";
  option_code: string;
  meal_type: "Veg" | "Non-Veg";
  description: string;
  price: string;
  display_order: number;
}

const getOrder = async (orderId: string) => {
  const orderResult = await pool.query(
    `SELECT id, block, flat_no, total_amount, created_at
     FROM cultural.meal_orders
     WHERE id = $1`,
    [orderId],
  );
  if (orderResult.rows.length === 0) return null;

  const itemsResult = await pool.query(
    `SELECT meal_date::text AS meal_date, day_label, meal, meal_type, option_code,
            description, price, head_count
     FROM cultural.meal_order_items
     WHERE order_id = $1
     ORDER BY meal_date, CASE meal
       WHEN 'Breakfast' THEN 1
       WHEN 'Lunch' THEN 2
       ELSE 3
     END, meal_type, option_code`,
    [orderId],
  );

  return {
    ...orderResult.rows[0],
    total_amount: Number(orderResult.rows[0].total_amount),
    items: itemsResult.rows.map((item) => ({
      ...item,
      price: Number(item.price),
      head_count: Number(item.head_count),
      line_total: Number(item.price) * Number(item.head_count),
    })),
  };
};

const isSubscriptionPaid = async (
  db: Pick<PoolClient, "query">,
  block: string,
  flatNo: string,
) => {
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1
       FROM cultural.meal_order_settings settings
       JOIN cultural.income income
         ON income.event_id = settings.subscription_event_id
       WHERE settings.singleton = TRUE
         AND income.source = 'Subscription'
         AND income.payment_status = 'Paid'
         AND income.is_deleted = FALSE
         AND LOWER(TRIM(income.block)) = LOWER($1)
         AND LOWER(TRIM(income.flat_no)) = LOWER($2)
     ) AS paid,
     (SELECT subscription_event_id IS NOT NULL
      FROM cultural.meal_order_settings
      WHERE singleton = TRUE) AS event_configured`,
    [block, flatNo],
  );
  return {
    paid: result.rows[0]?.paid === true,
    eventConfigured: result.rows[0]?.event_configured === true,
  };
};

interface OrderSelection {
  menu_option_id: number;
  head_count: number;
}

const persistOrder = async (
  client: PoolClient,
  input: {
    orderId: string | null;
    userId: number;
    block: string;
    flatNo: string;
    selections: OrderSelection[];
  },
) => {
  const selectionIds = input.selections.map(
    (selection) => selection.menu_option_id,
  );
  const menuResult = await client.query<MenuOption>(
    `SELECT id, meal_date::text AS meal_date, day_label, meal, option_code,
            meal_type, description, price, display_order
     FROM cultural.meal_menu_options
     WHERE id = ANY($1::bigint[])
     ORDER BY meal_date, CASE meal
       WHEN 'Breakfast' THEN 1
       WHEN 'Lunch' THEN 2
       ELSE 3
     END`,
    [selectionIds],
  );
  if (menuResult.rows.length !== selectionIds.length) {
    throw new Error("One or more meal choices are invalid");
  }

  if (
    menuResult.rows.some((option) => option.option_code === "complimentary")
  ) {
    const subscription = await isSubscriptionPaid(
      client,
      input.block,
      input.flatNo,
    );
    if (!subscription.eventConfigured) {
      throw new Error("SUBSCRIPTION_EVENT_NOT_CONFIGURED");
    }
    if (!subscription.paid) {
      throw new Error("SUBSCRIPTION_NOT_PAID");
    }
  }

  const headCountByOption = new Map(
    input.selections.map((selection) => [
      selection.menu_option_id,
      selection.head_count,
    ]),
  );
  const totalCents = menuResult.rows.reduce((total, option) => {
    const headCount = headCountByOption.get(Number(option.id));
    if (headCount === undefined) {
      throw new Error("A selected meal is missing its head count");
    }
    return total + Math.round(Number(option.price) * 100) * headCount;
  }, 0);

  let order: Record<string, unknown>;
  if (input.orderId) {
    const updateResult = await client.query(
      `UPDATE cultural.meal_orders
       SET block = $1, flat_no = $2, total_amount = $3
       WHERE id = $4
       RETURNING id, block, flat_no, total_amount, created_at`,
      [
        input.block,
        input.flatNo,
        (totalCents / 100).toFixed(2),
        input.orderId,
      ],
    );
    if (updateResult.rows.length === 0) return null;
    order = updateResult.rows[0];
    await client.query(
      "DELETE FROM cultural.meal_order_items WHERE order_id = $1",
      [input.orderId],
    );
  } else {
    const insertResult = await client.query(
      `INSERT INTO cultural.meal_orders
        (created_by, block, flat_no, total_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING id, block, flat_no, total_amount, created_at`,
      [
        input.userId,
        input.block,
        input.flatNo,
        (totalCents / 100).toFixed(2),
      ],
    );
    order = insertResult.rows[0];
  }

  for (const option of menuResult.rows) {
    const headCount = headCountByOption.get(Number(option.id));
    if (headCount === undefined) {
      throw new Error("A selected meal is missing its head count");
    }
    await client.query(
      `INSERT INTO cultural.meal_order_items
        (order_id, menu_option_id, meal_date, day_label, meal,
         meal_type, option_code, description, price, head_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        order.id,
        option.id,
        option.meal_date,
        option.day_label,
        option.meal,
        option.meal_type,
        option.option_code,
        option.description,
        option.price,
        headCount,
      ],
    );
  }

  return {
    ...order,
    id: String(order.id),
    total_amount: Number(order.total_amount),
    items: menuResult.rows.map((option) => {
      const headCount = headCountByOption.get(Number(option.id)) ?? 0;
      return {
        meal_date: option.meal_date,
        day_label: option.day_label,
        meal: option.meal,
        meal_type: option.meal_type,
        option_code: option.option_code,
        description: option.description,
        price: Number(option.price),
        head_count: headCount,
        line_total: Number(option.price) * headCount,
      };
    }),
  };
};

router.get("/menu", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, meal_date::text AS meal_date, day_label, meal, option_code, meal_type,
              description, price, display_order
       FROM cultural.meal_menu_options
       ORDER BY meal_date, CASE meal
         WHEN 'Breakfast' THEN 1
         WHEN 'Lunch' THEN 2
         ELSE 3
       END, display_order`,
    );
    res.json(
      result.rows.map((option: MenuOption) => ({
        ...option,
        id: Number(option.id),
        price: Number(option.price),
      })),
    );
  } catch (error) {
    console.error("Failed to load meal menu", error);
    res.status(500).json({ error: "Failed to load meal menu" });
  }
});

router.get("/residents", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name
       FROM cultural.meal_order_blocks
       WHERE is_active = TRUE
       ORDER BY name`,
    );
    return res.json(
      result.rows.map((block) => ({ ...block, id: Number(block.id) })),
    );
  } catch (error) {
    console.error("Failed to load meal order blocks", error);
    return res.status(500).json({ error: "Failed to load blocks" });
  }
});

router.get("/subscription-status", async (_req, res) => {
  try {
    const settings = await pool.query(
      `SELECT subscription_event_id
       FROM cultural.meal_order_settings
       WHERE singleton = TRUE`,
    );
    const eventId = settings.rows[0]?.subscription_event_id ?? null;
    const result = await pool.query(
      `WITH settings AS (
         SELECT $1::integer AS event_id
       )
       SELECT b.name AS block,
              f.flat_no,
              f.owner_name,
              settings.event_id IS NOT NULL AS event_configured,
              CASE
                WHEN settings.event_id IS NULL THEN NULL
                ELSE EXISTS (
                  SELECT 1
                  FROM cultural.income income
                  WHERE income.event_id = settings.event_id
                    AND income.source = 'Subscription'
                    AND income.payment_status = 'Paid'
                    AND income.is_deleted = FALSE
                    AND LOWER(TRIM(income.block)) = LOWER(TRIM(b.name))
                    AND LOWER(TRIM(income.flat_no)) = LOWER(TRIM(f.flat_no))
                )
              END AS paid
       FROM cultural.meal_order_blocks b
       JOIN cultural.meal_order_flats f ON f.block_id = b.id
       CROSS JOIN settings
       WHERE b.is_active = TRUE
         AND f.is_active = TRUE
       ORDER BY b.name, f.flat_no`,
      [eventId],
    );
    return res.json({
      eventConfigured: eventId !== null,
      residents: result.rows.map((resident) => ({
        block: resident.block,
        flat_no: resident.flat_no,
        owner_name: resident.owner_name,
        paid: resident.paid,
      })),
    });
  } catch (error) {
    console.error("Failed to load resident subscription statuses", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "42703" &&
      "column" in error &&
      error.column === "owner_name"
    ) {
      return res.status(503).json({
        error:
          "The resident owner_name column is not set up. Apply backend/migrations/20261012_add_meal_flat_owner_name.sql, then try again.",
      });
    }
    return res.status(500).json({
      error: "Failed to load subscription payment status for residents",
    });
  }
});

router.get("/residents/:blockId/flats", async (req, res) => {
  const blockId = Number(req.params.blockId);
  if (!Number.isSafeInteger(blockId) || blockId <= 0) {
    return res.status(400).json({ error: "A valid block is required" });
  }
  try {
    const result = await pool.query(
      `SELECT id, flat_no
       FROM cultural.meal_order_flats
       WHERE block_id = $1 AND is_active = TRUE
       ORDER BY flat_no`,
      [blockId],
    );
    return res.json(
      result.rows.map((flat) => ({ ...flat, id: Number(flat.id) })),
    );
  } catch (error) {
    console.error("Failed to load flats for meal ordering", error);
    return res.status(500).json({ error: "Failed to load flats" });
  }
});

router.get("/resident-status", async (req, res) => {
  const block = req.query.block;
  const flatNo = req.query.flat_no;
  if (
    typeof block !== "string" ||
    typeof flatNo !== "string" ||
    !block.trim() ||
    !flatNo.trim()
  ) {
    return res.status(400).json({ error: "Block and flat are required" });
  }
  try {
    return res.json(
      await isSubscriptionPaid(pool, block.trim(), flatNo.trim()),
    );
  } catch (error) {
    console.error("Failed to check subscription status", error);
    return res.status(500).json({
      error: "Failed to check subscription payment status",
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, block, flat_no, total_amount, created_at
       FROM cultural.meal_orders
       ORDER BY created_at DESC, id DESC`,
    );
    return res.json(
      result.rows.map((order) => ({
        ...order,
        id: String(order.id),
        total_amount: Number(order.total_amount),
      })),
    );
  } catch (error) {
    console.error("Failed to load meal orders", error);
    return res.status(500).json({ error: "Failed to load meal orders" });
  }
});

router.get("/summary", async (req, res) => {
  const mealDate = req.query.meal_date;
  if (
    typeof mealDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(mealDate) ||
    !isValidDate(mealDate)
  ) {
    return res.status(400).json({ error: "A valid meal date is required" });
  }

  try {
    const result = await pool.query(
      `SELECT i.meal_date::text AS meal_date, i.day_label, i.meal, i.meal_type,
              i.option_code, i.description, i.price,
              SUM(i.head_count)::integer AS head_count,
              COUNT(*)::integer AS order_count,
              SUM(i.price * i.head_count) AS total_amount
       FROM cultural.meal_order_items i
       WHERE i.meal_date = $1
       GROUP BY i.meal_date, i.day_label, i.meal, i.meal_type,
                i.option_code, i.description, i.price
       ORDER BY CASE i.meal
         WHEN 'Breakfast' THEN 1
         WHEN 'Lunch' THEN 2
         ELSE 3
       END, i.meal_type, i.option_code`,
      [mealDate],
    );
    return res.json(
      result.rows.map((row) => ({
        ...row,
        price: Number(row.price),
        head_count: Number(row.head_count),
        order_count: Number(row.order_count),
        total_amount: Number(row.total_amount),
      })),
    );
  } catch (error) {
    console.error("Failed to load meal order summary", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "42703" &&
      "column" in error &&
      error.column === "head_count"
    ) {
      return res.status(503).json({
        error:
          "Meal head counts are not set up in the database. Apply the meal order head-count migration, then restart the backend.",
      });
    }
    return res.status(500).json({ error: "Failed to load meal order summary" });
  }
});

const saveMealOrder = async (
  req: express.Request,
  res: express.Response,
  orderId: string | null,
) => {
  const request = req as AuthenticatedRequest;
  if (!request.auth) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { block, flat_no: flatNo, selections } = req.body ?? {};
  if (typeof block !== "string" || !block.trim() || block.trim().length > 100) {
    return res.status(400).json({
      error: "Block is required and must be 100 characters or fewer",
    });
  }
  if (
    typeof flatNo !== "string" ||
    !flatNo.trim() ||
    flatNo.trim().length > 100
  ) {
    return res.status(400).json({
      error: "Flat number is required and must be 100 characters or fewer",
    });
  }
  if (
    !Array.isArray(selections) ||
    selections.length === 0 ||
    selections.some(
      (selection: unknown) => {
        if (!selection || typeof selection !== "object") return true;
        const item = selection as Record<string, unknown>;
        return (
          !Number.isSafeInteger(item.menu_option_id) ||
          Number(item.menu_option_id) <= 0 ||
          !Number.isSafeInteger(item.head_count) ||
          Number(item.head_count) < 1 ||
          Number(item.head_count) > maxHeadCount
        );
      },
    )
  ) {
    return res.status(400).json({
      error: `Select at least one meal and enter a head count from 1 to ${maxHeadCount} for each`,
    });
  }

  const validatedSelections = selections as Array<{
    menu_option_id: number;
    head_count: number;
  }>;
  const selectionIds = validatedSelections.map(
    (selection) => selection.menu_option_id,
  );
  if (new Set(selectionIds).size !== selectionIds.length) {
    return res.status(400).json({ error: "Duplicate meal selections are not allowed" });
  }

  const normalizedBlock = block.trim();
  const normalizedFlatNo = flatNo.trim();
  try {
    const residentResult = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM cultural.meal_order_blocks b
         JOIN cultural.meal_order_flats f ON f.block_id = b.id
         WHERE b.name = $1 AND f.flat_no = $2
           AND b.is_active = TRUE AND f.is_active = TRUE
       ) AS valid`,
      [normalizedBlock, normalizedFlatNo],
    );
    if (residentResult.rows[0]?.valid !== true) {
      return res.status(400).json({
        error: "Select a valid active block and flat number",
      });
    }
  } catch (error) {
    console.error("Failed to validate meal order residence", error);
    return res.status(500).json({ error: "Could not validate block and flat" });
  }

  let client: PoolClient | undefined;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const savedOrder = await persistOrder(client, {
      orderId,
      userId: request.auth.userId,
      block: normalizedBlock,
      flatNo: normalizedFlatNo,
      selections: validatedSelections,
    });
    if (!savedOrder) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ error: "Meal order not found" });
    }

    await client.query("COMMIT");
    transactionStarted = false;
    return res.status(orderId ? 200 : 201).json(savedOrder);
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to roll back meal order transaction", rollbackError);
      }
    }
    console.error("Failed to save meal order", error);
    if (error instanceof Error && error.message === "SUBSCRIPTION_NOT_PAID") {
      return res.status(403).json({
        error:
          "Astami complimentary lunch is only available after this flat's subscription is paid.",
      });
    }
    if (
      error instanceof Error &&
      error.message === "SUBSCRIPTION_EVENT_NOT_CONFIGURED"
    ) {
      return res.status(503).json({
        error:
          "Configure the Durgotsav event in cultural.meal_order_settings before using complimentary lunch.",
      });
    }
    if (error instanceof Error && error.message === "One or more meal choices are invalid") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Failed to save meal order" });
  } finally {
    client?.release();
  }
};

router.post("/", (req, res) => saveMealOrder(req, res, null));

router.put("/:id", (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: "A valid meal order ID is required" });
  }
  return saveMealOrder(req, res, String(orderId));
});

router.get("/:id", async (req, res) => {
  const request = req as AuthenticatedRequest;
  if (!request.auth) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const orderId = Number(req.params.id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ error: "A valid meal order ID is required" });
  }

  try {
    const order = await getOrder(String(orderId));
    if (!order) {
      return res.status(404).json({ error: "Meal order not found" });
    }
    return res.json(order);
  } catch (error) {
    console.error("Failed to load meal order", error);
    return res.status(500).json({ error: "Failed to load meal order" });
  }
});

export default router;
