import {
  Alert,
  Box,
  Button,
  Chip,
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
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { useEffect, useState } from "react";
import api from "../api";
import { createWorkbookBytes, downloadBlob } from "../utils/excel";

interface ResidentSubscription {
  block: string;
  flat_no: string;
  owner_name: string | null;
  paid: boolean | null;
}

interface SubscriptionStatusResponse {
  eventConfigured: boolean;
  residents: ResidentSubscription[];
}

interface ApiErrorResponse {
  error?: string;
}

type PaymentStatusFilter = "all" | "paid" | "unpaid";

export default function UnpaidSubscriptions() {
  const [residents, setResidents] = useState<ResidentSubscription[]>([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusFilter>("all");
  const [eventConfigured, setEventConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    api
      .get<SubscriptionStatusResponse>("/meal-orders/subscription-status")
      .then((response) => {
        if (!isCurrent) return;
        setResidents(response.data.residents);
        setEventConfigured(response.data.eventConfigured);
      })
      .catch((error: unknown) => {
        console.error("Failed to load unpaid resident subscriptions", error);
        if (isCurrent) {
          setErrorMessage(
            axios.isAxiosError<ApiErrorResponse>(error)
              ? error.response?.data?.error ??
                  "Could not load resident subscription statuses. Please try again."
              : "Could not load resident subscription statuses. Please try again.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  const paidCount = residents.filter((resident) => resident.paid === true).length;
  const unpaidResidents = residents.filter(
    (resident) => resident.paid === false,
  );
  const blocks = [...new Set(residents.map((resident) => resident.block))].sort(
    (first, second) => first.localeCompare(second),
  );
  const flats = residents
    .filter((resident) => !selectedBlock || resident.block === selectedBlock)
    .map((resident) => resident.flat_no)
    .sort((first, second) => first.localeCompare(second));
  const filteredResidents = residents.filter((resident) => {
    if (selectedBlock && resident.block !== selectedBlock) return false;
    if (selectedFlat && resident.flat_no !== selectedFlat) return false;
    if (paymentStatus === "paid" && resident.paid !== true) return false;
    if (paymentStatus === "unpaid" && resident.paid !== false) return false;
    return true;
  });
  const unknownCount = filteredResidents.filter(
    (resident) => resident.paid === null,
  ).length;

  const exportReport = () => {
    const workbook = createWorkbookBytes([
      {
        name: "Subscriptions",
        rows: [
          ["Block", "Flat number", "Owner name", "Payment status"],
          ...filteredResidents.map((resident) => [
            resident.block,
            resident.flat_no,
            resident.owner_name ?? "",
            resident.paid === true
              ? "Paid"
              : resident.paid === false
                ? "Unpaid"
                : "Not checked",
          ]),
        ],
      },
    ]);
    const file = new Blob([workbook], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(file, "subscriptions.xlsx");
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              justifyContent: "space-between",
              alignItems: { sm: "center" },
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Subscriptions
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Review paid and unpaid subscription status across all configured
                blocks.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportReport}
              disabled={loading || !!errorMessage || filteredResidents.length === 0}
            >
              Export XLSX
            </Button>
          </Stack>
        </Box>

        {!eventConfigured && !loading && !errorMessage && (
          <Alert severity="warning">
            The subscription event is not configured. Add the Durgotsav event
            ID to{" "}
            <strong>cultural.meal_order_settings.subscription_event_id</strong>{" "}
            to check payment status.
          </Alert>
        )}

        {errorMessage && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setLoading(true);
                  setErrorMessage("");
                  setRetryCount((count) => count + 1);
                }}
              >
                Retry
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}

        {!loading && !errorMessage && (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Paper sx={{ flex: 1, p: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Active flats
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {residents.length}
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Paid
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {eventConfigured ? paidCount : "—"}
                </Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Unpaid
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {eventConfigured ? unpaidResidents.length : "—"}
                </Typography>
              </Paper>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { sm: "center" } }}
            >
              <FormControl fullWidth>
                <InputLabel id="subscription-block-label">Block</InputLabel>
                <Select
                  labelId="subscription-block-label"
                  label="Block"
                  value={selectedBlock}
                  onChange={(event) => {
                    setSelectedBlock(event.target.value);
                    setSelectedFlat("");
                  }}
                >
                  <MenuItem value="">All blocks</MenuItem>
                  {blocks.map((block) => (
                    <MenuItem key={block} value={block}>
                      {block}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="subscription-flat-label">Flat</InputLabel>
                <Select
                  labelId="subscription-flat-label"
                  label="Flat"
                  value={selectedFlat}
                  onChange={(event) => setSelectedFlat(event.target.value)}
                >
                  <MenuItem value="">All flats</MenuItem>
                  {[...new Set(flats)].map((flat) => (
                    <MenuItem key={flat} value={flat}>
                      {flat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="subscription-payment-status-label">
                  Payment status
                </InputLabel>
                <Select
                  labelId="subscription-payment-status-label"
                  label="Payment status"
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target.value as PaymentStatusFilter,
                    )
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {residents.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                  No active flats are configured.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 650 }} aria-label="Subscriptions">
                  <TableHead>
                    <TableRow>
                      <TableCell>Block</TableCell>
                      <TableCell>Flat number</TableCell>
                      <TableCell>Owner name</TableCell>
                      <TableCell>Payment status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResidents.map((resident) => (
                      <TableRow
                        key={`${resident.block}-${resident.flat_no}`}
                        hover
                      >
                        <TableCell>{resident.block}</TableCell>
                        <TableCell>{resident.flat_no}</TableCell>
                        <TableCell>{resident.owner_name || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={
                              resident.paid === true
                                ? "success"
                                : resident.paid === false
                                  ? "error"
                                  : "default"
                            }
                            label={
                              resident.paid === true
                                ? "Paid"
                                : resident.paid === false
                                  ? "Unpaid"
                                  : "Not checked"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredResidents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No subscriptions match the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {!eventConfigured && unknownCount > 0 && (
              <Typography variant="body2" color="text.secondary">
                {unknownCount} flat{unknownCount === 1 ? " has" : "s have"}{" "}
                unknown payment status.
              </Typography>
            )}
          </>
        )}

        {loading && (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}
      </Stack>
    </Container>
  );
}
