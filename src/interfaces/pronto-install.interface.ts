export interface ProntoInstallation {
  id: number;
  description: string;
  customerCode: string;
  csgID: number;
  status: {
    id: string;
    name: {
      es: string;
    };
    color: string;
  };
  address: {
    ubigeo: {
      district: string;
      province: string;
      department: string;
    };
    street: string;
    node: {
      name: string;
    } | null;
  };
  nodePrefix: string;
  nodeIndex: string;
  visitID: number;
}

export interface ProntoAssignmentInfo {
  assignment: {
    accepted: boolean;
    acceptedOn: string | null;
  };
  provider: {
    id: number;
    name: string;
    provider: {
      name: string;
    };
    lastOnlineAt: string | null;
    lastPositionAt: string | null;
    lastPosition: {
      coordinates: [number, number];
    } | null;
  };
}

export interface ProntoInstallationResponse {
  data: {
    maintenanceManager_FindTasks: ProntoInstallation[];
  };
}

export interface ProntoInstallationDetails {
  data: {
    installationTask_GetAssignmentsInfo: ProntoAssignmentInfo[];
  };
}

export interface ProntoTaskSummary {
  id: number;
  description: string;
  customerCode: string;
  status: {
    id: string;
    name: { es: string };
    color: string;
  };
  address: {
    ubigeo: {
      district: string;
      province: string;
      department: string;
    };
    street: string;
    node: { name: string } | null;
  };
  nodePrefix: string;
  nodeIndex: string;
  visitID: number;
}

export interface ProntoTaskWithDetails {
  task: ProntoTaskSummary;
  details: ProntoAssignmentInfo[];
}