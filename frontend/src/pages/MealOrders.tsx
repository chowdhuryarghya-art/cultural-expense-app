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
import { useEffect, useState } from "react";
import api from "../api";
import MealOrderReceipt from "../components/MealOrderReceipt";

interface MealOrderItem {
  meal_date: string;
  day_label: string;
  meal: "Breakfast" | "Lunch" | "Dinner";
  meal_type: "Veg" | "Non-Veg";
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

interface MealOrderWithItems extends Omit<MealOrderRecord, "items"> {
  items: MealOrderItem[];
}

interface MealOrdersProps {
  onEditOrder: (order: MealOrderWithItems) => void;
}

interface BlockOption {
  id: number;
  name: string;
}

interface FlatOption {
  id: number;
  flat_no: string;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function MealOrders({ onEditOrder }: MealOrdersProps) {
  const [orders, setOrders] = useState<MealOrderRecord[]>([]);
  const [blocks, setBlocks] = useState<BlockOption[]>([]);
  const [flats, setFlats] = useState<FlatOption[]>([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
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

  useEffect(() => {
    let isCurrent = true;
    api
      .get<BlockOption[]>("/meal-orders/residents")
      .then((response) => {
        if (isCurrent) setBlocks(response.data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load blocks for meal order filters", error);
        if (isCurrent) {
          setErrorMessage("Could not load blocks for filtering meal orders.");
        }
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedBlock) return;

    const block = blocks.find((option) => option.name === selectedBlock);
    if (!block) return;

    let isCurrent = true;
    api
      .get<FlatOption[]>(`/meal-orders/residents/${block.id}/flats`)
      .then((response) => {
        if (isCurrent) setFlats(response.data);
      })
      .catch((error: unknown) => {
        console.error("Failed to load flats for meal order filters", error);
        if (isCurrent) {
          setErrorMessage("Could not load flats for the selected block.");
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [blocks, selectedBlock]);

  const filteredOrders = orders.filter(
    (order) =>
      (!selectedBlock || order.block === selectedBlock) &&
      (!selectedFlat || order.flat_no === selectedFlat),
  );

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
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Filter by block"
                value={selectedBlock}
                onChange={(event) => {
                  setSelectedBlock(event.target.value);
                  setSelectedFlat("");
                  setFlats([]);
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All blocks</MenuItem>
                {blocks.map((block) => (
                  <MenuItem key={block.id} value={block.name}>
                    {block.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Filter by flat"
                value={selectedFlat}
                onChange={(event) => setSelectedFlat(event.target.value)}
                disabled={!selectedBlock}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All flats</MenuItem>
                {flats.map((flat) => (
                  <MenuItem key={flat.id} value={flat.flat_no}>
                    {flat.flat_no}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            {orders.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">No meal orders yet.</Typography>
              </Paper>
            ) : filteredOrders.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                  No orders match the selected block and flat.
                </Typography>
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
                    {filteredOrders.map((order) => (
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
          </>
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
              {selectedOrder.items && (
                <MealOrderReceipt
                  order={{
                    ...selectedOrder,
                    items: selectedOrder.items,
                  }}
                />
              )}
              <Button
                onClick={() => {
                  if (selectedOrder.items) {
                    onEditOrder({
                      ...selectedOrder,
                      items: selectedOrder.items,
                    });
                  }
                  setSelectedOrder(null);
                }}
                disabled={!selectedOrder.items}
              >
                Edit order
              </Button>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}
