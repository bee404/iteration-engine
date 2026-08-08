import { randomUUID } from "node:crypto";
import { assertWritesAllowed } from "@/lib/demo-mode";
import { getDbClient } from "./client";
import type {
  ApprovalStatus,
  Critique,
  Direction,
  GeneratedCode,
  Project,
  Round,
} from "@/lib/types";

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function createProject(input: { name: string; description?: string }): Promise<Project> {
  assertWritesAllowed("createProject");
  const db = getDbClient();
  const id = randomUUID();
  const createdAt = nowIso();

  await db.execute({
    sql: `INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, input.name, input.description ?? null, createdAt, createdAt],
  });

  return { id, name: input.name, description: input.description ?? null, createdAt, updatedAt: createdAt };
}

export async function listProjects(): Promise<Project[]> {
  const db = getDbClient();
  const result = await db.execute(`SELECT * FROM projects ORDER BY created_at DESC`);
  return result.rows.map(rowToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const db = getDbClient();
  const result = await db.execute({ sql: `SELECT * FROM projects WHERE id = ?`, args: [id] });
  const row = result.rows[0];
  return row ? rowToProject(row) : null;
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description == null ? null : String(row.description),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Rounds (+ nested critique / directions / generated_code)
// ---------------------------------------------------------------------------

export interface CreateRoundInput {
  projectId: string;
  previousRoundId?: string | null;
  screenshotRef: string;
  designGoal: string;
  feedbackText: string;
  reviewerContext?: string | null;
  constraints?: string | null;
  critique?: Critique | null;
  directions?: Direction[];
  selectedDirectionId?: string | null;
  generatedCode?: Array<{ directionId: string; language: string; code: string; status: GeneratedCode["status"] }>;
  approvalStatus?: ApprovalStatus;
}

export async function createRound(input: CreateRoundInput): Promise<Round> {
  assertWritesAllowed("createRound");
  const db = getDbClient();
  const id = randomUUID();
  const createdAt = nowIso();
  const approvalStatus = input.approvalStatus ?? "pending";

  await db.execute({
    sql: `INSERT INTO rounds (
            id, project_id, previous_round_id, screenshot_ref, design_goal, feedback_text,
            reviewer_context, constraints, selected_direction_id, approval_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.projectId,
      input.previousRoundId ?? null,
      input.screenshotRef,
      input.designGoal,
      input.feedbackText,
      input.reviewerContext ?? null,
      input.constraints ?? null,
      input.selectedDirectionId ?? null,
      approvalStatus,
      createdAt,
      createdAt,
    ],
  });

  let critique: Critique | null = null;
  if (input.critique) {
    critique = input.critique;
    await db.execute({
      sql: `INSERT INTO critiques (id, round_id, summary, signal_json, preference_json, flagged_ambiguities_json, model, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        id,
        critique.summary,
        JSON.stringify(critique.signal),
        JSON.stringify(critique.preference),
        JSON.stringify(critique.flaggedAmbiguities),
        critique.model,
        createdAt,
      ],
    });
  }

  const directions = input.directions ?? [];
  for (const [index, direction] of directions.entries()) {
    await db.execute({
      sql: `INSERT INTO directions (id, round_id, title, rationale, tradeoffs, suggested_changes_json, pattern_reference_json, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        direction.id,
        id,
        direction.title,
        direction.rationale,
        direction.tradeoffs,
        JSON.stringify(direction.suggestedChanges),
        direction.patternReference ? JSON.stringify(direction.patternReference) : null,
        index,
        createdAt,
      ],
    });
  }

  const generatedCode: GeneratedCode[] = [];
  for (const entry of input.generatedCode ?? []) {
    const codeId = randomUUID();
    await db.execute({
      sql: `INSERT INTO generated_code (id, direction_id, round_id, language, code, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [codeId, entry.directionId, id, entry.language, entry.code, entry.status, createdAt],
    });
    generatedCode.push({ id: codeId, directionId: entry.directionId, language: entry.language, code: entry.code, status: entry.status, createdAt });
  }

  return {
    id,
    projectId: input.projectId,
    previousRoundId: input.previousRoundId ?? null,
    screenshotRef: input.screenshotRef,
    designGoal: input.designGoal,
    feedbackText: input.feedbackText,
    reviewerContext: input.reviewerContext ?? null,
    constraints: input.constraints ?? null,
    critique,
    directions,
    selectedDirectionId: input.selectedDirectionId ?? null,
    generatedCode,
    approvalStatus,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function listRounds(projectId?: string): Promise<Round[]> {
  const db = getDbClient();
  const result = projectId
    ? await db.execute({ sql: `SELECT * FROM rounds WHERE project_id = ? ORDER BY created_at DESC`, args: [projectId] })
    : await db.execute(`SELECT * FROM rounds ORDER BY created_at DESC`);

  const rounds: Round[] = [];
  for (const row of result.rows) {
    rounds.push(await hydrateRound(row));
  }
  return rounds;
}

export async function getRound(id: string): Promise<Round | null> {
  const db = getDbClient();
  const result = await db.execute({ sql: `SELECT * FROM rounds WHERE id = ?`, args: [id] });
  const row = result.rows[0];
  return row ? hydrateRound(row) : null;
}

export async function updateRoundApproval(
  id: string,
  approvalStatus: ApprovalStatus,
  selectedDirectionId?: string | null,
): Promise<void> {
  assertWritesAllowed("updateRoundApproval");
  const db = getDbClient();
  await db.execute({
    sql: `UPDATE rounds SET approval_status = ?, selected_direction_id = COALESCE(?, selected_direction_id), updated_at = ? WHERE id = ?`,
    args: [approvalStatus, selectedDirectionId ?? null, nowIso(), id],
  });
}

async function hydrateRound(row: Record<string, unknown>): Promise<Round> {
  const db = getDbClient();
  const roundId = String(row.id);

  const critiqueResult = await db.execute({ sql: `SELECT * FROM critiques WHERE round_id = ? LIMIT 1`, args: [roundId] });
  const critiqueRow = critiqueResult.rows[0];
  const critique: Critique | null = critiqueRow
    ? {
        summary: String(critiqueRow.summary),
        signal: JSON.parse(String(critiqueRow.signal_json)),
        preference: JSON.parse(String(critiqueRow.preference_json)),
        flaggedAmbiguities: JSON.parse(String(critiqueRow.flagged_ambiguities_json)),
        model: String(critiqueRow.model),
      }
    : null;

  const directionsResult = await db.execute({
    sql: `SELECT * FROM directions WHERE round_id = ? ORDER BY sort_order ASC`,
    args: [roundId],
  });
  const directions: Direction[] = directionsResult.rows.map((d) => ({
    id: String(d.id),
    title: String(d.title),
    rationale: String(d.rationale),
    tradeoffs: String(d.tradeoffs),
    suggestedChanges: JSON.parse(String(d.suggested_changes_json)),
    patternReference: d.pattern_reference_json ? JSON.parse(String(d.pattern_reference_json)) : null,
  }));

  const codeResult = await db.execute({ sql: `SELECT * FROM generated_code WHERE round_id = ?`, args: [roundId] });
  const generatedCode: GeneratedCode[] = codeResult.rows.map((c) => ({
    id: String(c.id),
    directionId: String(c.direction_id),
    language: String(c.language),
    code: String(c.code),
    status: c.status as GeneratedCode["status"],
    createdAt: String(c.created_at),
  }));

  return {
    id: roundId,
    projectId: String(row.project_id),
    previousRoundId: row.previous_round_id == null ? null : String(row.previous_round_id),
    screenshotRef: String(row.screenshot_ref),
    designGoal: String(row.design_goal),
    feedbackText: String(row.feedback_text),
    reviewerContext: row.reviewer_context == null ? null : String(row.reviewer_context),
    constraints: row.constraints == null ? null : String(row.constraints),
    critique,
    directions,
    selectedDirectionId: row.selected_direction_id == null ? null : String(row.selected_direction_id),
    generatedCode,
    approvalStatus: row.approval_status as ApprovalStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
