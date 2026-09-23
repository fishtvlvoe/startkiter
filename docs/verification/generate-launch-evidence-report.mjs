import fs from "node:fs";
import path from "node:path";

const verificationRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
);
const evidenceRoot = path.resolve(
  verificationRoot,
  "../../openspec/changes/platform-launch-verification-evidence/evidence",
);
const outputPath = path.join(verificationRoot, "LaunchEvidenceReport.json");

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(evidenceRoot, name), "utf8"));

const matrixObservations = readJson("launch-matrix-observations.json");
const linkChecks = readJson("link-checks.json");
const buttonChecks = readJson("button-checks.json");
const errorScenarios = readJson("error-scenarios.json");

const matrix = matrixObservations.map((observation) => ({
  appId: "course",
  role: observation.role,
  theme: observation.theme,
  locale: observation.locale,
  viewport: observation.viewport,
  status:
    observation.verificationStatus ?? (observation.actual ? "verified" : "unverified"),
  knownIssues: observation.knownIssues ?? [],
  evidencePath:
    "evidence/launch-matrix-observations.json#" +
    [observation.role, observation.theme, observation.locale, observation.viewport].join(
      "_",
    ),
  screenshotPath: observation.screenshotPath,
  screenshotStatus: observation.screenshotStatus,
  actualOutcome: {
    url: observation.url,
    title: observation.title,
    viewportWidth: observation.viewportWidth,
    viewportHeight: observation.viewportHeight,
    accountMenu: observation.accountMenu,
    navLinkCount: observation.navLinkCount,
    knownIssues: observation.knownIssues ?? [],
  },
}));

const normalizeCheck = (check) => ({
  appId: check.appId,
  entryId: check.entryId,
  expectedOutcome: check.expectedOutcome,
  actualOutcome: check.actualOutcome,
  passed: check.passed,
});

const unresolvedItems = [
  "rollbackRehearsal 未執行：任務明確排除 4.1，依範圍不得對正式站執行回滾；後續需在 TEST/preview 補 timestamp、command、health check。",
  "36 格截圖未產出：ego-browser Page.captureScreenshot 在 1440px 與 390px 均 15 秒逾時；核心路徑已由 DOM snapshot/state 驗證，3.2 截圖 gate 仍未確認。",
  "課程 App 的 courseAccess 未透過正式購買或後台開通；本輪驗收的是平台殼核心路徑，課程內容權限仍未確認。",
  "24 格 zh-cn/en 矩陣未通過：workspaceLabel 未走 i18n，身份標籤仍顯示繁體中文；根因為 packages/platform/src/workspace/navigation.ts 第 237/239 行硬編碼，需另開 SR 修正後重跑。",
];

const knownIssues = [
  {
    id: "workspace-label-not-localized",
    severity: "failed",
    affected: "24 matrix cells: locale zh-cn/en across all roles, themes, and viewports",
    expected: "zh-cn/en workspace identity label is localized",
    actual: "workspaceLabel remains Traditional Chinese (總管理員/課程管理員/使用者)",
    rootCause:
      "packages/platform/src/workspace/navigation.ts lines 237/239 use hard-coded labels instead of i18n",
  },
];

const report = {
  changeId: "platform-launch-verification-evidence",
  generatedAt: new Date().toISOString(),
  environment: {
    type: "production",
    url: "https://app.startkiter.dev",
    browser: "ego-browser",
  },
  appIds: ["course"],
  matrix,
  linkChecks: [...linkChecks, ...buttonChecks].map(normalizeCheck),
  errorScenarios,
  rollbackRehearsal: null,
  knownIssues,
  unresolvedItems,
  completionStatus: "incomplete",
  isComplete: false,
  acceptance: {
    "2.1_matrix": {
      status:
        matrix.length === 36 && matrix.every((cell) => cell.status === "verified")
          ? "verified"
          : "failed_with_known_issue",
      verifiedCells: matrix.filter((cell) => cell.status === "verified").length,
      failedCells: matrix.filter((cell) => cell.status === "unverified").length,
      evidencePath: "evidence/launch-matrix-observations.json",
    },
    "2.2_visible_entries": {
      status: "verified",
      totalChecks: linkChecks.length + buttonChecks.length,
      passedChecks: [...linkChecks, ...buttonChecks].filter((check) => check.passed)
        .length,
      evidencePaths: ["evidence/link-checks.json", "evidence/button-checks.json"],
    },
    "3.1_error_scenarios": {
      status: errorScenarios.every((scenario) => scenario.passed)
        ? "verified"
        : "failed",
      evidencePath: "evidence/error-scenarios.json",
    },
    "3.2_deployed_environment": {
      status: "verified_with_screenshot_gap",
      url: "https://app.startkiter.dev",
      evidencePath: "evidence/launch-matrix-observations.json",
    },
    "4.1_rollback": {
      status: "out_of_scope_not_executed",
      reason: "本任務明確不含 4.1，且禁止對正式站執行回滾。",
    },
    "6.1_scope": {
      status: "verified",
      allowedRoots: [
        "docs/verification/",
        "openspec/changes/platform-launch-verification-evidence/evidence/",
      ],
    },
    "6.2_mitigations": {
      status: "verified",
      items: [
        {
          risk: "36 格執行成本高",
          mitigation:
            "批次腳本固定角色、主題、語言、viewport 組合，JSON 留存 36 格唯一鍵。",
        },
        {
          risk: "回滾排練影響正式環境",
          mitigation:
            "本輪不碰正式站回滾；後續改在 TEST/preview 低流量時段排練。",
        },
        {
          risk: "未來新增 App 擴大驗收範圍",
          mitigation:
            "以 appId 分組，新增 App 只新增該 App 的矩陣與 link checks；共用元件變更才重跑全量。",
        },
      ],
    },
  },
  validation: {
    reportGenerator: "docs/verification/launch-evidence-report.mjs",
    status: "incomplete_by_design",
    reason:
      "現有 generator 對 rollbackRehearsal=null 會拒絕 completion report；本任務排除 4.1，故保留 null 並明列 unresolvedItems。另有 24 格 zh-cn/en workspaceLabel i18n 已知失敗。",
  },
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(outputPath);
