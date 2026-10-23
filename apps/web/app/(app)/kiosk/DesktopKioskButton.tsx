"use client";

import { useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui";

interface TauriGlobal {
  core: { invoke: (command: string) => Promise<unknown> };
}

const noopSubscribe = () => () => {};
const readTauri = () =>
  (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null;

/** Chỉ hiện trong app desktop (Tauri): mở cửa sổ kiosk toàn màn hình cho máy lễ tân. */
export const DesktopKioskButton = () => {
  const tauri = useSyncExternalStore(noopSubscribe, readTauri, () => null);
  if (!tauri) return null;
  return (
    <button
      type="button"
      className={buttonClass("accent")}
      onClick={() => void tauri.core.invoke("open_kiosk")}
    >
      Mở toàn màn hình (máy lễ tân)
    </button>
  );
};
