import type { Metadata } from "next";

import { Logo } from "@/components/Logo";

import { Portal } from "./Portal";

export const metadata: Metadata = {
  title: "Cổng phụ huynh",
  robots: { index: false },
};

export default async function ParentPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-4">
      <div className="pt-4">
        <Logo />
      </div>
      <Portal token={token} />
    </main>
  );
}
