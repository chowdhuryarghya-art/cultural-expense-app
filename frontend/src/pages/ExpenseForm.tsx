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

interface ExpenseFormProps {
  editingExpense: any;
  clearEditingExpense: () => void;
  onExpenseUpdated: () => void;
}

export default function ExpenseForm({
  editingExpense,
  clearEditingExpense,
  onExpenseUpdated,
}: ExpenseFormProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);

  const [errors, setErrors] = useState({
    event_id: "",
    category: "",
    vendor: "",
    amount: "",
    expense_date: "",
  });  

  const [form, setForm] = useState({
    event_id: "",
    category: "",
    vendor: "",
    amount: "",
    expense_date: "",
    paid_by: "",
    payment_mode: "",
    notes: "",
  });

  const [selectedFile, setSelectedFile] =
  useState<File | null>(null);  

  const [successMessage, setSuccessMessage] =
  useState("");

  useEffect(() => {
    loadEvents();
  }, []);

useEffect(() => {
  if (!editingExpense) {
    return;
  }

  setForm({
    event_id:
      editingExpense.event_id?.toString() || "",
    category:
      editingExpense.category || "",
    vendor:
      editingExpense.vendor || "",
    amount:
      editingExpense.amount?.toString() || "",
    expense_date:
      editingExpense.expense_date
        ?.split("T")[0] || "",
    paid_by:
      editingExpense.paid_by || "",
    payment_mode:
      editingExpense.payment_mode || "",
    notes:
      editingExpense.notes || "",
  });
}, [editingExpense]);  

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

  const saveExpense = async () => {

    const newErrors = {
      event_id: "",
      category: "",
      vendor: "",
      amount: "",
      expense_date: "",
    };

    if (!form.event_id) {
      newErrors.event_id = "Event is required";
    }

    if (!form.category) {
      newErrors.category = "Category is required";
    }

    if (!form.vendor.trim()) {
      newErrors.vendor = "Paid To is required";
    }

    if (!form.expense_date) {
      newErrors.expense_date = "Expense Date is required";
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

    let billImagePath = null;

    if (selectedFile) {
      const formData = new FormData();

      formData.append(
        "bill",
        selectedFile
      );

      const uploadResponse =
        await api.post(
          "/expenses/upload",
          formData
        );

      billImagePath =
        uploadResponse.data.path;
    }    

    const payload = {
      ...form,
      amount: Number(form.amount),
      event_id: Number(form.event_id),
      bill_image_path: billImagePath,
    };

    const wasEditing = !!editingExpense;

    if (editingExpense) {
      await api.put(
        `/expenses/${editingExpense.id}`,
        payload
      );
    } else {
      await api.post(
        "/expenses",
        payload
      );
    }

    setSuccessMessage(
      editingExpense
        ? "Expense updated successfully"
        : "Expense saved successfully"
    );    

    setSuccessOpen(true);

    if (wasEditing) {
      clearEditingExpense();

      setTimeout(() => {
        onExpenseUpdated();
      }, 1000);
    }

    setForm({
      event_id: "",
      category: "",
      vendor: "",
      amount: "",
      expense_date: "",
      paid_by: "",
      payment_mode: "",
      notes: "",
    });
    setSelectedFile(null);
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {editingExpense
          ? "Edit Expense"
          : "Add Expense"}
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
          label="Category"
          name="category"
          value={form.category}
          onChange={handleChange}
          error={!!errors.category}
          helperText={errors.category}
        >
          <MenuItem value="Food">Food</MenuItem>
          <MenuItem value="Decoration">
            Decoration
          </MenuItem>
          <MenuItem value="Sound">Sound</MenuItem>
          <MenuItem value="Printing">Printing</MenuItem>
          <MenuItem value="Misc">
            Miscellaneous
          </MenuItem>
        </TextField>

        <TextField
          fullWidth
          margin="normal"
          label="Paid To"
          name="vendor"
          value={form.vendor}
          onChange={handleChange}
          error={!!errors.vendor}
          helperText={errors.vendor}
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
          name="expense_date"
          value={form.expense_date}
          onChange={handleChange}
          error={!!errors.expense_date}
          helperText={errors.expense_date}          
        />

        <TextField
          fullWidth
          margin="normal"
          label="Paid By"
          name="paid_by"
          value={form.paid_by}
          onChange={handleChange}
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
            variant="outlined"
            component="label"
          >
            Upload Bill / Receipt
            <input
              hidden
              type="file"
              accept=".pdf,image/*"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files?.[0] || null
                )
              }
            />
          </Button>

          <Button
            variant="contained"
            onClick={saveExpense}
          >
            {editingExpense
              ? "Update Expense"
              : "Save Expense"}
          </Button>
        </Stack>

      {selectedFile && (
        <Typography
          variant="body2"
          sx={{ mt: 1 }}
        >
          Selected File: {selectedFile.name}
        </Typography>
      )}

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