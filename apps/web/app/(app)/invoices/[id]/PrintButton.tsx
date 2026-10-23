"use client";

import { buttonClass } from "@/components/ui";

export const PrintButton = () => (
  <button
    type="button"
    className={buttonClass("ghost")}
    onClick={() => window.print()}
  >
    In / lưu PDF
  </button>
);
