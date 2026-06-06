import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface ReminderRefreshContextValue {
  refreshReminder: () => void;
  refreshSignal: number;
}

const ReminderRefreshContext = createContext<ReminderRefreshContextValue>({
  refreshReminder: () => {},
  refreshSignal: 0
});

export function ReminderRefreshProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const value = useMemo(
    () => ({
      refreshSignal,
      refreshReminder: () => setRefreshSignal((current) => current + 1)
    }),
    [refreshSignal]
  );

  return <ReminderRefreshContext.Provider value={value}>{children}</ReminderRefreshContext.Provider>;
}

export function useReminderRefresh(): ReminderRefreshContextValue {
  return useContext(ReminderRefreshContext);
}
