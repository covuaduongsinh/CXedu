"use client";

import { useState } from "react";
import { formatVnd } from "@cxedu/core";

import { Input } from "@/components/ui";

interface Line {
  key: number;
  description: string;
  quantity: number;
  price: number;
}

export const InvoiceLines = ({
  initial,
}: {
  initial: { description: string; price: number }[];
}) => {
  const [lines, setLines] = useState<Line[]>(
    (initial.length ? initial : [{ description: "", price: 0 }]).map(
      (line, index) => ({ key: index, quantity: 1, ...line }),
    ),
  );
  const update = (key: number, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  const total = lines.reduce(
    (sum, line) => sum + line.quantity * line.price,
    0,
  );
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Nội dung</p>
      {lines.map((line) => (
        <div
          key={line.key}
          className="grid grid-cols-[1fr_70px_130px_auto] items-center gap-2"
        >
          <Input
            name="lineDescription"
            value={line.description}
            onChange={(e) => update(line.key, { description: e.target.value })}
            placeholder="Học phí khóa…"
            required
            aria-label="Nội dung"
          />
          <Input
            name="lineQuantity"
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) =>
              update(line.key, { quantity: Number(e.target.value) })
            }
            aria-label="Số lượng"
          />
          <Input
            name="linePrice"
            type="number"
            min={0}
            step={1000}
            value={line.price}
            onChange={(e) =>
              update(line.key, { price: Number(e.target.value) })
            }
            aria-label="Đơn giá"
          />
          <button
            type="button"
            className="text-sm text-danger"
            onClick={() =>
              setLines((c) =>
                c.length > 1 ? c.filter((l) => l.key !== line.key) : c,
              )
            }
            aria-label="Xóa dòng"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-blue underline"
          onClick={() =>
            setLines((c) => [
              ...c,
              { key: Date.now(), description: "", quantity: 1, price: 0 },
            ])
          }
        >
          + Thêm dòng (học cụ, sách…)
        </button>
        <span className="text-sm">
          Tạm tính: <strong>{formatVnd(total)}</strong>
        </span>
      </div>
    </div>
  );
};
