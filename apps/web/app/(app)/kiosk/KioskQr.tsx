"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { checkinQrPayload } from "@cxedu/core";

import { getSupabaseBrowser } from "@/lib/supabase/browser";

export const KioskQr = ({ centerId }: { centerId: string }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (now < expiresAt) return;
    let cancelled = false;
    void (async () => {
      const { data, error: rpcError } = await getSupabaseBrowser().rpc(
        "current_checkin_code",
        { p_center_id: centerId },
      );
      if (cancelled) return;
      if (rpcError || !data) {
        setError(rpcError?.message ?? "Không lấy được mã");
        setExpiresAt(Date.now() + 5000);
        return;
      }
      const { code, expires_at } = data as { code: string; expires_at: string };
      setSvg(
        await QRCode.toString(checkinQrPayload(centerId, code), {
          type: "svg",
          margin: 1,
        }),
      );
      setExpiresAt(new Date(expires_at).getTime());
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [centerId, expiresAt, now]);

  const seconds = Math.max(Math.ceil((expiresAt - now) / 1000), 0);
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-line">
      {svg ? (
        <div
          className="size-72"
          aria-label="Mã QR check-in"
          role="img"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="size-72 animate-pulse rounded bg-line" />
      )}
      <p className="mt-3 text-sm text-muted">
        {error ?? `Mã đổi sau ${seconds}s`}
      </p>
    </div>
  );
};
