export interface VersionInfo {
  app: {
    name: "Continuity Loom";
    version: string;
  };
  templates: {
    version: string;
    status: "stable";
  };
  compiler: {
    version: string;
    status: "stable";
  };
  contract: {
    version: string;
    status: "stable";
  };
}

export const versionInfo: VersionInfo = {
  app: {
    name: "Continuity Loom",
    version: "0.0.0"
  },
  templates: {
    version: "1.6.0",
    status: "stable"
  },
  compiler: {
    version: "1.8.0",
    status: "stable"
  },
  contract: {
    version: "1.9.0",
    status: "stable"
  }
};
