import { Button } from "@mui/material";

export interface MealReceiptItem {
  day_label: string;
  meal: string;
  meal_type: string;
  option_code: string;
  price: number;
  head_count: number;
  line_total: number;
}

export interface MealReceiptOrder {
  id: string | number;
  block: string;
  flat_no: string;
  total_amount: number;
  created_at: string;
  items: MealReceiptItem[];
}

const optionLabel = (optionCode: string) => {
  if (optionCode === "complimentary") return "Complimentary";
  if (optionCode === "paid") return "Paid";
  if (optionCode === "chicken") return "Chicken";
  if (optionCode === "mutton") return "Mutton";
  return "";
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function MealOrderReceipt({
  order,
}: {
  order: MealReceiptOrder;
}) {
  return (
    <>
      <Button size="small" variant="outlined" onClick={() => window.print()}>
        Print receipt
      </Button>
      <div className="meal-order-receipt-print" aria-hidden="true">
        <header className="receipt-header">
          <strong>Skyline Lakeview</strong>
          <strong>Durgotsav 2026</strong>
          <span>MEAL ORDER RECEIPT</span>
        </header>
        <div className="receipt-meta">
          <span>Order: #{order.id}</span>
          <span>Block: {order.block}</span>
          <span>Flat: {order.flat_no}</span>
          <span>
            Date: {new Date(order.created_at).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="receipt-items">
          {order.items.map((item, index) => {
            const option = optionLabel(item.option_code);
            return Array.from({ length: item.head_count }, (_, personIndex) => (
              <div
                className="receipt-item"
                key={`${item.day_label}-${item.meal}-${item.option_code}-${index}-${personIndex}`}
              >
                <strong>
                  {item.day_label} - {item.meal} - {item.meal_type}
                  {option ? ` - ${option}` : ""}
                </strong>
                <span>{formatPrice(item.price)}</span>
              </div>
            ));
          })}
        </div>
        <footer className="receipt-total">
          <span>TOTAL</span>
          <strong>{formatPrice(order.total_amount)}</strong>
        </footer>
        <p className="receipt-thanks">Thank you</p>
      </div>
    </>
  );
}
