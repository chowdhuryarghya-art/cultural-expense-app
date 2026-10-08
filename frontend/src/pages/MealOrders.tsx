import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

interface MealOrderItem {
  meal_date: string;
  day_label: string;
  meal: string;
  meal_type: string;
  option_code: string;
  description: string;
  price: number;
  head_count: number;
  line_total: number;
}

interface MealOrderRecord {
  id: string;
  block: string;
  flat_no: string;
  total_amount: number;
  created_at: string;
  items?: MealOrderItem[];
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function MealOrders() {
  const [orders, setOrders] = useState<MealOrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MealOrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;
    api
      .get<MealOrderRecord[]>("/meal-orders")
      .then((response) => {
        if (isCurrent) setOrders(response.data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load meal orders", error);
        if (isCurrent) {
          setErrorMessage("Could not load meal orders. Please try again.");
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const showDetails = async (order: MealOrderRecord) => {
    setDetailsLoading(true);
    setErrorMessage("");
    try {
      const response = await api.get<MealOrderRecord>(`/meal-orders/${order.id}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error("Failed to load meal order details", error);
      setErrorMessage("Could not load the selected order details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Meal orders
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All submitted orders are listed here. Open an order to see the
            selected meals and head counts.
          </Typography>
        </Box>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">No meal orders yet.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="All meal orders">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Block</TableCell>
                  <TableCell>Flat number</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Order total</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.block}</TableCell>
                    <TableCell>{order.flat_no}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => void showDetails(order)}
                        disabled={detailsLoading}
                      >
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        fullWidth
        maxWidth="md"
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Order #{selectedOrder.id} · Block {selectedOrder.block} · Flat{" "}
              {selectedOrder.flat_no}
            </DialogTitle>
            <DialogContent dividers>
              <TableContainer>
                <Table size="small" aria-label="Meal order details">
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Meal</TableCell>
                      <TableCell>Type / option</TableCell>
                      <TableCell>Menu details</TableCell>
                      <TableCell align="right">Head count</TableCell>
                      <TableCell align="right">Unit price</TableCell>
                      <TableCell align="right">Line total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedOrder.items ?? []).map((item, index) => (
                      <TableRow
                        key={`${item.meal_date}|${item.meal}|${item.option_code}|${index}`}
                      >
                        <TableCell>{item.day_label}</TableCell>
                        <TableCell>{item.meal}</TableCell>
                        <TableCell>
                          {item.meal_type} · {item.option_code}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.head_count}</TableCell>
                        <TableCell align="right">
                          {formatPrice(item.price)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice(item.line_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="h6" sx={{ mt: 2, textAlign: "right" }}>
                Order total: {formatPrice(selectedOrder.total_amount)}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
