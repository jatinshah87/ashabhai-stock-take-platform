export type AppRole = "system-admin" | "auditor" | "warehouse-user" | "management";

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  roles: AppRole[];
  badge?: string;
};

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  delta: string;
  tone: "primary" | "success" | "warning" | "danger";
};

export type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  tone: "default" | "warning" | "danger" | "success";
};

export type TrendPoint = {
  name: string;
  progress: number;
  variance?: number;
};

export type DashboardPageData = {
  title: string;
  description: string;
  role: AppRole;
  metrics: DashboardMetric[];
  trend: TrendPoint[];
  tasks: ActivityItem[];
  alerts: ActivityItem[];
};

export type BusinessUserRole = "Admin" | "Auditor" | "Warehouse";
export type EntityStatus = "active" | "inactive";
export type PlanStatus = "Draft" | "Scheduled" | "In Progress" | "Completed";
export type CountMethod = "Blind Count" | "Frozen Count" | "Cycle Count";
export type CountPhase = "First Count" | "Second Count";
export type CountTypeCode = "FIRST" | "SECOND";
export type SubmissionState = "DRAFT" | "SUBMITTED";
export type VarianceSeverity = "matched" | "low" | "medium" | "high";

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  status: EntityStatus;
};

export type Site = {
  id: string;
  warehouseId: string;
  name: string;
  code: string;
  type: string;
  manager: string;
};

export type Location = {
  id: string;
  warehouseId: string;
  siteId: string;
  name: string;
  code: string;
  aisle: string;
  zone: string;
  barcode: string;
  status: EntityStatus;
};

export type AppUser = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  role: BusinessUserRole;
  warehouseId: string;
  siteIds: string[];
  locationIds?: string[];
  status: EntityStatus;
};

export type StockTakePlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  warehouseId: string;
  siteIds: string[];
  locationIds: string[];
  scheduledDate: string;
  scheduleWindow: string;
  firstCountUserId: string;
  secondCountUserId: string;
  notes: string;
  instructions: string;
  countMethod: CountMethod;
  locked: boolean;
  highVariancePlaceholder: boolean;
  status: PlanStatus;
};

export type ItemUom = {
  id: string;
  uomCode: string;
  conversionFactor: number;
  isBase: boolean;
};

export type ItemBarcode = {
  id: string;
  barcode: string;
  isPrimary: boolean;
  uomCode: string | null;
};

export type InventoryItem = {
  id: string;
  code: string;
  description: string;
  status: EntityStatus;
  barcodes: ItemBarcode[];
  uoms: ItemUom[];
};

export type StockSnapshotRecord = {
  id: string;
  warehouseId: string;
  siteId: string;
  locationId: string;
  itemId: string;
  itemCode: string;
  itemDescription: string;
  uomCode: string;
  quantity: number;
  snapshotAt: string;
  locationCode: string;
};

export type AssignedPlanProgress = {
  countType: CountTypeCode;
  entryCount: number;
  locationScopeCount: number;
  submitted: boolean;
  submittedAt: string | null;
  readOnly: boolean;
};

export type AssignedExecutionPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: PlanStatus;
  locked: boolean;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  sites: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  locations: Array<{
    id: string;
    code: string;
    name: string;
    barcode: string;
  }>;
  scheduledDate: string;
  scheduleWindow: string;
  assignmentTypes: CountTypeCode[];
  progress: AssignedPlanProgress[];
};

export type ExecutionPlanDetail = {
  id: string;
  code: string;
  name: string;
  description: string;
  countMethod: CountMethod;
  instructions: string;
  notes: string;
  status: PlanStatus;
  locked: boolean;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  sites: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  locations: Array<{
    id: string;
    siteId: string;
    code: string;
    name: string;
    barcode: string;
  }>;
  assignments: {
    firstCountUserId: string;
    secondCountUserId: string;
    assignmentTypes: CountTypeCode[];
    activeCountType: CountTypeCode;
  };
  submission: {
    countType: CountTypeCode;
    status: SubmissionState;
    submittedAt: string | null;
    submittedByUserId: string | null;
    readOnly: boolean;
  };
  progress: {
    entryCount: number;
    locationScopeCount: number;
  };
};

export type ValidatedLocation = {
  id: string;
  siteId: string;
  warehouseId: string;
  code: string;
  name: string;
  barcode: string;
  aisle: string;
  zone: string;
};

export type ValidatedItem = {
  id: string;
  code: string;
  description: string;
  scannedBarcode: string;
  scannedUomCode: string | null;
  uoms: ItemUom[];
  snapshots: Array<{
    id: string;
    uomCode: string;
    quantity: number;
    snapshotAt: string;
  }>;
};

export type CountEntryRecord = {
  id: string;
  countType: CountTypeCode;
  locationId: string;
  locationCode: string;
  locationName: string;
  itemId: string;
  itemCode: string;
  itemDescription: string;
  itemUomId: string;
  uomCode: string;
  countedQty: number;
  countedAt: string;
  countedByUserId: string;
  countedByName: string;
  syncStatus?: "local-pending" | "synced";
  clientEntryId?: string;
};

export type CountReviewData = {
  summary: {
    planId: string;
    countType: CountTypeCode;
    entryCount: number;
    locationCount: number;
    readOnly: boolean;
    submittedAt: string | null;
  };
  groups: Array<{
    locationId: string;
    locationCode: string;
    locationName: string;
    entryCount: number;
    lines: CountEntryRecord[];
  }>;
};

export type CreateUserPayload = {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  role: BusinessUserRole;
  warehouseId: string;
  siteIds: string[];
  status?: EntityStatus;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type CreateStockTakePlanPayload = {
  code: string;
  name: string;
  description: string;
  warehouseId: string;
  siteIds: string[];
  locationIds: string[];
  scheduledDate: string;
  scheduleWindow: string;
  firstCountUserId: string;
  secondCountUserId: string;
  notes: string;
  instructions: string;
  countMethod: CountMethod;
  locked?: boolean;
  highVariancePlaceholder?: boolean;
  status: PlanStatus;
};

export type UpdateStockTakePlanPayload = Partial<CreateStockTakePlanPayload>;

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  warehouseIds: string[];
  siteIds: string[];
};

export type SaveCountEntryPayload = {
  countType: CountTypeCode;
  locationId: string;
  itemId: string;
  itemUomId: string;
  countedQty: number;
};

export type ReportType =
  | "first-vs-second"
  | "system-vs-first"
  | "system-vs-second"
  | "final-variance";

export type ReportSummary = {
  totalItemsCompared: number;
  totalVarianceQuantity: number;
  mismatchedItems: number;
  matchedItems: number;
  highVarianceCount: number;
  mediumVarianceCount: number;
  lowVarianceCount: number;
};

export type ReportFilters = {
  planId?: string;
  warehouseId?: string;
  siteId?: string;
  locationId?: string;
  itemId?: string;
  severity?: VarianceSeverity | "all";
};

export type ReportResponse = {
  type: ReportType;
  summary: ReportSummary;
  rows: Array<Record<string, string | number | null>>;
};

export type IntegrationImportType =
  | "WAREHOUSE"
  | "SITE"
  | "LOCATION"
  | "ITEM"
  | "ITEM_BARCODE"
  | "ITEM_UOM"
  | "STOCK_SNAPSHOT";

export type IntegrationJobStatus = "RUNNING" | "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";

export type IntegrationJobError = {
  recordIndex: number;
  externalKey: string | null;
  message: string | null;
};

export type IntegrationJobSummary = {
  id: string;
  importType: IntegrationImportType;
  sourceSystem: string;
  sourceLabel: string | null;
  status: IntegrationJobStatus;
  totalRecords: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string | null;
  sampleErrors: IntegrationJobError[];
};

export type IntegrationJobsResponse = {
  jobs: IntegrationJobSummary[];
  latestSnapshotImport: Omit<IntegrationJobSummary, "sourceSystem" | "sourceLabel" | "sampleErrors" | "importType"> | null;
};

export type LoadableState<T> = {
  data: T;
  isLoading?: boolean;
  error?: string | null;
};

export type OfflineSyncActionType = "CREATE" | "UPDATE" | "DELETE" | "SUBMIT";
export type OfflineSyncQueueStatus = "pending" | "synced" | "failed" | "conflict";

export type OfflineQueueRecord = {
  clientEntryId: string;
  deviceId: string;
  planId: string;
  countType: CountTypeCode;
  actionType: OfflineSyncActionType;
  locationId?: string;
  locationCode?: string;
  locationName?: string;
  itemId?: string;
  itemCode?: string;
  itemDescription?: string;
  itemUomId?: string;
  uomCode?: string;
  countedQuantity?: number;
  notes?: string;
  clientTimestamp: string;
  status: OfflineSyncQueueStatus;
  errorMessage?: string | null;
};

export type SyncQueueStatusCode =
  | "PENDING"
  | "PROCESSED"
  | "FAILED"
  | "CONFLICT"
  | "RESOLVED"
  | "SKIPPED";

export type SyncConflictType =
  | "DUPLICATE_LINE"
  | "PLAN_LOCKED"
  | "SERVER_STATE_MISMATCH"
  | "SUBMISSION_CONFLICT"
  | "OUT_OF_SCOPE"
  | "INVALID_REFERENCE";

export type SyncConflictStatusCode = "OPEN" | "RESOLVED" | "REVIEW_REQUIRED" | "REJECTED";

export type SyncSummary = {
  queued: number;
  processed: number;
  failed: number;
  pending: number;
  conflicts: number;
  lastSyncAt: string | null;
};

export type SyncQueueRecord = {
  id: string;
  planId: string;
  planCode: string;
  countType: CountTypeCode;
  actionType: OfflineSyncActionType;
  clientEntryId: string;
  deviceId: string;
  syncStatus: SyncQueueStatusCode;
  errorMessage: string | null;
  locationCode: string | null;
  itemCode: string | null;
  countedQuantity: number | null;
  clientTimestamp: string;
  serverProcessedAt: string | null;
  latestConflictId: string | null;
  createdAt: string;
};

export type SyncConflictListItem = {
  id: string;
  planId: string;
  planCode: string;
  countType: CountTypeCode;
  conflictType: SyncConflictType;
  status: SyncConflictStatusCode;
  actionType: OfflineSyncActionType | null;
  locationCode: string | null;
  itemCode: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolutionAction: string | null;
  resolvedByName: string | null;
};

export type SyncConflictDetail = {
  id: string;
  planId: string;
  planCode: string;
  countType: CountTypeCode;
  conflictType: SyncConflictType;
  status: SyncConflictStatusCode;
  resolutionAction: string | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  notes: string | null;
  locationCode: string | null;
  itemCode: string | null;
  uomCode: string | null;
  actionType: OfflineSyncActionType | null;
  localValue: Record<string, unknown>;
  serverValue: Record<string, unknown> | null;
  queueRecord: {
    id: string;
    syncStatus: SyncQueueStatusCode;
    clientEntryId: string;
    deviceId: string;
    clientTimestamp: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsFilters = {
  warehouseId?: string;
  siteId?: string;
  planId?: string;
  userId?: string;
  locationId?: string;
  itemId?: string;
  severity?: VarianceSeverity | "all";
  status?: PlanStatus | "all";
  dateFrom?: string;
  dateTo?: string;
};

export type AnalyticsKpiMetric = {
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "success" | "warning" | "danger";
};

export type OperationalSummaryResponse = {
  kpis: {
    totalPlans: number;
    draftPlans: number;
    scheduledPlans: number;
    inProgressPlans: number;
    completedPlans: number;
    lockedPlans: number;
    firstCountsPending: number;
    secondCountsPending: number;
    locationsScheduled: number;
    locationsCounted: number;
    locationsPending: number;
  };
  statusBreakdown: Array<{ label: string; value: number }>;
  activePlans: Array<{
    planId: string;
    planCode: string;
    planName: string;
    warehouseName: string;
    scheduledDate: string;
    status: PlanStatus;
    firstSubmitted: boolean;
    secondSubmitted: boolean;
    locationsScheduled: number;
    locationsCounted: number;
    completionPercent: number;
  }>;
  firstSecondGaps: Array<{
    planId: string;
    planCode: string;
    warehouseName: string;
    firstCountUser: string;
    secondCountUser: string;
    locationsRemaining: number;
  }>;
  exceptions: Array<{
    title: string;
    value: number;
    tone: "warning" | "danger" | "success" | "primary";
  }>;
};

export type ManagementSummaryResponse = {
  kpis: {
    networkCompletionRate: number;
    activePlans: number;
    completedPlans: number;
    unresolvedConflicts: number;
    openVarianceItems: number;
    failedImports: number;
  };
  warehouseComparison: WarehouseProgressRow[];
  varianceSeverity: Array<{ label: string; value: number }>;
  topIssues: Array<{
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
    metric: string;
  }>;
};

export type WarehouseProgressRow = {
  warehouseId: string;
  warehouseName: string;
  plansInScope: number;
  locationsScheduled: number;
  locationsCounted: number;
  locationsPending: number;
  completionPercent: number;
  firstCountsPending: number;
  secondCountsPending: number;
  highVarianceCount: number;
  unresolvedConflicts: number;
};

export type SiteProgressRow = {
  siteId: string;
  siteCode: string;
  siteName: string;
  warehouseName: string;
  plansInScope: number;
  locationsScheduled: number;
  locationsCounted: number;
  locationsPending: number;
  completionPercent: number;
  highVarianceCount: number;
};

export type VarianceHotspotsResponse = {
  summary: {
    totalItemsCompared: number;
    mismatchedItems: number;
    matchedItems: number;
    highVarianceCount: number;
    mediumVarianceCount: number;
    lowVarianceCount: number;
  };
  severityDistribution: Array<{ label: string; value: number }>;
  topItems: Array<{
    itemCode: string;
    itemDescription: string;
    mismatchCount: number;
    totalVarianceQty: number;
  }>;
  topLocations: Array<{
    locationId: string;
    locationCode: string;
    siteCode: string;
    mismatchCount: number;
    totalVarianceQty: number;
  }>;
  topSites: Array<{
    siteId: string;
    siteCode: string;
    warehouseName: string;
    mismatchCount: number;
    totalVarianceQty: number;
  }>;
  topWarehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    mismatchCount: number;
    totalVarianceQty: number;
  }>;
};

export type ProductivityResponse = {
  summary: {
    countsPerformed: number;
    countsSubmitted: number;
    firstCountThroughput: number;
    secondCountThroughput: number;
    averageCompletionHours: number;
  };
  users: Array<{
    userId: string;
    userName: string;
    countsPerformed: number;
    countsSubmitted: number;
    firstCountLines: number;
    secondCountLines: number;
    latestCountAt: string | null;
  }>;
  pendingWorkload: Array<{
    userId: string;
    userName: string;
    countType: CountTypeCode;
    assignedPlans: number;
    locationsScheduled: number;
    locationsCounted: number;
    locationsPending: number;
  }>;
};

export type SyncHealthResponse = {
  summary: {
    pendingQueueItems: number;
    failedSyncs: number;
    unresolvedConflicts: number;
    resolvedConflicts: number;
    averageConflictAgeHours: number;
  };
  conflictTypes: Array<{ label: string; value: number }>;
  conflictTrend: Array<{ label: string; open: number; resolved: number }>;
  recentQueue: Array<{
    id: string;
    planCode: string;
    actionType: string;
    syncStatus: string;
    createdAt: string;
    errorMessage: string | null;
  }>;
};

export type IntegrationHealthResponse = {
  summary: {
    successfulJobs: number;
    partialFailureJobs: number;
    failedJobs: number;
    latestStockSnapshotImport: string | null;
    latestMasterRefresh: string | null;
  };
  importTypes: Array<{
    label: string;
    success: number;
    failed: number;
    partial: number;
  }>;
  recentJobs: Array<{
    id: string;
    importType: string;
    status: string;
    sourceSystem: string;
    totalRecords: number;
    insertedCount: number;
    updatedCount: number;
    failedCount: number;
    startedAt: string;
    completedAt: string | null;
  }>;
};

export type CompletionTrendsResponse = {
  points: Array<{
    label: string;
    scheduledPlans: number;
    completedPlans: number;
    submittedCounts: number;
    countedLines: number;
  }>;
};

export type VoiceInterpretResponse = {
  transcript: string;
  normalizedTranscript: string;
  interpretedQuantity: number;
  confidence: number;
  requiresConfirmation: boolean;
  uomCode: string | null;
  confirmationText: string;
};

export type VoiceConfig = {
  enabled: boolean;
  locale: string;
  supportsBrowserSpeechApi: boolean;
  confirmationRequired: boolean;
  manualOverrideAlwaysAvailable: boolean;
  hints: string[];
};

export type AnomalyTypeCode =
  | "HIGH_VARIANCE"
  | "EXTREME_MISMATCH"
  | "FIRST_SECOND_MISMATCH"
  | "UOM_CONSISTENCY"
  | "REPEATED_USER_VARIANCE"
  | "RAPID_COUNTING"
  | "REPEATED_SYNC_CONFLICT"
  | "DATA_FRESHNESS";

export type AnomalySeverityCode = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnomalyStatusCode = "OPEN" | "REVIEWED" | "CLOSED";

export type AnomalyFilters = {
  warehouseId?: string;
  siteId?: string;
  planId?: string;
  locationId?: string;
  itemId?: string;
  userId?: string;
  severity?: AnomalySeverityCode | "all";
  status?: AnomalyStatusCode | "all";
  anomalyType?: AnomalyTypeCode | "all";
  dateFrom?: string;
  dateTo?: string;
};

export type AnomalyListItem = {
  id: string;
  anomalyType: AnomalyTypeCode;
  severity: AnomalySeverityCode;
  status: AnomalyStatusCode;
  summary: string;
  planId: string | null;
  planCode: string | null;
  warehouseName: string | null;
  siteCode: string | null;
  locationCode: string | null;
  itemCode: string | null;
  userName: string | null;
  detectedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
};

export type AnomalyDetail = {
  id: string;
  anomalyType: AnomalyTypeCode;
  severity: AnomalySeverityCode;
  status: AnomalyStatusCode;
  summary: string;
  details: Record<string, unknown> | null;
  notes: string | null;
  detectedAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  context: {
    planId: string | null;
    planCode: string | null;
    planName: string | null;
    warehouseName: string | null;
    siteCode: string | null;
    locationCode: string | null;
    itemCode: string | null;
    itemDescription: string | null;
    userName: string | null;
  };
  relatedCountEntry: {
    id: string;
    countType: CountTypeCode;
    countedQty: number;
    countedAt: string;
    uomCode: string;
    countedByName: string;
  } | null;
};

export type AnomalySummaryResponse = {
  totalOpen: number;
  totalReviewed: number;
  totalClosed: number;
  severityDistribution: Array<{ label: AnomalySeverityCode; value: number }>;
  topOpen: Array<{
    id: string;
    summary: string;
    severity: AnomalySeverityCode;
    anomalyType: AnomalyTypeCode;
    planCode: string | null;
    locationCode: string | null;
    itemCode: string | null;
    detectedAt: string;
  }>;
  recent: Array<{
    id: string;
    summary: string;
    status: AnomalyStatusCode;
    severity: AnomalySeverityCode;
    detectedAt: string;
  }>;
};
