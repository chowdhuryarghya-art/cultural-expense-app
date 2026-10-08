import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import ExpenseForm from "./pages/ExpenseForm";
import ExpenseDashboard from "./pages/ExpenseDashboard";
import IncomeDashboard from "./pages/IncomeDashboard";
import EventForm from "./pages/EventForm";
import MealOrder from "./pages/MealOrder";
import MealOrders from "./pages/MealOrders";
import MealOrderSummary from "./pages/MealOrderSummary";

import IncomeForm from "./pages/IncomeForm";
import IncomeBulkUpload from "./pages/IncomeBulkUpload";
import AuthPage from "./pages/AuthPage";
import api from "./api";
import { AUTH_TOKEN_KEY } from "./auth";
import type { AuthUser } from "./auth";

interface ExpenseRecord {
  id: number;
  event_id: number;
  category: string;
  vendor: string;
  amount: number;
  expense_date: string;
  paid_by?: string;
  payment_mode?: string;
  notes?: string;
  bill_image_path?: string;
}

interface IncomeRecord {
  id: number;
  event_id: number;
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

interface MealOrderRecord {
  id: string | number;
  block: string;
  flat_no: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    meal_date: string;
    day_label: string;
    meal: "Breakfast" | "Lunch" | "Dinner";
    meal_type: "Veg" | "Non-Veg";
    option_code: string;
    description: string;
    price: number;
    head_count: number;
    line_total: number;
  }>;
}

function App() {
  const [tab, setTab] = useState(0);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(
    () => !!sessionStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [authError, setAuthError] = useState("");

  const [editingExpense, setEditingExpense] =
    useState<ExpenseRecord | null>(null);

  const [refreshDashboardKey, setRefreshDashboardKey] = useState(0);

  const [editingIncome, setEditingIncome] =
    useState<IncomeRecord | null>(null);

  const [refreshIncomeDashboardKey,
    setRefreshIncomeDashboardKey] =
    useState(0);
  const [editingMealOrder, setEditingMealOrder] =
    useState<MealOrderRecord | null>(null);
  const [refreshMealOrdersKey, setRefreshMealOrdersKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const handleExpiredSession = () => {
      if (isCurrent) setAuthUser(null);
    };
    window.addEventListener(
      "cultural-expense-auth-expired",
      handleExpiredSession,
    );

    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return () => {
        isCurrent = false;
        window.removeEventListener(
          "cultural-expense-auth-expired",
          handleExpiredSession,
        );
      };
    }

    api
      .get<AuthUser>("/auth/me")
      .then((response) => {
        if (isCurrent) setAuthUser(response.data);
      })
      .catch((error: unknown) => {
        console.error("Could not restore authentication session", error);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
      })
      .finally(() => {
        if (isCurrent) setAuthChecking(false);
      });

    return () => {
      isCurrent = false;
      window.removeEventListener(
        "cultural-expense-auth-expired",
        handleExpiredSession,
      );
    };
  }, []);

  const handleAuthenticated = (token: string, user: AuthUser) => {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
    setTab(0);
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Could not revoke authentication session", error);
      setAuthError("Could not contact the server; this browser has been signed out.");
    } finally {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthUser(null);
    }
  };

  if (authChecking) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!authUser) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="inherit" elevation={0}>
        <Toolbar sx={{ maxWidth: 1280, width: "100%", mx: "auto", py: 1 }}>
          <Box>
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ fontWeight: 700, letterSpacing: 1.4, lineHeight: 1.2 }}
            >
              CULTURAL FINANCE
            </Typography>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              Event expense manager
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ textAlign: "right", mr: 1.5, display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {authUser.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {authUser.email}
            </Typography>
          </Box>
          <Button color="inherit" onClick={() => void signOut()}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            maxWidth: 1280,
            mx: "auto",
            "& .MuiTab-root": { minHeight: 56, textTransform: "none", fontWeight: 600 },
          }}
        >
          <Tab label="Expense overview" />
          <Tab label={editingExpense ? "Edit expense" : "Add expense"} />
          <Tab label="Income & finances" />
          <Tab label={editingIncome ? "Edit income" : "Add income"} />
          <Tab label="Bulk income" />
          <Tab label="Add event" />
          <Tab label="Edit event" />
          <Tab label="Meal ordering" />
          <Tab label="Meal orders" />
          <Tab label="Meal headcount summary" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <ExpenseDashboard
          key={refreshDashboardKey}
          onEditExpense={(expense) => {
            setEditingExpense(expense);
            setTab(1);
          }}
        />
      )}

      {tab === 1 && (
        <ExpenseForm
          editingExpense={editingExpense}
          clearEditingExpense={() =>
            setEditingExpense(null)
          }
          onExpenseUpdated={() => {
            setRefreshDashboardKey((prev) => prev + 1);
            setEditingExpense(null);
            setTab(0);
          }}
        />
      )}

      {tab === 2 && (
        <IncomeDashboard
          key={refreshIncomeDashboardKey}
          onBulkUpload={() => setTab(4)}
          onEditIncome={(income) => {
            setEditingIncome(income);
            setTab(3);
          }}
        />
      )}

      {tab === 3 && (
        <IncomeForm
          editingIncome={editingIncome}
          clearEditingIncome={() =>
            setEditingIncome(null)
          }
          onIncomeUpdated={() => {
            setRefreshIncomeDashboardKey(
              (prev) => prev + 1
            );

            setEditingIncome(null);
            setTab(2);
          }}
        />
      )}

      {tab === 4 && (
        <IncomeBulkUpload
          onImportComplete={() =>
            setRefreshIncomeDashboardKey((previous) => previous + 1)
          }
        />
      )}

      {tab === 5 && <EventForm />}

      {tab === 6 && <EventForm mode="edit" />}

      {tab === 7 && (
        <MealOrder
          key={editingMealOrder?.id ?? "new-meal-order"}
          editingOrder={editingMealOrder}
          onOrderSaved={() => {
            setRefreshMealOrdersKey((key) => key + 1);
            if (editingMealOrder) {
              setEditingMealOrder(null);
              setTab(8);
            }
          }}
        />
      )}

      {tab === 8 && (
        <MealOrders
          key={refreshMealOrdersKey}
          onEditOrder={(order) => {
            setEditingMealOrder(order);
            setTab(7);
          }}
        />
      )}

      {tab === 9 && <MealOrderSummary />}

      <Snackbar
        open={!!authError}
        autoHideDuration={5000}
        onClose={() => setAuthError("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="warning" onClose={() => setAuthError("")}>
          {authError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;