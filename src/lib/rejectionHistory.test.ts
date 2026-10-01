import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REJECTION_FIELD_LABELS,
  isRejectionCorrection,
  rejectionCorrectionData,
  rejectionCorrectionFields,
  repliedInPastRejection,
  type HistoryEntry,
  type RejectionValues,
} from "./rejectionHistory.ts";
import type { RejectionReason } from "./types.ts";

const REJECTED_STAGE = "rejeitado";
const isRejectionStage = (stageId: string) => stageId === REJECTED_STAGE;

function at(iso: string): Date {
  return new Date(iso);
}

function current(overrides: Partial<RejectionValues> = {}): RejectionValues {
  return {
    reason: "PERFIL_NAO_ADERENTE",
    note: "Feedback do recrutador",
    rejectedAt: at("2026-09-11T12:00:00Z"),
    ...overrides,
  };
}

const created = (toStageId = "interesse"): HistoryEntry => ({
  type: "CREATED",
  toStageId,
  data: null,
});
const moved = (toStageId: string): HistoryEntry => ({
  type: "STAGE_CHANGED",
  toStageId,
  data: null,
});
const rejected = (reason?: string): HistoryEntry => ({
  type: "REJECTED",
  toStageId: REJECTED_STAGE,
  data: reason ? { reason } : {},
});
const restored = (toStageId = "aplicado"): HistoryEntry => ({
  type: "RESTORED",
  toStageId,
  data: null,
});
const corrected = (
  reason: RejectionReason,
  previousReason: RejectionReason
): HistoryEntry => ({
  type: "EDITED",
  toStageId: null,
  data: rejectionCorrectionData({
    fields: [REJECTION_FIELD_LABELS.reason],
    reason,
    previousReason,
    note: null,
  }),
});

describe("rejectionCorrectionFields", () => {
  it("is empty when nothing changed", () => {
    assert.deepEqual(rejectionCorrectionFields(current(), current()), []);
  });

  it("lists the reason when only the reason changed", () => {
    assert.deepEqual(
      rejectionCorrectionFields(current(), current({ reason: "SEM_RETORNO" })),
      [REJECTION_FIELD_LABELS.reason]
    );
  });

  it("lists every changed field in form order", () => {
    assert.deepEqual(
      rejectionCorrectionFields(
        current(),
        current({
          reason: "OUTRO",
          note: null,
          rejectedAt: at("2026-09-12T12:00:00Z"),
        })
      ),
      [
        REJECTION_FIELD_LABELS.reason,
        REJECTION_FIELD_LABELS.rejectedAt,
        REJECTION_FIELD_LABELS.note,
      ]
    );
  });

  it("compares dates by value, not by identity", () => {
    assert.deepEqual(
      rejectionCorrectionFields(
        current(),
        current({ rejectedAt: at("2026-09-11T12:00:00Z") })
      ),
      []
    );
  });
});

describe("isRejectionCorrection", () => {
  it("recognises the data written for a correction", () => {
    const data = rejectionCorrectionData({
      fields: [REJECTION_FIELD_LABELS.note],
      reason: "OUTRO",
      previousReason: "OUTRO",
      note: "Nova observação",
    });
    assert.equal(isRejectionCorrection(data), true);
  });

  it("does not take other edits for a correction", () => {
    assert.equal(isRejectionCorrection({ fields: ["empresa"] }), false);
    assert.equal(isRejectionCorrection({ resumeName: "CV.pdf" }), false);
    assert.equal(isRejectionCorrection(null), false);
  });
});

describe("repliedInPastRejection", () => {
  it("counts a Rejection the Application left with a reply reason", () => {
    const events = [created(), rejected("ENTREVISTA"), restored()];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), true);
  });

  it("does not count a Rejection the Application left with no reply", () => {
    const events = [created(), rejected("SEM_RETORNO"), restored()];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), false);
  });

  it("uses the corrected reason: corrected to no reply is no reply", () => {
    const events = [
      created(),
      moved("aplicado"),
      rejected("PERFIL_NAO_ADERENTE"),
      corrected("SEM_RETORNO", "PERFIL_NAO_ADERENTE"),
      restored(),
    ];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), false);
  });

  it("uses the corrected reason: corrected from no reply is a reply", () => {
    const events = [
      created(),
      rejected("SEM_RETORNO"),
      corrected("ENTREVISTA", "SEM_RETORNO"),
      restored(),
    ];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), true);
  });

  it("uses the last reason when a correction was recorded as a REJECTED event", () => {
    const events = [
      created(),
      rejected("ENTREVISTA"),
      rejected("SEM_RETORNO"),
      restored(),
    ];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), false);
  });

  it("leaves the Rejection the Application is still in to its current reason", () => {
    const events = [created(), rejected("ENTREVISTA")];
    assert.equal(repliedInPastRejection(events, isRejectionStage, true), false);
  });

  it("still counts an earlier Rejection while the Application is rejected again", () => {
    const events = [
      created(),
      rejected("ENTREVISTA"),
      restored(),
      rejected("SEM_RETORNO"),
    ];
    assert.equal(repliedInPastRejection(events, isRejectionStage, true), true);
  });

  it("counts a Rejection left without a recorded Restore", () => {
    const events = [created(), rejected("ENTREVISTA")];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), true);
  });

  it("ignores corrections outside a Rejection and plain edits", () => {
    const events = [
      created(),
      corrected("ENTREVISTA", "SEM_RETORNO"),
      { type: "EDITED", toStageId: null, data: { fields: ["empresa"] } },
      moved("aplicado"),
    ];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), false);
  });

  it("does not count a Rejection without a reason", () => {
    const events = [created(), rejected(), restored()];
    assert.equal(repliedInPastRejection(events, isRejectionStage, false), false);
  });
});
