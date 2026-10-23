export interface InvoiceLine {
  quantity: number;
  unitPrice: number;
}

export interface InvoiceAmounts {
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
}

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "overdue";

const roundVnd = (value: number): number => Math.round(value);

export const invoiceAmounts = (
  lines: readonly InvoiceLine[],
  discount: number,
  paid: number,
): InvoiceAmounts => {
  const subtotal = roundVnd(
    lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  );
  const safeDiscount = Math.min(Math.max(roundVnd(discount), 0), subtotal);
  const total = subtotal - safeDiscount;
  const safePaid = Math.max(roundVnd(paid), 0);
  return {
    subtotal,
    discount: safeDiscount,
    total,
    paid: safePaid,
    balance: Math.max(total - safePaid, 0),
  };
};

export const invoiceStatus = (
  amounts: Pick<InvoiceAmounts, "total" | "paid">,
  dueDate: string | null,
  today: string,
): InvoiceStatus => {
  if (amounts.total > 0 && amounts.paid >= amounts.total) return "paid";
  if (dueDate !== null && dueDate < today) return "overdue";
  return amounts.paid > 0 ? "partial" : "unpaid";
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Chưa thu",
  partial: "Thu một phần",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
};

const vndFormatter = new Intl.NumberFormat("vi-VN");

/** 1250000 → "1.250.000đ". */
export const formatVnd = (value: number): string =>
  `${vndFormatter.format(roundVnd(value))}đ`;

/**
 * Mã đối soát chuyển khoản, gắn vào nội dung CK để webhook ngân hàng tự khớp:
 * tiền tố tổ chức + số hóa đơn, chỉ gồm chữ in hoa và số.
 */
export const transferReference = (
  prefix: string,
  invoiceNumber: string,
): string =>
  `${prefix}${invoiceNumber}`.toUpperCase().replace(/[^A-Z0-9]/gu, "");
