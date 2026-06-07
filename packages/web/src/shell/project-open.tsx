import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getProject } from "../api.js";

interface ProjectOpenContextValue {
  isProjectOpen: boolean | undefined;
  refreshProjectOpen: () => void;
}

const ProjectOpenContext = createContext<ProjectOpenContextValue>({
  isProjectOpen: undefined,
  refreshProjectOpen: () => {}
});

export function ProjectOpenProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [isProjectOpen, setIsProjectOpen] = useState<boolean | undefined>(undefined);
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    let active = true;

    void getProject()
      .then((project) => {
        if (active) {
          setIsProjectOpen(!("open" in project));
        }
      })
      .catch(() => {
        if (active) {
          setIsProjectOpen(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshSignal]);

  const refreshProjectOpen = useCallback(() => {
    setRefreshSignal((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({
      isProjectOpen,
      refreshProjectOpen
    }),
    [isProjectOpen, refreshProjectOpen]
  );

  return <ProjectOpenContext.Provider value={value}>{children}</ProjectOpenContext.Provider>;
}

export function useProjectOpen(): ProjectOpenContextValue {
  return useContext(ProjectOpenContext);
}
