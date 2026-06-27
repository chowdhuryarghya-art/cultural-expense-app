import {
  Button,
  Container,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

interface FinancialYear {
  id: number;
  name: string;
}

export default function EventForm() {
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);

  const [form, setForm] = useState({
    financial_year_id: "",
    name: "",
    description: "",
    event_date: "",
    budget: "",
    status: "PLANNED",
  });

  useEffect(() => {
    loadFinancialYears();
  }, []);

  const loadFinancialYears = async () => {
    const response = await api.get("/financial-years");
    setFinancialYears(response.data);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const saveEvent = async () => {
    if (!form.financial_year_id) {
    alert("Financial Year is required");
    return;
    }

    if (!form.name.trim()) {
    alert("Event Name is required");
    return;
    }

    if (!form.event_date) {
    alert("Event Date is required");
    return;
    }

    if (Number(form.budget) < 0) {
    alert("Budget cannot be negative");
    return;
    }    
    await api.post("/events", {
      ...form,
      financial_year_id: Number(form.financial_year_id),
      budget: Number(form.budget),
    });

    alert("Event created successfully");

    setForm({
      financial_year_id: "",
      name: "",
      description: "",
      event_date: "",
      budget: "",
      status: "PLANNED",
    });
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add Event
        </Typography>

        <TextField
          select
          fullWidth
          margin="normal"
          label="Financial Year"
          name="financial_year_id"
          value={form.financial_year_id}
          onChange={handleChange}
        >
          {financialYears.map((fy) => (
            <MenuItem key={fy.id} value={fy.id}>
              {fy.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          margin="normal"
          label="Event Name"
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          margin="normal"
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          type="date"
          margin="normal"
          name="event_date"
          value={form.event_date}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          type="number"
          margin="normal"
          label="Budget"
          name="budget"
          value={form.budget}
          onChange={handleChange}
        />

        <TextField
          select
          fullWidth
          margin="normal"
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <MenuItem value="PLANNED">
            Planned
          </MenuItem>

          <MenuItem value="ACTIVE">
            Active
          </MenuItem>

          <MenuItem value="COMPLETED">
            Completed
          </MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={saveEvent}
          sx={{ mt: 2 }}
        >
          Save Event
        </Button>
      </Paper>
    </Container>
  );
}