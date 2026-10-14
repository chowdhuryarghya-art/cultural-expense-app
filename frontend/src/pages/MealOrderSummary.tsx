import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import api from "../api";

interface MenuDay {
  meal_date: string;
  day_label: string;
}

interface MealSummaryRow {
  meal: string;
  meal_type: string;
  option_code: string;
  description: string;
  price: number;
  head_count: number;
  parcel_count: number;
  parcel_total: number;
  order_count: number;
  total_amount: number;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  const responseData: unknown = error.response?.data;
  if (
    responseData &&
    typeof responseData === "object" &&
    "error" in responseData &&
    typeof responseData.error === "string"
  ) {
    return responseData.error;
  }
  return fallback;
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const optionLabel = (optionCode: string) => {
  if (optionCode === "complimentary") return "Complimentary";
  if (optionCode === "paid") return "Paid";
  if (optionCode === "chicken") return "Chicken";
  if (optionCode === "mutton") return "Mutton";
  return "";
};

export default function MealOrderSummary() {
  const [days, setDays] = useState<MenuDay[]>([]);
  const [mealDate, setMealDate] = useState("");
  const [summary, setSummary] = useState<MealSummaryRow[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    api
      .get<MenuDay[]>("/meal-orders/menu")
      .then((response) => {
        if (!isCurrent) return;
        const uniqueDays = new Map<string, MenuDay>();
        response.data.forEach((day) => uniqueDays.set(day.meal_date, day));
        const availableDays = Array.from(uniqueDays.values());
        setDays(availableDays);
        if (availableDays[0]) {
          setLoadingSummary(true);
          setMealDate(availableDays[0].meal_date);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load meal summary day options", error);
        if (isCurrent) setErrorMessage("Could not load festival days.");
      })
      .finally(() => {
        if (isCurrent) setLoadingDays(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!mealDate) return;

    let isCurrent = true;
    api
      .get<MealSummaryRow[]>("/meal-orders/summary", {
        params: { meal_date: mealDate },
      })
      .then((response) => {
        if (isCurrent) setSummary(response.data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load day meal summary", error);
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Could not load the selected day summary.",
            ),
          );
        }
      })
      .finally(() => {
        if (isCurrent) setLoadingSummary(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [mealDate, retryCount]);

  const totalHeadCount = summary.reduce((sum, row) => sum + row.head_count, 0);
  const totalParcelCount = summary.reduce(
    (sum, row) => sum + row.parcel_count,
    0,
  );
  const totalAmount = summary.reduce((sum, row) => sum + row.total_amount, 0);
  const totalParcelAmount = summary.reduce(
    (sum, row) => sum + row.parcel_total,
    0,
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Meal headcount summary
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose a festival day to see headcount by meal, food type, and menu
            option.
          </Typography>
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            action={
              mealDate ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setErrorMessage("");
                    setLoadingSummary(true);
                    setRetryCount((count) => count + 1);
                  }}
                >
                  Retry
                </Button>
              ) : undefined
            }
          >
            {errorMessage}
          </Alert>
        )}

        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <FormControl fullWidth disabled={loadingDays || days.length === 0}>
            <InputLabel id="meal-summary-day-label">Festival day</InputLabel>
            <Select
              labelId="meal-summary-day-label"
              label="Festival day"
              value={mealDate}
              onChange={(event) => {
                setLoadingSummary(true);
                setErrorMessage("");
                setMealDate(event.target.value);
              }}
            >
              {days.map((day) => (
                <MenuItem key={day.meal_date} value={day.meal_date}>
                  {day.day_label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {loadingDays || loadingSummary ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : errorMessage ? null : summary.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">
              No meal orders have been placed for this day.
            </Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 760 }} aria-label="Meal headcount summary">
                <TableHead>
                  <TableRow>
                    <TableCell>Meal</TableCell>
                    <TableCell>Food type</TableCell>
                    <TableCell>Option</TableCell>
                    <TableCell>Menu details</TableCell>
                    <TableCell align="right">Head count</TableCell>
                    <TableCell align="right">Parcel count</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Parcel total</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.map((row) => (
                    <TableRow
                      key={`${row.meal}|${row.meal_type}|${row.option_code}`}
                    >
                      <TableCell>{row.meal}</TableCell>
                      <TableCell>{row.meal_type}</TableCell>
                      <TableCell>
                        {optionLabel(row.option_code) || "Standard"}
                      </TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell align="right">{row.head_count}</TableCell>
                      <TableCell align="right">{row.parcel_count}</TableCell>
                      <TableCell align="right">{row.order_count}</TableCell>
                      <TableCell align="right">
                        {formatPrice(row.price)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(row.parcel_total)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(row.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Paper sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ justifyContent: "space-between" }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  Total meal servings: {totalHeadCount}
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Total parcels: {totalParcelCount} (
                  {formatPrice(totalParcelAmount)})
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Day total: {formatPrice(totalAmount)}
                </Typography>
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
}
