/**
 * @typedef {Object} VerificationCell
 * @property {"app-user"|"app-admin"|"super-admin"} role
 * @property {"dark"|"light"} theme
 * @property {"zh-tw"|"zh-cn"|"en"} locale
 * @property {"1440"|"390"} viewport
 * @property {"verified"|"not-applicable"|"unverified"} status
 * @property {string} [evidencePath]
 * @property {string} [reason]
 */

/**
 * @typedef {Object} LinkVerification
 * @property {string} appId
 * @property {string} entryId
 * @property {string} expectedOutcome
 * @property {string} actualOutcome
 * @property {boolean} passed
 */

/**
 * @typedef {Object} ErrorScenario
 * @property {string} scenario
 * @property {string} expected
 * @property {string} actual
 * @property {boolean} passed
 */

/**
 * @typedef {Object} LaunchEvidenceInput
 * @property {string} changeId
 * @property {VerificationCell[]} matrix
 * @property {LinkVerification[]} linkChecks
 * @property {ErrorScenario[]} errorScenarios
 * @property {{executedAt: string, command: string, healthCheckResult: string}|null} rollbackRehearsal
 * @property {string[]} unresolvedItems
 */

/**
 * @typedef {LaunchEvidenceInput & {
 *   isComplete: boolean,
 *   completionStatus: "complete"|"incomplete"
 * }} LaunchEvidenceReport
 */

export const MATRIX_SIZE = 36;

export const REQUIRED_ERROR_SCENARIOS = Object.freeze([
  "unauthorized route",
  "invalid form input",
  "simulated timeout",
]);

const MATRIX_AXES = Object.freeze({
  role: ["app-user", "app-admin", "super-admin"],
  theme: ["dark", "light"],
  locale: ["zh-tw", "zh-cn", "en"],
  viewport: ["1440", "390"],
});

const REQUIRED_ERROR_ALIASES = new Map([
  ["unauthorized-route", "unauthorized route"],
  ["unauthorized", "unauthorized route"],
  ["invalid-form-input", "invalid form input"],
  ["invalid-input", "invalid form input"],
  ["simulated-timeout", "simulated timeout"],
  ["network-timeout", "simulated timeout"],
  ["timeout", "simulated timeout"],
]);

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeScenario(value) {
  if (!nonEmptyString(value)) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return REQUIRED_ERROR_ALIASES.get(normalized) ?? null;
}

function matrixKey(cell) {
  return `${cell.role}/${cell.theme}/${cell.locale}/${cell.viewport}`;
}

function expectedMatrixKeys() {
  return MATRIX_AXES.role.flatMap((role) =>
    MATRIX_AXES.theme.flatMap((theme) =>
      MATRIX_AXES.locale.flatMap((locale) =>
        MATRIX_AXES.viewport.map((viewport) =>
          `${role}/${theme}/${locale}/${viewport}`,
        ),
      ),
    ),
  );
}

function validateMatrix(matrix) {
  const issues = [];

  if (!Array.isArray(matrix)) {
    return ["matrix must be an array"];
  }

  if (matrix.length !== MATRIX_SIZE) {
    issues.push(`matrix must contain exactly ${MATRIX_SIZE} cells; received ${matrix.length}`);
  }

  const seen = new Set();

  for (const [index, cell] of matrix.entries()) {
    if (!cell || typeof cell !== "object") {
      issues.push(`matrix cell ${index} must be an object`);
      continue;
    }

    const requiredAxes = ["role", "theme", "locale", "viewport"];
    const missingAxes = requiredAxes.filter((axis) => !nonEmptyString(cell[axis]));
    if (missingAxes.length > 0) {
      issues.push(`matrix cell ${index} is missing ${missingAxes.join(", ")}`);
      continue;
    }

    const key = matrixKey(cell);
    if (seen.has(key)) {
      issues.push(`matrix contains duplicate combination: ${key}`);
    }
    seen.add(key);

    if (!MATRIX_AXES.role.includes(cell.role)) {
      issues.push(`matrix cell ${index} has invalid role: ${cell.role}`);
    }
    if (!MATRIX_AXES.theme.includes(cell.theme)) {
      issues.push(`matrix cell ${index} has invalid theme: ${cell.theme}`);
    }
    if (!MATRIX_AXES.locale.includes(cell.locale)) {
      issues.push(`matrix cell ${index} has invalid locale: ${cell.locale}`);
    }
    if (!MATRIX_AXES.viewport.includes(cell.viewport)) {
      issues.push(`matrix cell ${index} has invalid viewport: ${cell.viewport}`);
    }

    if (cell.status === "unverified") {
      issues.push(`matrix combination ${key} is unverified`);
    } else if (cell.status === "verified") {
      if (!nonEmptyString(cell.evidencePath)) {
        issues.push(`verified matrix combination ${key} needs evidencePath`);
      }
    } else if (cell.status === "not-applicable") {
      const reason = cell.reason ?? cell.notApplicableReason ?? cell.evidencePath;
      if (!nonEmptyString(reason)) {
        issues.push(`not-applicable matrix combination ${key} needs a reason`);
      }
    } else {
      issues.push(`matrix combination ${key} has invalid status: ${cell.status ?? "missing"}`);
    }
  }

  for (const key of expectedMatrixKeys()) {
    if (!seen.has(key)) {
      issues.push(`matrix missing combination: ${key}`);
    }
  }

  return issues;
}

function validateLinkChecks(linkChecks) {
  if (!Array.isArray(linkChecks)) return ["linkChecks must be an array"];

  const issues = [];
  for (const [index, check] of linkChecks.entries()) {
    if (!check || typeof check !== "object") {
      issues.push(`linkChecks entry ${index} must be an object`);
      continue;
    }

    for (const field of ["appId", "entryId", "expectedOutcome", "actualOutcome"]) {
      if (!nonEmptyString(check[field])) {
        issues.push(`linkChecks entry ${index} needs ${field}`);
      }
    }

    if (check.passed === false) {
      issues.push(`link check failed: ${check.entryId || `entry ${index}`}`);
    } else if (check.passed !== true) {
      issues.push(`linkChecks entry ${index} needs passed: true or false`);
    }
  }

  return issues;
}

function containsUnsafeErrorDetail(value) {
  return /(?:^|\n)\s*at\s+.+|(?:\/Users\/|\/home\/|\/var\/www\/|node_modules[\\/])/m.test(value);
}

function validateErrorScenarios(errorScenarios) {
  if (!Array.isArray(errorScenarios)) return ["errorScenarios must be an array"];

  const issues = [];
  const found = new Map();

  for (const [index, entry] of errorScenarios.entries()) {
    if (!entry || typeof entry !== "object") {
      issues.push(`errorScenarios entry ${index} must be an object`);
      continue;
    }

    const canonicalScenario = normalizeScenario(entry.scenario);
    if (!canonicalScenario) {
      issues.push(`errorScenarios entry ${index} has an unknown scenario`);
      continue;
    }

    if (found.has(canonicalScenario)) {
      issues.push(`errorScenarios contains duplicate scenario: ${canonicalScenario}`);
    }
    found.set(canonicalScenario, entry);

    if (!nonEmptyString(entry.expected)) {
      issues.push(`${canonicalScenario} needs an expected outcome`);
    }
    if (!nonEmptyString(entry.actual)) {
      issues.push(`${canonicalScenario} needs a recorded actual outcome`);
    } else if (containsUnsafeErrorDetail(entry.actual)) {
      issues.push(`${canonicalScenario} exposes a stack trace or internal path`);
    }
    if (entry.passed !== true) {
      issues.push(`${canonicalScenario} did not pass`);
    }
  }

  for (const requiredScenario of REQUIRED_ERROR_SCENARIOS) {
    if (!found.has(requiredScenario)) {
      issues.push(`errorScenarios missing required scenario: ${requiredScenario}`);
    }
  }

  return issues;
}

function validateRollbackRehearsal(rollbackRehearsal) {
  if (!rollbackRehearsal || typeof rollbackRehearsal !== "object") {
    return ["rollbackRehearsal must contain an executed record; null is not allowed"];
  }

  const issues = [];
  for (const field of ["executedAt", "command", "healthCheckResult"]) {
    if (!nonEmptyString(rollbackRehearsal[field])) {
      issues.push(`rollbackRehearsal needs ${field}`);
    }
  }
  return issues;
}

function validateUnresolvedItems(input) {
  if (!own(input, "unresolvedItems")) {
    return ["unresolvedItems field is required"];
  }
  if (!Array.isArray(input.unresolvedItems)) {
    return ["unresolvedItems must be an array"];
  }
  return input.unresolvedItems.flatMap((item, index) =>
    nonEmptyString(item) ? [] : [`unresolvedItems entry ${index} must be a non-empty string`],
  );
}

export class LaunchEvidenceValidationError extends Error {
  /** @param {string[]} issues */
  constructor(issues) {
    super(`Launch evidence report rejected: ${issues.join("; ")}`);
    this.name = "LaunchEvidenceValidationError";
    this.issues = Object.freeze([...issues]);
  }
}

/**
 * Validate launch evidence and produce a report only when the required
 * evidence exists. An unresolved item deliberately produces an incomplete
 * report so it cannot be mistaken for a completion claim.
 *
 * @param {LaunchEvidenceInput} input
 * @returns {LaunchEvidenceReport}
 * @throws {LaunchEvidenceValidationError}
 */
export function generateLaunchEvidenceReport(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new LaunchEvidenceValidationError(["input must be an object"]);
  }

  const issues = [];
  if (!nonEmptyString(input.changeId)) issues.push("changeId is required");
  issues.push(...validateMatrix(input.matrix));
  issues.push(...validateLinkChecks(input.linkChecks));
  issues.push(...validateErrorScenarios(input.errorScenarios));
  issues.push(...validateRollbackRehearsal(input.rollbackRehearsal));
  issues.push(...validateUnresolvedItems(input));

  if (issues.length > 0) {
    throw new LaunchEvidenceValidationError(issues);
  }

  const isComplete = input.unresolvedItems.length === 0;
  return {
    ...input,
    isComplete,
    completionStatus: isComplete ? "complete" : "incomplete",
  };
}
