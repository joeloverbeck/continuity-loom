export interface VersionInfo {
  app: {
    name: "Continuity Loom";
    version: string;
  };
  templates: {
    version: string;
    status: "placeholder";
  };
  compiler: {
    version: string;
    status: "placeholder";
  };
}

export const versionInfo: VersionInfo = {
  app: {
    name: "Continuity Loom",
    version: "0.0.0"
  },
  templates: {
    version: "0.0.0",
    status: "placeholder"
  },
  compiler: {
    version: "0.0.0",
    status: "placeholder"
  }
};
