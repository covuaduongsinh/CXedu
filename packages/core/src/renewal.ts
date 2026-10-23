/** Chuỗi tái đăng ký: sắp hết buổi → đang chăm sóc → đã gửi hóa đơn → đã đóng. */
export type RenewalStage =
  | "needs_contact"
  | "following_up"
  | "invoice_sent"
  | "paid";

export interface RenewalFollowup {
  followingUp: boolean;
  invoiceSent: boolean;
  paid: boolean;
}

export const renewalStage = (
  followup: RenewalFollowup | null,
): RenewalStage => {
  if (!followup) return "needs_contact";
  if (followup.paid) return "paid";
  if (followup.invoiceSent) return "invoice_sent";
  if (followup.followingUp) return "following_up";
  return "needs_contact";
};

export const RENEWAL_STAGE_LABELS: Record<RenewalStage, string> = {
  needs_contact: "Cần liên hệ",
  following_up: "Đang chăm sóc",
  invoice_sent: "Đã gửi hóa đơn",
  paid: "Đã đóng",
};
