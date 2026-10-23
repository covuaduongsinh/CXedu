export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "excused", "unexcused"],
      chess_level: ["pawn", "knight", "bishop", "rook", "queen", "king"],
      enrollment_status: ["active", "paused", "completed", "stopped"],
      invoice_status: ["unpaid", "partial", "paid", "void"],
      lead_status: ["new", "caring", "registered", "lost"],
      member_role: ["owner", "admin", "teacher"],
      notify_channel: ["zalo_zns", "push", "email"],
      pay_mode: ["per_session", "per_student", "flex"],
      payment_method: ["transfer", "cash", "card", "other"],
      session_kind: ["regular", "makeup", "single"],
      student_status: ["active", "paused", "stopped"],
      subscription_status: ["trialing", "active", "past_due", "expired"],
    },
  },
};
