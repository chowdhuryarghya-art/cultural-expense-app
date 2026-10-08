import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Checkbox,
  Container,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import MealOrderReceipt from "../components/MealOrderReceipt";

type Meal = "Breakfast" | "Lunch" | "Dinner";
type MealType = "Veg" | "Non-Veg";

interface MenuOption {
  id: number;
  meal_date: string;
  day_label: string;
  meal: Meal;
  option_code: string;
  meal_type: MealType;
  description: string;
  price: number;
  display_order: number;
}

interface SavedOrder {
  id: string | number;
  block: string;
  flat_no: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    meal_date: string;
    day_label: string;
    meal: Meal;
    meal_type: MealType;
    option_code: string;
    description: string;
    price: number;
    head_count: number;
    line_total: number;
  }>;
}

interface MealRow {
  key: string;
  meal_date: string;
  day_label: string;
  meal: Meal;
  options: MenuOption[];
}

interface BlockOption {
  id: number;
  name: string;
}

interface FlatOption {
  id: number;
  flat_no: string;
}

interface MealOrderProps {
  editingOrder?: SavedOrder | null;
  onOrderSaved?: () => void;
}

const mealOrder = { Breakfast: 0, Lunch: 1, Dinner: 2 };
const maxHeadCount = 10000;
const isValidHeadCount = (headCount: number) =>
  Number.isSafeInteger(headCount) &&
  headCount >= 1 &&
  headCount <= maxHeadCount;
const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
const getOptionLabel = (option: MenuOption) => {
  if (option.option_code === "complimentary") return "Complimentary";
  if (option.option_code === "paid") return "Paid";
  if (option.option_code === "mutton") return "Mutton";
  if (option.option_code === "chicken") return "Chicken";
  return option.meal_type;
};

export default function MealOrder({
  editingOrder = null,
  onOrderSaved,
}: MealOrderProps) {
  const [menu, setMenu] = useState<MenuOption[]>([]);
  const [blocks, setBlocks] = useState<BlockOption[]>([]);
  const [flats, setFlats] = useState<FlatOption[]>([]);
  const [block, setBlock] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [selections, setSelections] = useState<Record<number, boolean>>({});
  const [headCounts, setHeadCounts] = useState<Record<string, string>>({});
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);
  const [subscriptionConfigured, setSubscriptionConfigured] = useState(false);
  const [residentLoading, setResidentLoading] = useState(false);
  const [savedOrder, setSavedOrder] = useState<SavedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateComplimentarySelection = useCallback((paid: boolean) => {
    const complimentaryOption = menu.find(
      (option) =>
        option.meal === "Lunch" && option.option_code === "complimentary",
    );
    if (!complimentaryOption) return;

    setSelections((current) => {
      const next = { ...current };
      if (paid) next[complimentaryOption.id] = true;
      else delete next[complimentaryOption.id];
      return next;
    });
    if (paid) {
      setHeadCounts((current) => ({
        ...current,
        [String(complimentaryOption.id)]:
          current[String(complimentaryOption.id)] ?? "1",
      }));
    } else {
      setHeadCounts((current) => {
        const next = { ...current };
        delete next[String(complimentaryOption.id)];
        return next;
      });
    }
  }, [menu]);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      api.get<MenuOption[]>("/meal-orders/menu"),
      api.get<BlockOption[]>("/meal-orders/residents"),
    ])
      .then(([menuResponse, blocksResponse]) => {
        if (!isCurrent) return;
        setMenu(menuResponse.data);
        setBlocks(blocksResponse.data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load meal ordering options", error);
        if (isCurrent) {
          setErrorMessage(
            "Could not load the meal menu or block list. Please check the meal-order setup.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!editingOrder || menu.length === 0 || blocks.length === 0) return;

    let isCurrent = true;
    const initializeEdit = async () => {
      setBlock(editingOrder.block);
      setFlatNo(editingOrder.flat_no);
      const selectedOptions: Record<number, boolean> = {};
      const counts: Record<string, string> = {};
      editingOrder.items.forEach((item) => {
        const option = menu.find(
          (candidate) =>
            candidate.meal_date === item.meal_date &&
            candidate.meal === item.meal &&
            candidate.option_code === item.option_code,
        );
        if (option) {
          selectedOptions[option.id] = true;
          counts[String(option.id)] = String(item.head_count);
        }
      });
      setSelections(selectedOptions);
      setHeadCounts(counts);

      const blockOption = blocks.find(
        (candidate) => candidate.name === editingOrder.block,
      );
      if (blockOption) {
        setResidentLoading(true);
        try {
          const [flatsResponse, statusResponse] = await Promise.all([
            api.get<FlatOption[]>(
              `/meal-orders/residents/${blockOption.id}/flats`,
            ),
            api.get<{ paid: boolean; eventConfigured: boolean }>(
              "/meal-orders/resident-status",
              {
                params: {
                  block: editingOrder.block,
                  flat_no: editingOrder.flat_no,
                },
              },
            ),
          ]);
          if (isCurrent) {
            setFlats(flatsResponse.data);
            setSubscriptionPaid(statusResponse.data.paid);
            setSubscriptionConfigured(statusResponse.data.eventConfigured);
            updateComplimentarySelection(statusResponse.data.paid);
          }
        } catch (error) {
          console.error("Failed to load resident meal-order details", error);
          if (isCurrent) {
            setErrorMessage("Could not load the selected resident details.");
          }
        } finally {
          if (isCurrent) setResidentLoading(false);
        }
      }
    };
    void initializeEdit();
    return () => {
      isCurrent = false;
    };
  }, [blocks, editingOrder, menu, updateComplimentarySelection]);

  const handleBlockChange = async (name: string) => {
    setBlock(name);
    setFlatNo("");
    setFlats([]);
    setSubscriptionPaid(false);
    setSubscriptionConfigured(false);
    updateComplimentarySelection(false);
    setSavedOrder(null);
    const selected = blocks.find((item) => item.name === name);
    if (!selected) return;

    setResidentLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get<FlatOption[]>(
        `/meal-orders/residents/${selected.id}/flats`,
      );
      setFlats(response.data);
    } catch (error) {
      console.error("Failed to load flats", error);
      setErrorMessage("Could not load flats for the selected block.");
    } finally {
      setResidentLoading(false);
    }
  };

  const rows = useMemo(() => {
    const rowMap = new Map<string, MealRow>();
    for (const option of menu) {
      const key = `${option.meal_date}|${option.meal}`;
      const existing = rowMap.get(key);
      if (existing) {
        existing.options.push(option);
      } else {
        rowMap.set(key, {
          key,
          meal_date: option.meal_date,
          day_label: option.day_label,
          meal: option.meal,
          options: [option],
        });
      }
    }
    return Array.from(rowMap.values()).sort(
      (a, b) =>
        a.meal_date.localeCompare(b.meal_date) ||
        mealOrder[a.meal] - mealOrder[b.meal],
    );
  }, [menu]);

  const selectedMeals = useMemo(
    () =>
      menu
        .filter((option) => selections[option.id])
        .map((option) => ({
          option,
          headCount: Number(headCounts[String(option.id)] ?? ""),
        })),
    [headCounts, menu, selections],
  );
  const total = selectedMeals.reduce(
    (sum, { option, headCount }) =>
      isValidHeadCount(headCount)
        ? sum + option.price * headCount
        : sum,
    0,
  );

  const handleOptionToggle = (optionId: number, checked: boolean) => {
    setSelections((current) => {
      const next = { ...current };
      if (checked) {
        next[optionId] = true;
      } else {
        delete next[optionId];
      }
      return next;
    });
    setHeadCounts((current) => {
      const key = String(optionId);
      if (!checked) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: current[key] ?? "" };
    });
    setSavedOrder(null);
    setErrorMessage("");
  };

  const handleHeadCountChange = (key: string, value: string) => {
    setHeadCounts((current) => ({ ...current, [key]: value }));
    setSavedOrder(null);
    setErrorMessage("");
  };

  const loadSubscriptionStatus = async (selectedFlatNo: string) => {
    setSubscriptionPaid(false);
    setSubscriptionConfigured(false);
    updateComplimentarySelection(false);
    if (!block || !selectedFlatNo) return;
    setResidentLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get<{
        paid: boolean;
        eventConfigured: boolean;
      }>("/meal-orders/resident-status", {
        params: { block, flat_no: selectedFlatNo },
      });
      setSubscriptionPaid(response.data.paid);
      setSubscriptionConfigured(response.data.eventConfigured);
      updateComplimentarySelection(response.data.paid);
    } catch (error) {
      console.error("Failed to check subscription status", error);
      setErrorMessage("Could not check subscription payment for this flat.");
    } finally {
      setResidentLoading(false);
    }
  };

  const saveOrder = async () => {
    if (!block.trim() || !flatNo.trim()) {
      setErrorMessage("Enter both block and flat number before saving.");
      return;
    }
    if (selectedMeals.length === 0) {
      setErrorMessage("Select at least one meal before saving.");
      return;
    }
    if (
      selectedMeals.some(
        ({ headCount }) => !isValidHeadCount(headCount),
      )
    ) {
      setErrorMessage(
        `Enter a head count from 1 to ${maxHeadCount} for every selected meal.`,
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        block: block.trim(),
        flat_no: flatNo.trim(),
        selections: selectedMeals.map(({ option, headCount }) => ({
          menu_option_id: option.id,
          head_count: headCount,
        })),
      };
      const response = editingOrder
        ? await api.put<SavedOrder>(`/meal-orders/${editingOrder.id}`, payload)
        : await api.post<SavedOrder>("/meal-orders", payload);
      setSavedOrder(response.data);
      onOrderSaved?.();
    } catch (error) {
      console.error("Failed to save meal order", error);
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "error" in error.response.data &&
        typeof error.response.data.error === "string"
          ? error.response.data.error
          : "Could not save the meal order. Please try again.";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {editingOrder ? `Edit meal order #${editingOrder.id}` : "Meal ordering"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter your flat details, select any meal options you want, and
            provide a separate head count for each selected option.
          </Typography>
        </Box>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}
        {!loading && blocks.length === 0 && (
          <Alert severity="info">
            No active blocks are configured yet. Populate the block and flat
            directory tables to enable meal ordering.
          </Alert>
        )}

        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              required
              fullWidth
              label="Block"
              value={block}
              disabled={saving || blocks.length === 0}
              onChange={(event) => {
                void handleBlockChange(event.target.value);
              }}
            >
              <MenuItem value="" disabled>
                Select a block
              </MenuItem>
              {blocks.map((item) => (
                <MenuItem key={item.id} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              required
              fullWidth
              label="Flat number"
              value={flatNo}
              disabled={
                saving ||
                residentLoading ||
                !blocks.some((item) => item.name === block)
              }
              onChange={(event) => {
                const selectedFlat = event.target.value;
                setFlatNo(selectedFlat);
                setSavedOrder(null);
                void loadSubscriptionStatus(selectedFlat);
              }}
            >
              <MenuItem value="" disabled>
                {residentLoading ? "Loading flats…" : "Select a flat"}
              </MenuItem>
              {flats.map((item) => (
                <MenuItem key={item.id} value={item.flat_no}>
                  {item.flat_no}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {flatNo && !subscriptionPaid && (
            <Alert severity={subscriptionConfigured ? "info" : "warning"} sx={{ mt: 2 }}>
              {subscriptionConfigured
                ? "Astami complimentary lunch is unavailable because this flat's subscription is not marked as paid."
                : "Configure the Durgotsav event in meal_order_settings to check subscription payment and enable complimentary lunch."}
            </Alert>
          )}
        </Paper>

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table
                stickyHeader
                aria-label="Festival meal menu"
                sx={{ minWidth: 900, tableLayout: "fixed" }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 145 }}>
                      Day
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 95 }}>
                      Meal
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Food type and menu options
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    return (
                      <TableRow key={row.key} hover>
                        <TableCell sx={{ whiteSpace: "normal", overflowWrap: "anywhere", width: 150 }}>
                          {row.day_label}
                        </TableCell>
                        <TableCell sx={{ width: 100 }}>{row.meal}</TableCell>
                        <TableCell>
                          <Stack spacing={1.5}>
                            {row.options.map((option) => {
                              const isSelected = !!selections[option.id];
                              const headCount = Number(
                                headCounts[String(option.id)] ?? "",
                              );
                              const requiresSubscription =
                                option.meal === "Lunch" &&
                                option.option_code === "complimentary";
                              const complimentaryUnavailable =
                                requiresSubscription && !subscriptionPaid;
                              return (
                                <Box
                                  key={option.id}
                                  sx={{
                                    display: "flex",
                                    alignItems: { xs: "flex-start", md: "center" },
                                    flexWrap: "wrap",
                                    gap: 1,
                                    p: 1,
                                    border: 1,
                                    borderColor: complimentaryUnavailable
                                      ? "error.main"
                                      : isSelected
                                        ? "primary.main"
                                        : "divider",
                                    bgcolor: complimentaryUnavailable
                                      ? "rgba(211, 47, 47, 0.08)"
                                      : undefined,
                                    opacity: complimentaryUnavailable ? 0.9 : 1,
                                    borderRadius: 1,
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={
                                      saving ||
                                      (requiresSubscription && !subscriptionPaid)
                                    }
                                    color={complimentaryUnavailable ? "error" : "primary"}
                                    onChange={(event) =>
                                      handleOptionToggle(
                                        option.id,
                                        event.target.checked,
                                      )
                                    }
                                    slotProps={{
                                      input: {
                                        "aria-label": `${option.meal_type} ${getOptionLabel(option)} for ${row.day_label} ${row.meal}`,
                                      },
                                    }}
                                  />
                                  <Box sx={{ flex: "1 1 220px", minWidth: 0 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 700,
                                        color: complimentaryUnavailable
                                          ? "error.main"
                                          : "text.primary",
                                      }}
                                    >
                                      {option.meal_type}
                                      {option.option_code !== "veg" &&
                                      option.option_code !== "non-veg"
                                        ? ` · ${getOptionLabel(option)}`
                                        : ""}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color={
                                        complimentaryUnavailable
                                          ? "error.main"
                                          : "text.secondary"
                                      }
                                      sx={{ display: "block", overflowWrap: "anywhere" }}
                                    >
                                      {complimentaryUnavailable
                                        ? "Unavailable — subscription payment required. "
                                        : ""}
                                      {option.description}
                                    </Typography>
                                  </Box>
                                  <TextField
                                    type="number"
                                    size="small"
                                    label="Head count"
                                    value={headCounts[String(option.id)] ?? ""}
                                    disabled={!isSelected || saving}
                                    onChange={(event) =>
                                      handleHeadCountChange(
                                        String(option.id),
                                        event.target.value,
                                      )
                                    }
                                    sx={{ width: 125 }}
                                    slotProps={{
                                      htmlInput: {
                                        min: 1,
                                        max: maxHeadCount,
                                        step: 1,
                                        inputMode: "numeric",
                                      },
                                    }}
                                  />
                                  <Box sx={{ minWidth: 105, textAlign: "right" }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatPrice(option.price)} each
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {isValidHeadCount(headCount)
                                        ? formatPrice(option.price * headCount)
                                        : "—"}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No meal menu options are available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Order summary
            </Typography>
            {selectedMeals.length === 0 ? (
              <Typography color="text.secondary">
                Select meals to see your order summary and total.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {selectedMeals.map(({ option, headCount }) => (
                  <Box
                    key={option.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      borderBottom: 1,
                      borderColor: "divider",
                      pb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {option.day_label} · {option.meal} · {option.meal_type}
                      {" · "}
                      {getOptionLabel(option)}
                      {" · "}
                      {isValidHeadCount(headCount)
                        ? `${headCount} ${headCount === 1 ? "person" : "people"}`
                        : "Enter head count"}
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {option.description}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                      {isValidHeadCount(headCount)
                        ? formatPrice(option.price * headCount)
                        : "—"}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total: {formatPrice(total)}
            </Typography>
            <Box>
              <Button
                variant="contained"
                onClick={() => void saveOrder()}
                disabled={saving || loading || rows.length === 0}
              >
                {saving
                  ? "Saving order…"
                  : editingOrder
                    ? "Save order changes"
                    : "Save meal order"}
              </Button>
            </Box>
            {savedOrder && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
              >
                <Alert severity="success" sx={{ flexGrow: 1 }}>
                  Order #{savedOrder.id} saved for Block {savedOrder.block}, Flat{" "}
                  {savedOrder.flat_no}. Total:{" "}
                  {formatPrice(savedOrder.total_amount)}.
                </Alert>
                <MealOrderReceipt order={savedOrder} />
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
