import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { useEffect, useState } from "react";
import api from "../api";

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

export default function UnpaidSubscriptions() {
  const [residents, setResidents] = useState<ResidentSubscription[]>([]);
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
  const unknownCount = residents.filter(
    (resident) => resident.paid === null,
  ).length;
  const reportResidents = eventConfigured ? unpaidResidents : residents;

  const exportReport = () => {
    const escapeCsvField = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Block", "Flat number", "Owner name", "Subscription status"],
      ...reportResidents.map((resident) => [
        resident.block,
        resident.flat_no,
        resident.owner_name ?? "",
        resident.paid === true
          ? "Paid"
          : resident.paid === false
            ? "Not paid"
            : "Not checked",
      ]),
    ];
    const csv = rows
      .map((row) => row.map(escapeCsvField).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = eventConfigured
      ? "unpaid-subscriptions.csv"
      : "subscription-status-not-configured.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
                Unpaid subscriptions
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Review subscription payment status for every active flat across
                all configured blocks.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportReport}
              disabled={loading || !!errorMessage || reportResidents.length === 0}
            >
              Export CSV
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
                  Not paid
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {eventConfigured ? unpaidResidents.length : "—"}
                </Typography>
              </Paper>
            </Stack>

            {residents.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                  No active flats are configured.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 650 }} aria-label="Unpaid subscriptions">
                  <TableHead>
                    <TableRow>
                      <TableCell>Block</TableCell>
                      <TableCell>Flat number</TableCell>
                      <TableCell>Owner name</TableCell>
                      <TableCell>Subscription status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportResidents.map((resident) => (
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
                                  ? "Not paid"
                                  : "Not checked"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {eventConfigured && unpaidResidents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          All active flats have a paid Subscription.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {eventConfigured && unknownCount > 0 && (
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
