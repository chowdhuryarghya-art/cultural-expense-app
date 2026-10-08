import {
  Alert,
  Button,
  Container,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

interface FinancialYear {
  id: number;
  name: string;
}

interface EventRecord {
  id: number;
  financial_year_id: number;
  name: string;
  description?: string | null;
  event_date: string;
  budget: number | string | null;
  status?: string | null;
}

interface EventFormProps {
  mode?: "add" | "edit";
}

const emptyForm = {
  financial_year_id: "",
  name: "",
  description: "",
  event_date: "",
  budget: "",
  status: "PLANNED",
};

export default function EventForm({ mode = "add" }: EventFormProps) {
  const isEditing = mode === "edit";
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadFormOptions = async () => {
      try {
        const [financialYearsResponse, eventsResponse] = await Promise.all([
          api.get<FinancialYear[]>("/financial-years"),
          isEditing
            ? api.get<EventRecord[]>("/events")
            : Promise.resolve({ data: [] as EventRecord[] }),
        ]);
        if (!isCurrent) return;

        setFinancialYears(financialYearsResponse.data);
        setEvents(eventsResponse.data);
      } catch (error) {
        console.error(error);
        if (isCurrent) {
          setErrorMessage(
            isEditing
              ? "Failed to load events and financial years"
              : "Failed to load financial years",
          );
        }
      }
    };

    void loadFormOptions();
    return () => {
      isCurrent = false;
    };
  }, [isEditing]);

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const selectedEvent = events.find(
      (event) => event.id.toString() === eventId,
    );

    if (!selectedEvent) {
      setForm(emptyForm);
      return;
    }

    setForm({
      financial_year_id: selectedEvent.financial_year_id.toString(),
      name: selectedEvent.name,
      description: selectedEvent.description ?? "",
      event_date: selectedEvent.event_date.split("T")[0],
      budget: selectedEvent.budget?.toString() ?? "",
      status: selectedEvent.status ?? "PLANNED",
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const saveEvent = async () => {
    if (isEditing && !selectedEventId) {
      setErrorMessage("Select an event to edit");
      return;
    }

    if (!form.financial_year_id) {
      setErrorMessage("Financial year is required");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Event name is required");
      return;
    }

    if (!form.event_date) {
      setErrorMessage("Event date is required");
      return;
    }

    if (form.budget && (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)) {
      setErrorMessage("Budget must be a non-negative number");
      return;
    }

    const payload = {
      ...form,
      financial_year_id: Number(form.financial_year_id),
      budget: form.budget === "" ? null : Number(form.budget),
    };

    try {
      if (isEditing) {
        const response = await api.put<EventRecord>(
          `/events/${selectedEventId}`,
          payload,
        );
        setEvents((currentEvents) =>
          currentEvents.map((event) =>
            event.id.toString() === selectedEventId
              ? { ...event, ...response.data }
              : event,
          ),
        );
        setSuccessMessage("Event updated successfully");
      } else {
        await api.post("/events", payload);
        setForm(emptyForm);
        setSuccessMessage("Event created successfully");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        isEditing ? "Failed to update event" : "Failed to create event",
      );
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper sx={{ p: { xs: 2.5, md: 4 } }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {isEditing ? "Edit event" : "Add event"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isEditing
            ? "Select an event, update its details, and save your changes."
            : "Add an event to start tracking its finances."}
        </Typography>

        {isEditing && (
          <TextField
            select
            fullWidth
            margin="normal"
            label="Event to edit"
            value={selectedEventId}
            onChange={(event) => handleEventChange(event.target.value)}
          >
            {events.length === 0 && (
              <MenuItem value="" disabled>
                No events available
              </MenuItem>
            )}
            {events.map((event) => (
              <MenuItem key={event.id} value={event.id.toString()}>
                {event.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          fullWidth
          margin="normal"
          label="Financial year"
          name="financial_year_id"
          value={form.financial_year_id}
          onChange={handleChange}
        >
          {financialYears.map((financialYear) => (
            <MenuItem key={financialYear.id} value={financialYear.id.toString()}>
              {financialYear.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          margin="normal"
          label="Event name"
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
          label="Event date"
          name="event_date"
          value={form.event_date}
          onChange={handleChange}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          fullWidth
          type="number"
          margin="normal"
          label="Budget"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
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
          <MenuItem value="PLANNED">Planned</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
        </TextField>

        <Button variant="contained" onClick={saveEvent} sx={{ mt: 2 }}>
          {isEditing ? "Save changes" : "Save event"}
        </Button>
      </Paper>

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
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3500}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
