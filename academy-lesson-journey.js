const DEFAULT = Object.freeze({
  surface: 0,
  mission: Object.freeze({ built: false, cut: false }),
  myths: Object.freeze([false, false, false]),
  masteryBest: 0,
  masteryAttempts: 0,
  masteryAttemptId: null,
  lastSubmission: null
});

const count = value => Number.isFinite(Number(value))
  ? Math.max(0, Math.floor(Number(value)))
  : 0;

const nonEmptyId = value => typeof value === 'string' && value.length > 0
  ? value
  : null;

export function freshLessonJourney() {
  return {
    surface: 0,
    mission: { ...DEFAULT.mission },
    myths: [...DEFAULT.myths],
    masteryBest: 0,
    masteryAttempts: 0,
    masteryAttemptId: null,
    lastSubmission: null
  };
}

export function mergeLessonJourney(saved) {
  const base = freshLessonJourney();
  if (!saved || typeof saved !== 'object') return base;

  const masteryAttemptId = nonEmptyId(saved.masteryAttemptId);
  const submission = saved.lastSubmission;
  const submissionAttemptId = nonEmptyId(submission?.attemptId);
  const lastSubmission = submissionAttemptId && submission?.summary &&
    typeof submission.summary === 'object' && !Array.isArray(submission.summary)
      ? {
          attemptId: submissionAttemptId,
          summary: { ...submission.summary }
        }
      : null;

  return {
    surface: Math.max(0, Math.min(5, count(saved.surface))),
    mission: {
      built: Boolean(saved.mission?.built),
      cut: Boolean(saved.mission?.cut)
    },
    myths: base.myths.map((value, index) => Boolean(saved.myths?.[index] ?? value)),
    masteryBest: Math.min(5, count(saved.masteryBest)),
    masteryAttempts: count(saved.masteryAttempts),
    masteryAttemptId,
    lastSubmission
  };
}
