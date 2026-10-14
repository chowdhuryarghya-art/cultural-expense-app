import { Button } from "@mui/material";

export interface MealReceiptItem {
  day_label: string;
  meal: string;
  meal_type: string;
  option_code: string;
  price: number;
  head_count: number;
  parcel_count?: number;
  parcel_total?: number;
  line_total: number;
}

export interface MealReceiptOrder {
  id: string | number;
  block: string;
  flat_no: string;
  owner_name?: string | null;
  total_amount: number;
  is_update?: boolean;
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
          <span>
            {order.is_update
              ? "MEAL ORDER UPDATE RECEIPT"
              : "MEAL ORDER RECEIPT"}
          </span>
        </header>
        <div className="receipt-meta">
          <span>Order: #{order.id}</span>
          <span>Block: {order.block}</span>
          <span>Flat: {order.flat_no}</span>
          {order.owner_name && <span>Owner: {order.owner_name}</span>}
          <span>
            Date: {new Date(order.created_at).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="receipt-items">
          {order.items.length === 0 && order.is_update ? (
            <span>No additional meals were added.</span>
          ) : order.items.map((item, index) => {
            const option = optionLabel(item.option_code);
            const parcelCount = item.parcel_count ?? 0;
            return (
              <div
                key={`${item.day_label}-${item.meal}-${item.option_code}-${index}`}
              >
                {item.head_count > 0 && (
                  <div className="receipt-item">
                    <strong>
                      {item.day_label} - {item.meal} - {item.meal_type}
                      {option ? ` - ${option}` : ""}
                      {" × "}
                      {item.head_count}
                    </strong>
                    <span>{formatPrice(item.price * item.head_count)}</span>
                  </div>
                )}
                {parcelCount > 0 && (
                  <div className="receipt-item">
                    <strong>
                      {item.day_label} - {item.meal} parcel × {parcelCount} @{" "}
                      {formatPrice(30)} each
                    </strong>
                    <span>
                      {formatPrice(item.parcel_total ?? parcelCount * 30)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <footer className="receipt-total">
          <span>{order.is_update ? "ADDITIONAL AMOUNT DUE" : "TOTAL"}</span>
          <strong>{formatPrice(order.total_amount)}</strong>
        </footer>
        <p className="receipt-thanks">Thank you</p>
      </div>
    </>
  );
}
