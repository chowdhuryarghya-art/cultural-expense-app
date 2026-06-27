import {
  Button,
  Container,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

interface Event {
  id: number;
  name: string;
}

interface IncomeFormProps {
  editingIncome: any;
  clearEditingIncome: () => void;
  onIncomeUpdated: () => void;
}

export default function IncomeForm({
  editingIncome,
  clearEditingIncome,
  onIncomeUpdated,
}: IncomeFormProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);

    const [errors, setErrors] = useState({
        event_id: "",
        source: "",
        received_by: "",
        amount: "",
        income_date: "",
    });

    const [form, setForm] = useState({
        event_id: "",
        source: "",
        amount: "",
        income_date: "",
        received_by: "",
        payment_mode: "",
        notes: "",
    });


  const [successMessage, setSuccessMessage] =
  useState("");

  useEffect(() => {
    loadEvents();
  }, []);

useEffect(() => {
  if (!editingIncome) {
    return;
  }

    setForm({
        event_id:
            editingIncome.event_id?.toString() || "",
        source:
            editingIncome.source || "",
        amount:
            editingIncome.amount?.toString() || "",
        income_date:
            editingIncome.income_date
            ?.split("T")[0] || "",
        received_by:
            editingIncome.received_by || "",
        payment_mode:
            editingIncome.payment_mode || "",
        notes:
            editingIncome.notes || "",
    });
}, [editingIncome]);  

  const loadEvents = async () => {
    const response = await api.get("/events");
    setEvents(response.data);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

    const incomeSources = [
        "Sponsorship",
        "Donation",
        "Ticket Sales",
        "Membership",
        "Advertisement",
        "Misc",
    ];

  const saveIncome = async () => {

    const newErrors = {
      event_id: "",
      source: "",
      received_by: "",
      amount: "",
      income_date: "",
    };

    if (!form.event_id) {
      newErrors.event_id = "Event is required";
    }

    if (!form.source) {
      newErrors.source = "Source is required";
    }

    if (!form.received_by.trim()) {
      newErrors.received_by = "Received By is required";
    }

    if (!form.income_date) {
      newErrors.income_date = "Income Date is required";
    }

    if (Number(form.amount) <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }    

    setErrors(newErrors);
    if (
      Object.values(newErrors).some(
        (error) => error !== ""
      )
    ) {
      return;
    }    

    const payload = {
      ...form,
      amount: Number(form.amount),
      event_id: Number(form.event_id)
    };

    const wasEditing = !!editingIncome;

    if (editingIncome) {
      await api.put(
        `/income/${editingIncome.id}`,
        payload
      );
    } else {
      await api.post(
        "/income",
        payload
      );
    }

    setSuccessMessage(
      editingIncome
        ? "Income updated successfully"
        : "Income saved successfully"
    );    

    setSuccessOpen(true);

    if (wasEditing) {
      clearEditingIncome();

      setTimeout(() => {
        onIncomeUpdated();
      }, 1000);
    }

    setForm({
        event_id: "",
        source: "",
        amount: "",
        income_date: "",
        received_by: "",
        payment_mode: "",
        notes: "",
    });

  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {editingIncome
          ? "Edit Income"
          : "Add Income"}
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
            <MenuItem
              key={event.id}
              value={event.id}
            >
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
        {incomeSources.map((source) => (
        <MenuItem key={source} value={source}>
            {source}
        </MenuItem>
        ))}
        </TextField>        

        <TextField
          fullWidth
          margin="normal"
          label="Received By"
          name="received_by"
          value={form.received_by}
          onChange={handleChange}
          error={!!errors.received_by}
          helperText={errors.received_by}
        />

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
        />

        <TextField
          fullWidth
          margin="normal"
          type="date"
          name="income_date"
          value={form.income_date}
          onChange={handleChange}
          error={!!errors.income_date}
          helperText={errors.income_date}          
        />

        <TextField
          select
          fullWidth
          margin="normal"
          label="Payment Mode"
          name="payment_mode"
          value={form.payment_mode}
          onChange={handleChange}
        >
          <MenuItem value="Cash">Cash</MenuItem>
          <MenuItem value="UPI">UPI</MenuItem>
          <MenuItem value="Bank Transfer">
            Bank Transfer
          </MenuItem>
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
          
          <Button
            variant="contained"
            onClick={saveIncome}
          >
            {editingIncome
              ? "Update Income"
              : "Save Income"}
          </Button>
        </Stack>

      </Paper>
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccessOpen(false)}
        >
          {successMessage}
        </Alert>
      </Snackbar>      
    </Container>
  );
  
}