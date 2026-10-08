import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";
import EventReporting from "./EventReporting";

interface Event {
  id: number;
  name: string;
  event_date: string;
  budget: number | string | null;
  financial_year_name?: string;
}

interface Income {
  id: number;
  event_id: number;
  event_name: string;
  source: string;
  amount: number;
  income_date: string;
  received_from?: string;
  block?: string;
  flat_no?: string;
  payment_mode?: string;
  payment_status?: "Paid" | "Pending" | null;
  notes?: string;
}

interface IncomeSummary {
  totalIncome: number;
  bySource: { source: string; amount: string }[];
}

interface ExpenseSummary {
  totalExpense: number;
  byCategory: { category: string; amount: string }[];
}

interface Props {
  onEditIncome: (income: Income) => void;
  onBulkUpload: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function IncomeDashboard({
  onEditIncome,
  onBulkUpload,
}: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loadedEventId, setLoadedEventId] = useState("");
  const [income, setIncome] = useState<Income[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary>({
    totalIncome: 0,
    bySource: [],
  });
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalExpense: 0,
    byCategory: [],
  });
  const [failedEventId, setFailedEventId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [incomeToDelete, setIncomeToDelete] = useState<number | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [incomePage, setIncomePage] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    const loadEvents = async () => {
      try {
        const response = await api.get<Event[]>("/events");
        if (!isCurrent) return;

        setEvents(response.data);
        setSelectedEvent((current) => {
          if (current && response.data.some((event) => event.id === Number(current))) {
            return current;
          }
          const durgaPuja = response.data.find((event) =>
            event.name.trim().toLowerCase().includes("durga puja"),
          );
          return durgaPuja?.id.toString() ?? response.data[0]?.id.toString() ?? "";
        });
      } catch (error) {
        console.error(error);
        if (isCurrent) setErrorMessage("Failed to load events");
      }
    };

    void loadEvents();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    let isCurrent = true;
    const query = `?eventId=${selectedEvent}`;

    const loadDashboard = async () => {
      try {
        const [incomeResponse, incomeSummaryResponse, expenseSummaryResponse] =
          await Promise.all([
            api.get<Income[]>(`/income${query}`),
            api.get<IncomeSummary>(`/income/summary${query}`),
            api.get<ExpenseSummary>(`/expenses/summary${query}`),
          ]);

        if (!isCurrent) return;
        setIncome(incomeResponse.data);
        setIncomeSummary(incomeSummaryResponse.data);
        setExpenseSummary(expenseSummaryResponse.data);
        setLoadedEventId(selectedEvent);
        setFailedEventId("");
      } catch (error) {
        console.error(error);
        if (isCurrent) {
          setFailedEventId(selectedEvent);
          setErrorMessage("Failed to load event financial summary");
        }
      }
    };

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [selectedEvent, refreshKey]);

  const deleteIncome = async () => {
    if (incomeToDelete === null) return;

    try {
      await api.delete(`/income/${incomeToDelete}`);
      setIncomeToDelete(null);
      setRefreshKey((previous) => previous + 1);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to delete income");
    }
  };

  const selectedEventDetails = events.find(
    (event) => event.id === Number(selectedEvent),
  );
  const currentDataLoaded = loadedEventId === selectedEvent;
  const loading =
    !!selectedEvent &&
    !currentDataLoaded &&
    failedEventId !== selectedEvent;
  const visibleIncome = currentDataLoaded ? income : [];
  const incomeSources = [...new Set(visibleIncome.map((item) => item.source))]
    .sort((first, second) => first.localeCompare(second));
  const filteredIncome =
    sourceFilter === "all"
      ? visibleIncome
      : visibleIncome.filter((item) => item.source === sourceFilter);
  const pageCount = Math.max(1, Math.ceil(filteredIncome.length / 20));
  const currentIncomePage = Math.min(incomePage, pageCount - 1);
  const paginatedIncome = filteredIncome.slice(
    currentIncomePage * 20,
    currentIncomePage * 20 + 20,
  );
  const visibleIncomeSources = currentDataLoaded ? incomeSummary.bySource : [];
  const visibleExpenseCategories = currentDataLoaded
    ? expenseSummary.byCategory
    : [];
  const totalIncome = currentDataLoaded
    ? Number(incomeSummary.totalIncome) || 0
    : 0;
  const totalExpense = currentDataLoaded
    ? Number(expenseSummary.totalExpense) || 0
    : 0;
  const netBalance = totalIncome - totalExpense;
  const hasBudget =
    selectedEventDetails?.budget !== null &&
    selectedEventDetails?.budget !== undefined &&
    selectedEventDetails.budget !== "";
  const budget = Number(selectedEventDetails?.budget) || 0;

  const summaryItems = [
    {
      label: "Event budget",
      value: hasBudget ? formatCurrency(budget) : "Not set",
      tone: "default",
    },
    {
      label: "Total income",
      value: currentDataLoaded ? formatCurrency(totalIncome) : "—",
      tone: "success",
    },
    {
      label: "Total expenses",
      value: currentDataLoaded ? formatCurrency(totalExpense) : "—",
      tone: "warning",
    },
    {
      label: "Net balance",
      value: currentDataLoaded ? formatCurrency(netBalance) : "—",
      tone: netBalance >= 0 ? "success" : "error",
    },
  ] as const;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Income &amp; event finances
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Track contributions and see where your event stands.
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
          }}
        >
          <Button variant="contained" onClick={onBulkUpload}>
            Bulk upload income
          </Button>
          <Select
            aria-label="Select event"
            value={selectedEvent}
            onChange={(event) => {
              setFailedEventId("");
              setSourceFilter("all");
              setIncomePage(0);
              setSelectedEvent(event.target.value);
            }}
            displayEmpty
            sx={{ minWidth: { xs: "100%", sm: 240 }, bgcolor: "background.paper" }}
          >
            {events.length === 0 && <MenuItem value="">No events available</MenuItem>}
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id.toString()}>
                {event.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {selectedEventDetails && (
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedEventDetails.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedEventDetails.financial_year_name ?? "Event financial summary"}
                {selectedEventDetails.event_date
                  ? ` · ${formatDate(selectedEventDetails.event_date)}`
                  : ""}
              </Typography>
            </Box>
            <Chip
              label={
                currentDataLoaded
                  ? netBalance >= 0
                    ? "In surplus"
                    : "In deficit"
                  : loading
                    ? "Loading"
                    : "Unavailable"
              }
              color={
                currentDataLoaded
                  ? netBalance >= 0
                    ? "success"
                    : "error"
                  : "default"
              }
              variant="outlined"
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 2,
            }}
          >
            {summaryItems.map((item) => (
              <Card key={item.label} variant="outlined">
                <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    color={item.tone === "default" ? "text.primary" : `${item.tone}.main`}
                    sx={{ mt: 1, fontWeight: 700, overflowWrap: "anywhere" }}
                  >
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {currentDataLoaded
              ? `Net balance is income minus expenses. ${
                  hasBudget
                    ? `Budget remaining is ${formatCurrency(budget - totalExpense)}.`
                    : "No event budget has been set."
                }`
              : loading
                ? "Loading event financial data…"
                : "Financial data is currently unavailable."}
          </Typography>
        </Paper>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Income by source
          </Typography>
          {visibleIncomeSources.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              {currentDataLoaded
                ? "No income recorded for this event yet."
                : loading
                  ? "Loading income sources…"
                  : "Income sources are unavailable."}
            </Typography>
          ) : (
            visibleIncomeSources.map((item) => (
              <Box
                key={item.source}
                sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}
              >
                <Typography>{item.source}</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatCurrency(Number(item.amount) || 0)}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Expenses by category
          </Typography>
          {visibleExpenseCategories.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              {currentDataLoaded
                ? "No expenses recorded for this event yet."
                : loading
                  ? "Loading expense categories…"
                  : "Expense categories are unavailable."}
            </Typography>
          ) : (
            visibleExpenseCategories.map((item) => (
              <Box
                key={item.category}
                sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}
              >
                <Typography>{item.category}</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatCurrency(Number(item.amount) || 0)}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      </Box>

      {selectedEventDetails && (
        <EventReporting
          key={selectedEventDetails.id}
          event={selectedEventDetails}
        />
      )}

      <Paper sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            p: 2.5,
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Income transactions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredIncome.length}{" "}
              {filteredIncome.length === 1 ? "record" : "records"}
              {sourceFilter !== "all" ? ` · ${sourceFilter}` : ""}
            </Typography>
          </Box>
          <Select
            size="small"
            aria-label="Filter income by source"
            value={sourceFilter}
            onChange={(event) => {
              setSourceFilter(event.target.value);
              setIncomePage(0);
            }}
            sx={{ minWidth: { xs: "100%", sm: 220 } }}
          >
            <MenuItem value="all">All sources</MenuItem>
            {incomeSources.map((source) => (
              <MenuItem key={source} value={source}>
                {source}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Payment status</TableCell>
                <TableCell>Received from</TableCell>
                <TableCell>Block</TableCell>
                <TableCell>Flat No.</TableCell>
                <TableCell>Payment mode</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedIncome.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={
                    item.payment_status === "Paid"
                      ? {
                          bgcolor: "rgba(46, 125, 50, 0.16)",
                          "&:hover": { bgcolor: "rgba(46, 125, 50, 0.24)" },
                        }
                      : undefined
                  }
                >
                  <TableCell>{formatDate(item.income_date)}</TableCell>
                  <TableCell>{item.source}</TableCell>
                  <TableCell>
                    {item.source === "Puja Donation" ? (
                      <Chip
                        size="small"
                        label={item.payment_status ?? "Not set"}
                        color={
                          item.payment_status === "Paid"
                            ? "success"
                            : item.payment_status === "Pending"
                              ? "warning"
                              : "default"
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{item.received_from || "—"}</TableCell>
                  <TableCell>{item.block || "—"}</TableCell>
                  <TableCell>{item.flat_no || "—"}</TableCell>
                  <TableCell>{item.payment_mode || "—"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(Number(item.amount) || 0)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button size="small" onClick={() => setSelectedIncome(item)}>
                      Details
                    </Button>
                    <Button size="small" onClick={() => onEditIncome(item)}>
                      Edit
                    </Button>
                    <Button
                      color="error"
                      size="small"
                      onClick={() => setIncomeToDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && currentDataLoaded && filteredIncome.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      {sourceFilter === "all"
                        ? "No income recorded for this event yet."
                        : `No income recorded for ${sourceFilter}.`}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && !currentDataLoaded && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      Income transactions are unavailable.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">Loading transactions…</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={filteredIncome.length}
          page={currentIncomePage}
          onPageChange={(_, page) => setIncomePage(page)}
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
          labelRowsPerPage="Records per page"
        />
      </Paper>

      <Dialog
        open={selectedIncome !== null}
        onClose={() => setSelectedIncome(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Income details</DialogTitle>
        <DialogContent dividers>
          {selectedIncome && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                py: 0.5,
              }}
            >
              {[
                ["Event", selectedIncome.event_name],
                ["Source", selectedIncome.source],
                ...(selectedIncome.source === "Puja Donation"
                  ? [["Payment status", selectedIncome.payment_status ?? "Not set"]]
                  : []),
                ["Amount", formatCurrency(Number(selectedIncome.amount) || 0)],
                ["Date received", formatDate(selectedIncome.income_date)],
                ["Received from", selectedIncome.received_from || "Not specified"],
                ["Block", selectedIncome.block || "Not specified"],
                ["Flat No.", selectedIncome.flat_no || "Not specified"],
                ["Payment mode", selectedIncome.payment_mode || "Not specified"],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
                </Box>
              ))}
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography>{selectedIncome.notes || "No notes added."}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedIncome(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={incomeToDelete !== null}
        onClose={() => setIncomeToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete income record?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This record will be removed from the event totals.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIncomeToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteIncome}>
            Delete record
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={5000}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" onClose={() => setErrorMessage("")}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
