import {
  Box,
  Container,
  MenuItem,
  Paper,
  Select,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";
import EventReporting from "./EventReporting";

interface Event {
  id: number;
  name: string;
  budget?: number | string | null;
}

interface Expense {
  id: number;
  event_id: number;
  event_name: string;
  category: string;
  vendor: string;
  amount: number;
  expense_date: string;
  paid_by?: string;
  payment_mode?: string;
  notes?: string;
  bill_image_path?: string;
}

interface Summary {
  totalExpense: number;
  byCategory: {
    category: string;
    amount: string;
  }[];
}

interface Props {
  onEditExpense: (expense: any) => void;
}

export default function ExpenseDashboard({onEditExpense,}: Props) {

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalExpense: 0,
    byCategory: [],
  });

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [expenseToDelete, setExpenseToDelete] =
    useState<number | null>(null);

  const [viewDialogOpen, setViewDialogOpen] =
    useState(false);

  const [selectedExpense, setSelectedExpense] =
    useState<Expense | null>(null);    
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentError, setAttachmentError] = useState("");

  const selectedEventDetails = events.find(
    (event) => event.id === Number(selectedEvent),
  );

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadExpenses(selectedEvent);
      loadSummary(selectedEvent);
    }
  }, [selectedEvent]);

  useEffect(() => {
    const filePath = selectedExpense?.bill_image_path;
    if (!viewDialogOpen || !filePath) return;

    let isCurrent = true;
    let objectUrl = "";
    const normalizedPath = filePath.replaceAll("\\", "/").replace(/^\/+/, "");

    api
      .get(`/${normalizedPath}`, { responseType: "blob" })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        if (isCurrent) setAttachmentUrl(objectUrl);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isCurrent) setAttachmentError("Could not load this attachment");
      });

    return () => {
      isCurrent = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedExpense, viewDialogOpen]);

  const loadEvents = async () => {
    const response = await api.get<Event[]>("/events");

    setEvents(response.data);

    if (response.data.length > 0) {
      const durgaPuja = response.data.find((event) =>
        event.name.trim().toLowerCase().includes("durga puja"),
      );
      setSelectedEvent(
        (durgaPuja ?? response.data[0]).id.toString()
      );
    }
  };

  const loadExpenses = async (
    eventId: string | number
  ) => {
    const response = await api.get(
      `/expenses?eventId=${eventId}`
    );

    setExpenses(response.data);
  };

  const loadSummary = async (
    eventId: string | number
  ) => {
    const response = await api.get(
      `/expenses/summary?eventId=${eventId}`
    );

    setSummary(response.data);
  };

  const openDeleteDialog = (
    expenseId: number
  ) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const deleteExpense = async () => {
    if (!expenseToDelete) {
      return;
    }

    try {
      await api.delete(
        `/expenses/${expenseToDelete}`
      );

      await loadExpenses(selectedEvent);
      await loadSummary(selectedEvent);

      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Failed to delete expense"
      );

      setErrorOpen(true);
    }
  };

  const openViewDialog = (
    expense: Expense
  ) => {
    setSelectedExpense(expense);
    setAttachmentUrl("");
    setAttachmentError("");
    setViewDialogOpen(true);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mt: 3, mb: 3 }}>
        Expense Dashboard
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography>Select Event</Typography>

        <Select
          fullWidth
          value={selectedEvent}
          onChange={(e) =>
            setSelectedEvent(
              e.target.value as string
            )
          }
        >
          {events.map((event) => (
            <MenuItem
              key={event.id}
              value={event.id}
            >
              {event.name}
            </MenuItem>
          ))}
        </Select>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            Total Expense
          </Typography>

          <Typography variant="h4">
            ₹ {summary.totalExpense.toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Expense By Category
        </Typography>

        {summary.byCategory.map((item) => (
          <Typography key={item.category}>
            {item.category}: ₹{" "}
            {Number(item.amount).toLocaleString()}
          </Typography>
        ))}
      </Paper>

      {selectedEventDetails && (
        <EventReporting
          key={selectedEventDetails.id}
          event={selectedEventDetails}
        />
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Expenses
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">
                Amount
              </TableCell>
              <TableCell>Attachment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {new Date(
                    expense.expense_date
                  ).toLocaleDateString()}
                </TableCell>

                <TableCell>
                  {expense.vendor}
                </TableCell>

                <TableCell>
                  {expense.category}
                </TableCell>

                <TableCell align="right">
                  ₹{" "}
                  {Number(
                    expense.amount
                  ).toLocaleString()}
                </TableCell>
                <TableCell>
                  {expense.bill_image_path ? (
                    <Button
                      size="small"
                      onClick={() =>
                        openViewDialog(expense)
                      }
                    >
                      View
                    </Button>
                  ) : (
                    "-"
                  )}
                </TableCell>   

                <TableCell>

                  <Button
                    size="small"
                    onClick={() =>
                      onEditExpense(expense)
                    }
                  >
                    Edit
                  </Button>  

                  <Button
                    color="error"
                    size="small"
                    onClick={() =>
                      openDeleteDialog(
                        expense.id
                      )
                    }
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() =>
          setDeleteDialogOpen(false)
        }
      >
        <DialogTitle>
          Delete Expense
        </DialogTitle>

        <DialogContent>
          Are you sure you want to delete
          this expense?
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialogOpen(false)
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            onClick={deleteExpense}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={() =>
          setViewDialogOpen(false)
        }
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Attachment
        </DialogTitle>

        <DialogContent>
          {selectedExpense?.bill_image_path && (
            <>
              {attachmentError ? (
                <Alert severity="error">{attachmentError}</Alert>
              ) : !attachmentUrl ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">Loading attachment…</Typography>
                </Box>
              ) : selectedExpense.bill_image_path
                .toLowerCase()
                .endsWith(".pdf") ? (
                <iframe
                  src={attachmentUrl}
                  width="100%"
                  height="600px"
                  title="Expense receipt PDF"
                />
              ) : (
                <img
                  src={attachmentUrl}
                  alt="Receipt"
                  style={{
                    width: "100%",
                    maxHeight: "600px",
                    objectFit: "contain",
                  }}
                />
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setViewDialogOpen(false)
            }
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>      

      <Snackbar
        open={errorOpen}
        autoHideDuration={4000}
        onClose={() =>
          setErrorOpen(false)
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity="error"
          onClose={() =>
            setErrorOpen(false)
          }
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}