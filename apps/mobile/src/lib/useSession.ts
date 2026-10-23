import { useEffect, useSyncExternalStore } from "react";

import { session } from "./cx";

let restoring: Promise<void> | null = null;

export const useSession = () => {
  const state = useSyncExternalStore(
    session.subscribe,
    session.get,
    session.get,
  );
  useEffect(() => {
    restoring ??= session.restore();
  }, []);
  return state;
};
