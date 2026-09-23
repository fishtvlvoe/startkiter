import test from "node:test";
import assert from "node:assert/strict";

import {
  LaunchEvidenceValidationError,
  generateLaunchEvidenceReport,
} from "./launch-evidence-report.mjs";

const ROLES = ["app-user", "app-admin", "super-admin"];
const THEMES = ["dark", "light"];
const LOCALES = ["zh-tw", "zh-cn", "en"];
const VIEWPORTS = ["1440", "390"];

const REQUIRED_ERROR_SCENARIOS = [
  "unauthorized route",
  "invalid form input",
  "simulated timeout",
];

function matrixCellKey(cell) {
  return `${cell.role}/${cell.theme}/${cell.locale}/${cell.viewport}`;
}

function completeMatrix(transform = () => ({})) {
  return ROLES.flatMap((role) =>
    THEMES.flatMap((theme) =>
      LOCALES.flatMap((locale) =>
        VIEWPORTS.map((viewport) => ({
          role,
          theme,
          locale,
          viewport,
          status: "verified",
          evidencePath: `/tmp/verification/${role}-${theme}-${locale}-${viewport}.txt`,
          ...transform({ role, theme, locale, viewport }),
        })),
      ),
    ),
  );
}

function passingErrorScenarios() {
  return REQUIRED_ERROR_SCENARIOS.map((scenario) => ({
    scenario,
    expected: `${scenario} shows a safe handled error`,
    actual: `${scenario} showed a safe handled error`,
    passed: true,
  }));
}

function validInput(overrides = {}) {
  return {
    changeId: "platform-launch-verification-evidence",
    matrix: completeMatrix(),
    linkChecks: [
      {
        appId: "platform",
        entryId: "settings",
        expectedOutcome: "opens settings",
        actualOutcome: "opens settings",
        passed: true,
      },
    ],
    errorScenarios: passingErrorScenarios(),
    rollbackRehearsal: {
      executedAt: "2026-09-23T00:00:00Z",
      command: "rollback --preview",
      healthCheckResult: "HTTP 200",
    },
    unresolvedItems: [],
    ...overrides,
  };
}

test("1.1 accepts a complete 36-cell matrix", () => {
  const report = generateLaunchEvidenceReport(validInput());

  assert.equal(report.matrix.length, 36);
  assert.equal(report.isComplete, true);
  assert.equal(report.completionStatus, "complete");
});

test("1.1 accepts not-applicable cells only with a stated reason", () => {
  const matrix = completeMatrix(({ role, theme, locale, viewport }) => {
    if (matrixCellKey({ role, theme, locale, viewport }) === "super-admin/dark/en/390") {
      return {
        status: "not-applicable",
        evidencePath: undefined,
        reason: "no super-admin-only mobile-only feature",
      };
    }
    return {};
  });

  const report = generateLaunchEvidenceReport(validInput({ matrix }));

  assert.equal(report.isComplete, true);
});

test("1.1 rejects a missing matrix cell and names the combination", () => {
  const matrix = completeMatrix().slice(0, -1);

  assert.throws(
    () => generateLaunchEvidenceReport(validInput({ matrix })),
    (error) => {
      assert.ok(error instanceof LaunchEvidenceValidationError);
      assert.match(error.message, /super-admin\/light\/en\/390/);
      return true;
    },
  );
});

test("1.1 rejects an unverified matrix cell", () => {
  const matrix = completeMatrix(({ role, theme, locale, viewport }) => {
    if (matrixCellKey({ role, theme, locale, viewport }) === "app-user/dark/zh-tw/1440") {
      return { status: "unverified", evidencePath: undefined };
    }
    return {};
  });

  assert.throws(
    () => generateLaunchEvidenceReport(validInput({ matrix })),
    (error) => {
      assert.ok(error instanceof LaunchEvidenceValidationError);
      assert.match(error.message, /unverified/);
      return true;
    },
  );
});

test("1.2 rejects the report when one link check fails", () => {
  const linkChecks = [
    {
      appId: "platform",
      entryId: "upgrade",
      expectedOutcome: "opens billing",
      actualOutcome: "500 error page",
      passed: false,
    },
  ];

  assert.throws(
    () => generateLaunchEvidenceReport(validInput({ linkChecks })),
    (error) => {
      assert.ok(error instanceof LaunchEvidenceValidationError);
      assert.match(error.message, /upgrade/);
      return true;
    },
  );
});

test("1.3 accepts all three exercised error scenarios", () => {
  const report = generateLaunchEvidenceReport(validInput());

  assert.equal(report.errorScenarios.length, 3);
  assert.equal(report.isComplete, true);
});

test("1.3 rejects a report when any required error scenario is missing", () => {
  for (const missingScenario of REQUIRED_ERROR_SCENARIOS) {
    const errorScenarios = passingErrorScenarios().filter(
      ({ scenario }) => scenario !== missingScenario,
    );

    assert.throws(
      () => generateLaunchEvidenceReport(validInput({ errorScenarios })),
      (error) => {
        assert.ok(error instanceof LaunchEvidenceValidationError);
        assert.match(error.message, new RegExp(missingScenario));
        return true;
      },
      `missing ${missingScenario} must reject`,
    );
  }
});

test("1.3 rejects an error scenario without an actual outcome", () => {
  const errorScenarios = passingErrorScenarios().map((entry) =>
    entry.scenario === "invalid form input" ? { ...entry, actual: "" } : entry,
  );

  assert.throws(
    () => generateLaunchEvidenceReport(validInput({ errorScenarios })),
    (error) => {
      assert.ok(error instanceof LaunchEvidenceValidationError);
      assert.match(error.message, /invalid form input/);
      return true;
    },
  );
});

test("1.4 rejects a report without a rollback rehearsal", () => {
  assert.throws(
    () => generateLaunchEvidenceReport(validInput({ rollbackRehearsal: null })),
    (error) => {
      assert.ok(error instanceof LaunchEvidenceValidationError);
      assert.match(error.message, /rollbackRehearsal/);
      return true;
    },
  );
});

test("1.5 rejects a report that omits unresolvedItems", () => {
  const input = validInput();
  delete input.unresolvedItems;

  assert.throws(
    () => generateLaunchEvidenceReport(input),
    (error) => {
      assert.ok(error instanceof LaunchEvidenceValidationError);
      assert.match(error.message, /unresolvedItems/);
      return true;
    },
  );
});

test("1.5 accepts an explicitly empty unresolvedItems array", () => {
  const report = generateLaunchEvidenceReport(validInput({ unresolvedItems: [] }));

  assert.deepEqual(report.unresolvedItems, []);
  assert.equal(report.isComplete, true);
});

test("1.5 keeps non-empty unresolvedItems visible and does not claim completion", () => {
  const report = generateLaunchEvidenceReport(
    validInput({ unresolvedItems: ["preview URL not yet verified"] }),
  );

  assert.deepEqual(report.unresolvedItems, ["preview URL not yet verified"]);
  assert.equal(report.isComplete, false);
  assert.equal(report.completionStatus, "incomplete");
});
