import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

import ExpenseForm from "./pages/ExpenseForm";
import ExpenseDashboard from "./pages/ExpenseDashboard";
import EventForm from "./pages/EventForm";

import IncomeForm from "./pages/IncomeForm";

function App() {
  const [tab, setTab] = useState(0);

  const [editingExpense, setEditingExpense] =
    useState<any>(null);

  const [refreshDashboardKey, setRefreshDashboardKey] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue)}
        centered
      >
        <Tab label="Dashboard" />
        <Tab label="Add Expense" />
        <Tab label="Add Income" />
        <Tab label="Add Event" />
      </Tabs>

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
            setTab(0);
          }}
        />
      )}

      {tab === 2 && (
        <IncomeForm
          editingIncome={null}
          clearEditingIncome={() => {}}
          onIncomeUpdated={() => {}}
        />
      )}

      {tab === 3 && <EventForm />}
    </Box>
  );
}

export default App;