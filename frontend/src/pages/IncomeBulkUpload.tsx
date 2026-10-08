import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import api from "../api";

interface Event {
  id: number;
  name: string;
}

interface IncomeCsvRecord {
  source: string;
  received_from: string;
  block: string;
  flat_no: string;
  amount: string;
  income_date: string;
  payment_mode: string;
  payment_status: string;
  notes: string;
}

interface Props {
  onImportComplete: () => void;
}

interface ImportErrorResponse {
  error?: string;
  errors?: { row: number; message: string }[];
}

const requiredHeaders = ["source", "received_from", "amount", "income_date"];
const supportedHeaders = [
  ...requiredHeaders,
  "block",
  "flat_no",
  "payment_mode",
  "payment_status",
  "notes",
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let quoteClosed = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (quoteClosed && character !== "," && character !== "\r" &&
        character !== "\n" && !/\s/.test(character)) {
      throw new Error("Unexpected character after a quoted CSV field");
    }
    if (quoteClosed && /\s/.test(character) && character !== "\r" &&
        character !== "\n") {
      continue;
    }
    if (character === '"') {
      if (field.length > 0) throw new Error("Unexpected quote in CSV field");
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
      quoteClosed = false;
    } else if (character === "\n" || character === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      quoteClosed = false;
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("CSV contains a quoted field that was not closed");
  if (field.length > 0 || row.length > 0 || quoteClosed) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => value.trim() !== ""));
}

function toIncomeRecords(csvText: string): IncomeCsvRecord[] {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""));
  if (rows.length < 2) {
    throw new Error("Add at least one income record below the header row");
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) {
    throw new Error("CSV headers must not contain duplicates");
  }

  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );
  const unknownHeaders = headers.filter(
    (header) => !supportedHeaders.includes(header),
  );
  if (missingHeaders.length || unknownHeaders.length) {
    const messages = [];
    if (missingHeaders.length) {
      messages.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }
    if (unknownHeaders.length) {
      messages.push(`Unsupported columns: ${unknownHeaders.join(", ")}`);
    }
    throw new Error(messages.join(". "));
  }

  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  if (rows.length - 1 > 1000) {
    throw new Error("Upload a maximum of 1,000 income records at a time");
  }

  return rows.slice(1).map((csvRow, index) => {
    if (csvRow.length > headers.length) {
      throw new Error(`CSV row ${index + 2} has more values than the header`);
    }

    const getValue = (header: string) => {
      const column = headerIndexes.get(header);
      return column === undefined ? "" : (csvRow[column] ?? "").trim();
    };

    return {
      source: getValue("source"),
      received_from: getValue("received_from"),
      block: getValue("block"),
      flat_no: getValue("flat_no"),
      amount: getValue("amount"),
      income_date: getValue("income_date"),
      payment_mode: getValue("payment_mode"),
      payment_status: getValue("payment_status"),
      notes: getValue("notes"),
    };
  });
}

export default function IncomeBulkUpload({ onImportComplete }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState("");
  const [records, setRecords] = useState<IncomeCsvRecord[]>([]);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rowErrors, setRowErrors] = useState<
    { row: number; message: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;
    api
      .get<Event[]>("/events")
      .then((response) => {
        if (isCurrent) setEvents(response.data);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isCurrent) setErrorMessage("Failed to load events");
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const chooseFile = async (file?: File) => {
    setErrorMessage("");
    setRowErrors([]);
    setRecords([]);
    setFileName("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Choose a .csv file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage("CSV file must be 4 MB or smaller");
      return;
    }

    try {
      const parsedRecords = toIncomeRecords(await file.text());
      setRecords(parsedRecords);
      setFileName(file.name);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to read CSV file",
      );
    }
  };

  const upload = async () => {
    if (!eventId || records.length === 0) return;
    setIsUploading(true);
    setErrorMessage("");
    setRowErrors([]);

    try {
      await api.post("/income/bulk", {
        event_id: Number(eventId),
        records,
      });
      setSuccessMessage(`Imported ${records.length} income records`);
      setRecords([]);
      setFileName("");
      onImportComplete();
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError<ImportErrorResponse>(error)) {
        setErrorMessage(
          error.response?.data?.error ?? "Failed to import income records",
        );
        setRowErrors(error.response?.data?.errors ?? []);
      } else {
        setErrorMessage("Failed to import income records");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, mt: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        Bulk upload income
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Upload up to 1,000 records for one event at a time. Download the sample
        CSV and keep its column headers.
      </Typography>
      <Stack spacing={2}>
        {events.length === 0 && (
          <Alert severity="info">Add an event before uploading income.</Alert>
        )}
        <TextField
          select
          fullWidth
          label="Event for these records"
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
        >
          {events.map((event) => (
            <MenuItem key={event.id} value={event.id.toString()}>
              {event.name}
            </MenuItem>
          ))}
        </TextField>
        <Box>
          <Button component="label" variant="outlined">
            Choose CSV file
            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                void chooseFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </Button>
          {fileName && (
            <Typography component="span" sx={{ ml: 1.5 }} variant="body2">
              {fileName} ({records.length} records)
            </Typography>
          )}
        </Box>
        <Typography variant="body2">
          <a href="/income-upload-sample.csv" download>
            Download sample income CSV
          </a>
        </Typography>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {rowErrors.length > 0 && (
          <Alert severity="error">
            <Box component="ul" sx={{ my: 0, pl: 2.5 }}>
              {rowErrors.slice(0, 20).map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Row {error.row}: {error.message}
                </li>
              ))}
              {rowErrors.length > 20 && (
                <li>And {rowErrors.length - 20} more row errors.</li>
              )}
            </Box>
          </Alert>
        )}
        <Box>
          <Button
            variant="contained"
            onClick={() => void upload()}
            disabled={!eventId || records.length === 0 || isUploading}
          >
            {isUploading ? "Uploading…" : `Import ${records.length || ""} records`}
          </Button>
        </Box>
      </Stack>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
