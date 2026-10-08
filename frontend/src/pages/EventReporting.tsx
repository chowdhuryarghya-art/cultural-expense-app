import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { jsPDF as JsPdfDocument } from "jspdf";
import { strToU8, zipSync } from "fflate";
import api from "../api";

let pdfDependencies:
  | Promise<
      [
        typeof import("jspdf"),
        typeof import("jspdf-autotable"),
      ]
    >
  | undefined;

const loadPdfDependencies = () => {
  pdfDependencies ??= Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return pdfDependencies;
};

interface EventDetails {
  id: number;
  name: string;
  budget?: number | string | null;
}

interface IncomeRecord {
  id: number;
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

interface ExpenseRecord {
  id: number;
  category: string;
  vendor?: string | null;
  amount: number | string;
  expense_date: string;
  paid_by?: string | null;
  payment_mode?: string | null;
  notes?: string | null;
}

interface Props {
  event: EventDetails;
}

interface ChartItem {
  label: string;
  amount: number;
}

const currency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const pdfCurrency = (amount: number) =>
  `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount)}`;

const amountOf = (value: number | string) => Number(value) || 0;

interface WorkbookSheet {
  name: string;
  rows: Array<Array<string | number>>;
}

const getPdfTableEnd = (document: JsPdfDocument, fallback: number) =>
  (document as JsPdfDocument & { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY ?? fallback;

const escapeXml = (value: string) =>
  Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
    })
    .join("")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getColumnReference = (columnNumber: number) => {
  let number = columnNumber;
  let reference = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    reference = String.fromCharCode(65 + remainder) + reference;
    number = Math.floor((number - 1) / 26);
  }
  return reference;
};

const createWorksheetXml = (rows: WorkbookSheet["rows"]) => {
  const worksheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference =
            getColumnReference(columnIndex + 1) + (rowIndex + 1);
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${reference}" s="2"><v>${value}</v></c>`;
          }
          const text = escapeXml(String(value));
          const style = rowIndex === 0 ? ' s="1"' : "";
          return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${worksheetRows}</sheetData></worksheet>`;
};

const createWorkbookBytes = (sheets: WorkbookSheet[]) => {
  const sheetDefinitions = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("");
  const sheetOverrides = sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  const sheetRelationships = sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join("");
  const archive: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetDefinitions}</sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRelationships}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ),
    "xl/styles.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF3157C8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    ),
  };

  sheets.forEach((sheet, index) => {
    archive[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(
      createWorksheetXml(sheet.rows),
    );
  });
  return zipSync(archive, { level: 6 });
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const fileSafeName = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";

const groupAmounts = <T extends { amount: number | string }>(
  records: T[],
  getLabel: (record: T) => string,
): ChartItem[] => {
  const totals = new Map<string, number>();
  records.forEach((record) => {
    const label = getLabel(record) || "Other";
    totals.set(label, (totals.get(label) ?? 0) + amountOf(record.amount));
  });
  return Array.from(totals, ([label, amount]) => ({ label, amount })).sort(
    (first, second) => second.amount - first.amount,
  );
};

function BreakdownChart({
  title,
  items,
  color,
}: {
  title: string;
  items: ChartItem[];
  color: string;
}) {
  const maxAmount = Math.max(...items.map((item) => item.amount), 0);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No transactions to chart yet.
        </Typography>
      ) : (
        <Stack spacing={1.75}>
          {items.map((item) => (
            <Box key={item.label}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" noWrap title={item.label}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  {currency(item.amount)}
                </Typography>
              </Box>
              <Box
                role="img"
                aria-label={`${item.label}: ${currency(item.amount)}`}
                sx={{
                  height: 9,
                  overflow: "hidden",
                  borderRadius: 99,
                  bgcolor: "rgba(148, 168, 255, 0.12)",
                }}
              >
                <Box
                  sx={{
                    width: `${maxAmount ? (item.amount / maxAmount) * 100 : 0}%`,
                    height: "100%",
                    borderRadius: 99,
                    background: color,
                    transition: "width 250ms ease",
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function EventReporting({ event }: Props) {
  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loadedEventId, setLoadedEventId] = useState<number | null>(null);
  const [failedEventId, setFailedEventId] = useState<number | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadTransactions = async () => {
      try {
        const query = `?eventId=${event.id}`;
        const [incomeResponse, expenseResponse] = await Promise.all([
          api.get<IncomeRecord[]>(`/income${query}`),
          api.get<ExpenseRecord[]>(`/expenses${query}`),
        ]);
        if (!isCurrent) return;
        setIncome(incomeResponse.data);
        setExpenses(expenseResponse.data);
        setLoadedEventId(event.id);
        setFailedEventId(null);
      } catch (error) {
        console.error(error);
        if (!isCurrent) return;
        setFailedEventId(event.id);
        setErrorMessage("Could not load event transactions for reporting");
      }
    };

    void loadTransactions();
    return () => {
      isCurrent = false;
    };
  }, [event.id]);

  useEffect(() => {
    let isCurrent = true;
    void loadPdfDependencies()
      .then(() => {
        if (isCurrent) setPdfReady(true);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isCurrent) setErrorMessage("Could not prepare PDF export");
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const isLoaded = loadedEventId === event.id;
  const isLoading = !isLoaded && failedEventId !== event.id;
  const visibleIncome = isLoaded ? income : [];
  const visibleExpenses = isLoaded ? expenses : [];
  const incomeTotal = visibleIncome.reduce(
    (total, record) => total + amountOf(record.amount),
    0,
  );
  const expenseTotal = visibleExpenses.reduce(
    (total, record) => total + amountOf(record.amount),
    0,
  );
  const netBalance = incomeTotal - expenseTotal;
  const hasBudget =
    event.budget !== null &&
    event.budget !== undefined &&
    event.budget !== "";
  const budget = amountOf(event.budget ?? 0);
  const bySource = groupAmounts(visibleIncome, (record) => record.source);
  const byCategory = groupAmounts(visibleExpenses, (record) => record.category);
  const baseName = fileSafeName(event.name);

  const exportExcel = async () => {
    try {
      const workbook = createWorkbookBytes([
        {
          name: "Summary",
          rows: [
            ["Metric", "Value"],
            ["Event", event.name],
            ["Event budget", hasBudget ? budget : "Not set"],
            ["Total income", incomeTotal],
            ["Total expenses", expenseTotal],
            ["Net balance", netBalance],
          ],
        },
        {
          name: "Income",
          rows: [
            [
              "Date",
              "Source",
              "Amount (INR)",
              "Received from",
              "Block",
              "Flat No.",
              "Payment mode",
              "Payment status",
              "Notes",
            ],
            ...visibleIncome.map((record) => [
              record.income_date,
              record.source,
              amountOf(record.amount),
              record.received_from ?? "",
              record.block ?? "",
              record.flat_no ?? "",
              record.payment_mode ?? "",
              record.payment_status ?? "",
              record.notes ?? "",
            ]),
          ],
        },
        {
          name: "Expenses",
          rows: [
            ["Date", "Category", "Vendor", "Amount (INR)", "Paid by", "Payment mode", "Notes"],
            ...visibleExpenses.map((record) => [
              record.expense_date,
              record.category,
              record.vendor ?? "",
              amountOf(record.amount),
              record.paid_by ?? "",
              record.payment_mode ?? "",
              record.notes ?? "",
            ]),
          ],
        },
        {
          name: "Breakdown",
          rows: [
            ["Type", "Source or category", "Amount (INR)"],
            ...bySource.map((item) => ["Income", item.label, item.amount]),
            ...byCategory.map((item) => ["Expense", item.label, item.amount]),
          ],
        },
      ]);
      const file = new Blob([workbook], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      downloadBlob(file, `${baseName}-financial-report.xlsx`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create the Excel report");
    }
  };

  const exportPdf = async () => {
    try {
      const [{ jsPDF }, { default: autoTable }] =
        await loadPdfDependencies();
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text("Event financial report", 14, 18);
      pdf.setFontSize(11);
      pdf.text(event.name, 14, 26);
      pdf.text(
        `Generated ${new Date().toLocaleDateString("en-IN")}`,
        14,
        33,
      );

      autoTable(pdf, {
        startY: 40,
        head: [["Financial summary", "Amount"]],
        body: [
          ["Event budget", hasBudget ? pdfCurrency(budget) : "Not set"],
          ["Total income", pdfCurrency(incomeTotal)],
          ["Total expenses", pdfCurrency(expenseTotal)],
          ["Net balance", pdfCurrency(netBalance)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [49, 87, 200] },
      });

      let nextY = getPdfTableEnd(pdf, 40) + 10;
      autoTable(pdf, {
        startY: nextY,
        head: [[
          "Income date",
          "Source",
          "Received from",
          "Block",
          "Flat No.",
          "Payment mode",
          "Payment status",
          "Amount",
        ]],
        body:
          visibleIncome.length > 0
            ? visibleIncome.map((record) => [
                record.income_date,
                record.source,
                record.received_from ?? "",
                record.block ?? "",
                record.flat_no ?? "",
                record.payment_mode ?? "",
                record.payment_status ?? "",
                pdfCurrency(amountOf(record.amount)),
              ])
            : [["No income transactions", "", "", "", "", "", ""]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 132, 91] },
      });

      nextY = getPdfTableEnd(pdf, nextY);
      autoTable(pdf, {
        startY: nextY + 10,
        head: [["Expense date", "Category", "Vendor", "Paid by", "Amount"]],
        body:
          visibleExpenses.length > 0
            ? visibleExpenses.map((record) => [
                record.expense_date,
                record.category,
                record.vendor ?? "",
                record.paid_by ?? "",
                pdfCurrency(amountOf(record.amount)),
              ])
            : [["No expense transactions", "", "", "", ""]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [183, 108, 11] },
      });

      nextY = getPdfTableEnd(pdf, nextY);
      autoTable(pdf, {
        startY: nextY + 10,
        head: [["Type", "Source or category", "Amount"]],
        body: [
          ...bySource.map((item) => [
            "Income",
            item.label,
            pdfCurrency(item.amount),
          ]),
          ...byCategory.map((item) => [
            "Expense",
            item.label,
            pdfCurrency(item.amount),
          ]),
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [67, 94, 214] },
      });

      downloadBlob(pdf.output("blob"), `${baseName}-financial-report.pdf`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not create the PDF report");
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Reports &amp; charts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {event.name} · event transactions and financial breakdown
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={exportExcel}
            disabled={!isLoaded}
          >
            Export Excel
          </Button>
          <Button
            variant="contained"
            onClick={exportPdf}
            disabled={!isLoaded || !pdfReady}
          >
            {pdfReady ? "Export PDF" : "Preparing PDF…"}
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Paper sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 3 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading report data…</Typography>
        </Paper>
      ) : isLoaded ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Card variant="outlined" sx={{ gridColumn: { md: "1 / -1" } }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Financial comparison
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 2,
                }}
              >
                {[
                  {
                    label: "Budget",
                    amount: budget,
                    color: "#a875ff",
                    display: hasBudget ? currency(budget) : "Not set",
                  },
                  { label: "Income", amount: incomeTotal, color: "#70cf9b" },
                  { label: "Expenses", amount: expenseTotal, color: "#ffc469" },
                  {
                    label: "Net balance",
                    amount: Math.abs(netBalance),
                    color: netBalance >= 0 ? "#5e7cff" : "#ff7272",
                    display: currency(netBalance),
                  },
                ].map((item) => {
                  const maxAmount = Math.max(budget, incomeTotal, expenseTotal, Math.abs(netBalance), 1);
                  const percentage = Math.max(
                    item.amount > 0 ? 4 : 0,
                    (item.amount / maxAmount) * 100,
                  );
                  return (
                    <Box key={item.label}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.display ?? currency(item.amount)}
                        </Typography>
                      </Box>
                      <Box
                        role="img"
                        aria-label={`${item.label}: ${item.display ?? currency(item.amount)}`}
                        sx={{
                          height: 12,
                          borderRadius: 99,
                          bgcolor: "rgba(148, 168, 255, 0.12)",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${percentage}%`,
                            height: "100%",
                            borderRadius: 99,
                            bgcolor: item.color,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
          <BreakdownChart
            title="Income by source"
            items={bySource}
            color="linear-gradient(90deg, #16845b, #70cf9b)"
          />
          <BreakdownChart
            title="Expenses by category"
            items={byCategory}
            color="linear-gradient(90deg, #b76c0b, #ffc469)"
          />
        </Box>
      ) : (
        <Alert severity="error">
          Report data could not be loaded.{" "}
          {errorMessage || "Try switching events and returning to this event."}
        </Alert>
      )}

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
    </Box>
  );
}
