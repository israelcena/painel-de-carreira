import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTO_REJECTION_SETTING_KEYS,
  DEFAULT_IDLE_LIMIT_DAYS,
  IDLE_LIMIT_MAX,
  IDLE_LIMIT_MIN,
  autoRejectionNote,
  autoRejectionReason,
  findIdleRejections,
  idleClockStart,
  idleDeadline,
  parseIdleLimitDays,
  readAutoRejectionSettings,
  type IdleCandidate,
  type IdleStage,
} from "./autoRejection.ts";

// Same pipeline as prisma/seed.mjs, deliberately out of order: Interest and
// Offer are resolved by Stage order, never by position in the list or by name.
const STAGES: IdleStage[] = [
  { id: "oferta", name: "Oferta", order: 6, isRejection: false },
  { id: "rejeitado", name: "Rejeitado", order: 7, isRejection: true },
  { id: "interesse", name: "Interesse", order: 1, isRejection: false },
  { id: "aplicado", name: "Aplicado", order: 2, isRejection: false },
  { id: "contato", name: "Contato/Screening", order: 3, isRejection: false },
  { id: "entrevista", name: "Entrevista", order: 4, isRejection: false },
  { id: "teste", name: "Teste Técnico", order: 5, isRejection: false },
];

function at(iso: string): Date {
  return new Date(iso);
}

function candidate(overrides: Partial<IdleCandidate> = {}): IdleCandidate {
  return {
    id: "app-1",
    stageId: "aplicado",
    archivedAt: null,
    createdAt: at("2026-09-01T12:00:00Z"),
    nextActionAt: null,
    lastStageEntryAt: at("2026-09-01T12:00:00Z"),
    lastUnarchivedAt: null,
    ...overrides,
  };
}

describe("idleClockStart", () => {
  it("uses the stage entry when it is the latest source", () => {
    const app = candidate({
      lastStageEntryAt: at("2026-09-10T08:00:00Z"),
      nextActionAt: at("2026-09-05T12:00:00Z"),
      lastUnarchivedAt: at("2026-09-03T09:00:00Z"),
    });
    assert.deepEqual(idleClockStart(app), at("2026-09-10T08:00:00Z"));
  });

  it("uses the Next action when it is the latest source", () => {
    const app = candidate({
      lastStageEntryAt: at("2026-09-01T08:00:00Z"),
      nextActionAt: at("2026-09-15T12:00:00Z"),
      lastUnarchivedAt: at("2026-09-03T09:00:00Z"),
    });
    assert.deepEqual(idleClockStart(app), at("2026-09-15T12:00:00Z"));
  });

  it("uses the latest unarchive when it is the latest source", () => {
    const app = candidate({
      lastStageEntryAt: at("2026-09-01T08:00:00Z"),
      nextActionAt: at("2026-09-05T12:00:00Z"),
      lastUnarchivedAt: at("2026-09-20T09:00:00Z"),
    });
    assert.deepEqual(idleClockStart(app), at("2026-09-20T09:00:00Z"));
  });

  it("falls back to the creation date without a stage entry event", () => {
    const app = candidate({
      createdAt: at("2026-08-20T10:00:00Z"),
      lastStageEntryAt: null,
    });
    assert.deepEqual(idleClockStart(app), at("2026-08-20T10:00:00Z"));
  });
});

describe("idleDeadline", () => {
  it("adds the limit in whole days to the clock start", () => {
    const app = candidate({ lastStageEntryAt: at("2026-09-01T12:00:00Z") });
    assert.deepEqual(idleDeadline(app, 10), at("2026-09-11T12:00:00Z"));
    assert.deepEqual(idleDeadline(app, 1), at("2026-09-02T12:00:00Z"));
  });

  it("matches the agreed example: Next action on the 15th, 10 days → the 25th", () => {
    const app = candidate({
      lastStageEntryAt: at("2026-09-01T12:00:00Z"),
      nextActionAt: at("2026-09-15T12:00:00Z"),
    });
    assert.deepEqual(idleDeadline(app, 10), at("2026-09-25T12:00:00Z"));
  });
});

describe("autoRejectionReason", () => {
  it("is OUTRO for the first and the last non-rejection Stage", () => {
    assert.equal(autoRejectionReason("interesse", STAGES), "OUTRO");
    assert.equal(autoRejectionReason("oferta", STAGES), "OUTRO");
  });

  it("is SEM_RETORNO for every Stage in between", () => {
    for (const id of ["aplicado", "contato", "entrevista", "teste"]) {
      assert.equal(autoRejectionReason(id, STAGES), "SEM_RETORNO", id);
    }
  });

  it("resolves the first and last Stage by order, not by name", () => {
    const renamed: IdleStage[] = [
      { id: "b", name: "Interesse", order: 20, isRejection: false },
      { id: "x", name: "Rejeitado", order: 99, isRejection: true },
      { id: "c", name: "Oferta", order: 30, isRejection: false },
      { id: "a", name: "Aplicado", order: 10, isRejection: false },
    ];
    assert.equal(autoRejectionReason("a", renamed), "OUTRO");
    assert.equal(autoRejectionReason("b", renamed), "SEM_RETORNO");
    assert.equal(autoRejectionReason("c", renamed), "OUTRO");
  });
});

describe("autoRejectionNote", () => {
  it("uses the singular for one day", () => {
    assert.equal(
      autoRejectionNote(1, "Aplicado"),
      "Movida automaticamente após 1 dia sem movimentação em Aplicado."
    );
  });

  it("uses the plural for more than one day", () => {
    assert.equal(
      autoRejectionNote(10, "Entrevista"),
      "Movida automaticamente após 10 dias sem movimentação em Entrevista."
    );
  });
});

describe("findIdleRejections", () => {
  const deadline = at("2026-09-11T12:00:00Z");

  it("leaves the Application alone just before the deadline", () => {
    const result = findIdleRejections(
      [candidate()],
      STAGES,
      10,
      new Date(deadline.getTime() - 1)
    );
    assert.deepEqual(result, []);
  });

  it("rejects the Application at the deadline, dated at the deadline", () => {
    const result = findIdleRejections([candidate()], STAGES, 10, deadline);
    assert.deepEqual(result, [
      {
        applicationId: "app-1",
        fromStageId: "aplicado",
        fromStageName: "Aplicado",
        reason: "SEM_RETORNO",
        note: "Movida automaticamente após 10 dias sem movimentação em Aplicado.",
        rejectedAt: deadline,
      },
    ]);
  });

  it("dates the Rejection at the deadline even when the sweep runs later", () => {
    const [result] = findIdleRejections(
      [candidate()],
      STAGES,
      10,
      at("2026-09-30T08:00:00Z")
    );
    assert.deepEqual(result.rejectedAt, deadline);
  });

  it("keeps an Application with a Next action today or in the future", () => {
    const now = at("2026-09-30T18:00:00Z");
    const today = candidate({ nextActionAt: at("2026-09-30T12:00:00Z") });
    const future = candidate({
      id: "app-2",
      nextActionAt: at("2026-10-05T12:00:00Z"),
    });
    assert.deepEqual(findIdleRejections([today, future], STAGES, 1, now), []);
  });

  it("restarts the count when the Application is unarchived", () => {
    const now = at("2026-09-30T12:00:00Z");
    const app = candidate({ lastUnarchivedAt: at("2026-09-25T12:00:00Z") });
    assert.deepEqual(findIdleRejections([app], STAGES, 10, now), []);
    const [later] = findIdleRejections(
      [app],
      STAGES,
      10,
      at("2026-10-05T12:00:00Z")
    );
    assert.deepEqual(later.rejectedAt, at("2026-10-05T12:00:00Z"));
  });

  it("skips Applications already in the Rejected Stage", () => {
    const app = candidate({ stageId: "rejeitado" });
    const now = at("2026-12-31T12:00:00Z");
    assert.deepEqual(findIdleRejections([app], STAGES, 10, now), []);
  });

  it("skips archived Applications", () => {
    const app = candidate({ archivedAt: at("2026-09-02T12:00:00Z") });
    const now = at("2026-12-31T12:00:00Z");
    assert.deepEqual(findIdleRejections([app], STAGES, 10, now), []);
  });

  it("skips Applications whose Stage is unknown", () => {
    const app = candidate({ stageId: "gone" });
    const now = at("2026-12-31T12:00:00Z");
    assert.deepEqual(findIdleRejections([app], STAGES, 10, now), []);
  });

  it("rejects nothing when automatic rejection is off", () => {
    const now = at("2026-12-31T12:00:00Z");
    assert.deepEqual(findIdleRejections([candidate()], STAGES, null, now), []);
  });

  it("picks the reason and note from the Stage the Application was in", () => {
    const now = at("2026-12-31T12:00:00Z");
    const result = findIdleRejections(
      [
        candidate({ id: "i", stageId: "interesse" }),
        candidate({
          id: "o",
          stageId: "oferta",
          lastStageEntryAt: at("2026-09-02T12:00:00Z"),
        }),
      ],
      STAGES,
      1,
      now
    );
    assert.deepEqual(
      result.map((r) => [r.applicationId, r.reason, r.note]),
      [
        [
          "i",
          "OUTRO",
          "Movida automaticamente após 1 dia sem movimentação em Interesse.",
        ],
        [
          "o",
          "OUTRO",
          "Movida automaticamente após 1 dia sem movimentação em Oferta.",
        ],
      ]
    );
  });

  it("orders the results by deadline, oldest first", () => {
    const now = at("2026-12-31T12:00:00Z");
    const result = findIdleRejections(
      [
        candidate({ id: "newest", lastStageEntryAt: at("2026-09-20T12:00:00Z") }),
        candidate({ id: "oldest", lastStageEntryAt: at("2026-09-01T12:00:00Z") }),
        candidate({ id: "fresh", lastStageEntryAt: at("2026-12-30T12:00:00Z") }),
        candidate({ id: "middle", lastStageEntryAt: at("2026-09-10T12:00:00Z") }),
      ],
      STAGES,
      10,
      now
    );
    assert.deepEqual(
      result.map((r) => r.applicationId),
      ["oldest", "middle", "newest"]
    );
  });
});

describe("parseIdleLimitDays", () => {
  it("accepts whole days within the allowed range", () => {
    assert.equal(parseIdleLimitDays(IDLE_LIMIT_MIN), 1);
    assert.equal(parseIdleLimitDays(10), 10);
    assert.equal(parseIdleLimitDays(IDLE_LIMIT_MAX), 90);
  });

  it("rejects values outside the range or not numbers", () => {
    for (const value of [0, 91, -5, Number.NaN, Infinity, "10", null]) {
      assert.equal(parseIdleLimitDays(value), null, String(value));
    }
  });
});

describe("readAutoRejectionSettings", () => {
  it("defaults to on with the default limit when nothing is stored", () => {
    assert.deepEqual(readAutoRejectionSettings({}), {
      enabled: true,
      days: DEFAULT_IDLE_LIMIT_DAYS,
    });
  });

  it("reads the stored switch and limit", () => {
    assert.deepEqual(
      readAutoRejectionSettings({ enabled: "false", days: "25" }),
      { enabled: false, days: 25 }
    );
    assert.deepEqual(
      readAutoRejectionSettings({ enabled: "true", days: "1" }),
      { enabled: true, days: 1 }
    );
  });

  it("falls back to the default limit when the stored one is invalid", () => {
    for (const days of ["0", "91", "abc", ""]) {
      assert.equal(readAutoRejectionSettings({ days }).days, 10, days);
    }
  });

  it("uses the agreed setting keys", () => {
    assert.deepEqual(AUTO_REJECTION_SETTING_KEYS, {
      enabled: "autoRejectionEnabled",
      days: "idleLimitDays",
    });
  });
});
