import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  MenuList,
  Paper,
  Popper,
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
import UnpaidSubscriptions from "./pages/UnpaidSubscriptions";

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
  phone_number?: string | null;
  total_amount: number;
  additional_amount?: number;
  added_items?: MealOrderRecord["items"];
  is_update?: boolean;
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

  const navigationCategories = [
    {
      label: "Expense",
      tabs: [
        { value: 0, label: "Overview" },
        { value: 1, label: editingExpense ? "Edit expense" : "Add expense" },
      ],
    },
    {
      label: "Income",
      tabs: [
        { value: 2, label: "Finances" },
        { value: 3, label: editingIncome ? "Edit income" : "Add income" },
        { value: 4, label: "Bulk income" },
      ],
    },
    {
      label: "Meal",
      tabs: [
        { value: 7, label: "Meal ordering" },
        { value: 8, label: "Meal orders" },
        { value: 9, label: "Headcount summary" },
      ],
    },
    {
      label: "Subscriptions",
      tabs: [{ value: 10, label: "Unpaid subscriptions" }],
    },
    {
      label: "Event",
      tabs: [
        { value: 5, label: "Add event" },
        { value: 6, label: "Edit event" },
      ],
    },
  ];
  const selectedCategory =
    navigationCategories.find((category) =>
      category.tabs.some((categoryTab) => categoryTab.value === tab),
    ) ?? navigationCategories[0];
  const [menuCategoryLabel, setMenuCategoryLabel] = useState<string | null>(
    null,
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const openCategoryMenu = (label: string, anchor: HTMLElement) => {
    const category = navigationCategories.find((item) => item.label === label);
    if (!category || category.tabs.length < 2) {
      setMenuCategoryLabel(null);
      setMenuAnchorEl(null);
      return;
    }
    setMenuCategoryLabel(label);
    setMenuAnchorEl(anchor);
  };
  const menuCategory = navigationCategories.find(
    (category) => category.label === menuCategoryLabel,
  );

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
        onMouseLeave={() => {
          setMenuCategoryLabel(null);
          setMenuAnchorEl(null);
        }}
      >
        <Tabs
          value={selectedCategory.label}
          onChange={(_, categoryLabel: string) => {
            const category = navigationCategories.find(
              (item) => item.label === categoryLabel,
            );
            if (category) setTab(category.tabs[0].value);
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            maxWidth: 1280,
            mx: "auto",
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              py: 0.5,
              textTransform: "none",
              fontWeight: 700,
            },
          }}
        >
          {navigationCategories.map((category) => (
            <Tab
              key={category.label}
              value={category.label}
              label={category.label}
              aria-haspopup={category.tabs.length > 1 ? "menu" : undefined}
              aria-expanded={
                category.tabs.length > 1
                  ? menuCategoryLabel === category.label
                  : undefined
              }
              onMouseEnter={(event) =>
                openCategoryMenu(category.label, event.currentTarget)
              }
              onFocus={(event) =>
                openCategoryMenu(category.label, event.currentTarget)
              }
              onClick={(event) => {
                setTab(category.tabs[0].value);
                openCategoryMenu(category.label, event.currentTarget);
              }}
            />
          ))}
        </Tabs>
        <Popper
          open={!!menuCategory && !!menuAnchorEl}
          anchorEl={menuAnchorEl}
          placement="bottom-start"
          disablePortal
          sx={{ zIndex: 11 }}
        >
          <Paper elevation={8} sx={{ minWidth: 200, mt: 0.25 }}>
            <MenuList
              aria-label={`${menuCategory?.label ?? selectedCategory.label} pages`}
              dense
            >
              {menuCategory?.tabs.map((categoryTab) => (
                <MenuItem
                  key={categoryTab.value}
                  selected={tab === categoryTab.value}
                  onClick={() => {
                    setTab(categoryTab.value);
                    setMenuCategoryLabel(null);
                    setMenuAnchorEl(null);
                  }}
                >
                  {categoryTab.label}
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </Popper>
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

      {tab === 10 && <UnpaidSubscriptions />}

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