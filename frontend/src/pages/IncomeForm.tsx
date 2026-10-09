import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

interface Event {
  id: number;
  name: string;
}

interface IncomeRecord {
  id: number;
  event_id: number;
  source: string;
  amount: number | string;
  income_date: string;
  received_from?: string | null;
  block?: string | null;
  flat_no?: string | null;
  payment_mode?: string | null;
  payment_status?: "Paid" | "Pending" | null;
  notes?: string | null;
}

interface IncomeFormProps {
  editingIncome: IncomeRecord | null;
  clearEditingIncome: () => void;
  onIncomeUpdated: () => void;
}

const incomeSources = ["Puja Donation", "Sponsorship", "Subscription"];

const emptyForm = {
  event_id: "",
  source: "",
  amount: "",
  income_date: "",
  received_from: "",
  block: "",
  flat_no: "",
  payment_mode: "",
  payment_status: "",
  notes: "",
};

const getFormForIncome = (income: IncomeRecord | null) => {
  if (!income) return emptyForm;

  return {
    event_id: income.event_id.toString(),
    source: income.source,
    amount: income.amount.toString(),
    income_date: income.income_date.split("T")[0],
    received_from: income.received_from ?? "",
    block: income.block ?? "",
    flat_no: income.flat_no ?? "",
    payment_mode: income.payment_mode ?? "",
    payment_status: income.payment_status ?? "",
    notes: income.notes ?? "",
  };
};

export default function IncomeForm({
  editingIncome,
  clearEditingIncome,
  onIncomeUpdated,
}: IncomeFormProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState(() => getFormForIncome(editingIncome));
  const [errors, setErrors] = useState({
    event_id: "",
    source: "",
    received_from: "",
    amount: "",
    income_date: "",
    payment_status: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadEvents = async () => {
      try {
        const response = await api.get<Event[]>("/events");
        if (isCurrent) setEvents(response.data);
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === "source" && value !== "Puja Donation"
        ? { payment_status: "" }
        : {}),
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      ...(name === "source" && value !== "Puja Donation"
        ? { payment_status: "" }
        : {}),
    }));
  };

  const saveIncome = async () => {
    const newErrors = {
      event_id: form.event_id ? "" : "Event is required",
      source: form.source ? "" : "Source is required",
      payment_status:
        form.source !== "Puja Donation" || form.payment_status
          ? ""
          : "Payment status is required for Puja Donation",
      received_from: form.received_from.trim()
        ? ""
        : "Received from is required",
      amount:
        Number(form.amount) > 0
          ? ""
          : "Amount must be greater than zero",
      income_date: form.income_date ? "" : "Income date is required",
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    const payload = {
      ...form,
      amount: Number(form.amount),
      event_id: Number(form.event_id),
      received_from: form.received_from.trim(),
      block: form.block.trim() || null,
      flat_no: form.flat_no.trim() || null,
      payment_status:
        form.source === "Puja Donation"
          ? form.payment_status
          : form.source === "Sponsorship" || form.source === "Subscription"
            ? "Paid"
            : null,
    };

    try {
      if (editingIncome) {
        await api.put(`/income/${editingIncome.id}`, payload);
        setSuccessMessage("Income updated successfully");
        clearEditingIncome();
        window.setTimeout(onIncomeUpdated, 1000);
      } else {
        await api.post("/income", payload);
        setSuccessMessage("Income saved successfully");
      }
      setForm(emptyForm);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        editingIncome ? "Failed to update income" : "Failed to save income",
      );
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {editingIncome ? "Edit income" : "Add income"}
        </Typography>

        <TextField
          select
          fullWidth
          margin="normal"
          label="Event"
          name="event_id"
          value={form.event_id}
          onChange={handleChange}
          error={!!errors.event_id}
          helperText={errors.event_id}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id.toString()}>
              {event.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          margin="normal"
          label="Source"
          name="source"
          value={form.source}
          onChange={handleChange}
          error={!!errors.source}
          helperText={errors.source}
        >
          {form.source && !incomeSources.includes(form.source) && (
            <MenuItem value={form.source}>
              {form.source} (existing record)
            </MenuItem>
          )}
          {incomeSources.map((source) => (
            <MenuItem key={source} value={source}>
              {source}
            </MenuItem>
          ))}
        </TextField>

        {form.source === "Puja Donation" && (
          <TextField
            select
            fullWidth
            margin="normal"
            label="Payment status"
            name="payment_status"
            value={form.payment_status}
            onChange={handleChange}
            error={!!errors.payment_status}
            helperText={errors.payment_status}
          >
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </TextField>
        )}

        <TextField
          fullWidth
          margin="normal"
          label="Received from"
          name="received_from"
          value={form.received_from}
          onChange={handleChange}
          error={!!errors.received_from}
          helperText={errors.received_from}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            margin="normal"
            label="Block"
            name="block"
            value={form.block}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Flat No."
            name="flat_no"
            value={form.flat_no}
            onChange={handleChange}
          />
        </Box>

        <TextField
          fullWidth
          margin="normal"
          type="number"
          label="Amount"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          error={!!errors.amount}
          helperText={errors.amount}
          slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        />

        <TextField
          fullWidth
          type="date"
          margin="normal"
          label="Income date"
          name="income_date"
          value={form.income_date}
          onChange={handleChange}
          error={!!errors.income_date}
          helperText={errors.income_date}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          select
          fullWidth
          margin="normal"
          label="Payment mode"
          name="payment_mode"
          value={form.payment_mode}
          onChange={handleChange}
        >
          <MenuItem value="Cash">Cash</MenuItem>
          <MenuItem value="Cheque">Cheque</MenuItem>
          <MenuItem value="NEFT">NEFT</MenuItem>
        </TextField>

        <TextField
          fullWidth
          multiline
          rows={3}
          margin="normal"
          label="Description"
          name="notes"
          value={form.notes}
          onChange={handleChange}
        />

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={saveIncome}>
            {editingIncome ? "Update income" : "Save income"}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      </Snackbar>
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
