import assert from 'node:assert/strict';
import { nextRecurringTime } from '../src/scheduler.js';

const ms = (iso) => new Date(iso).getTime();

assert.equal(
  nextRecurringTime('hourly', '2026-09-17T10:05:00.000Z', ms('2026-09-17T10:11:00.000Z')),
  '2026-09-17T11:05:00.000Z',
  'late hourly execution must preserve the :05 cadence',
);

assert.equal(
  nextRecurringTime('hourly', '2026-09-17T10:05:00.000Z', ms('2026-09-17T13:16:00.000Z')),
  '2026-09-17T14:05:00.000Z',
  'missed hourly slots must be skipped rather than replayed in a burst',
);

assert.equal(
  nextRecurringTime('daily', '2026-09-17T09:00:00.000Z', ms('2026-09-17T09:11:00.000Z')),
  '2026-09-18T09:00:00.000Z',
  'daily jobs must stay anchored to their original UTC clock time',
);

assert.equal(
  nextRecurringTime('weekly', '2026-09-14T07:30:00.000Z', ms('2026-09-28T08:00:00.000Z')),
  '2026-10-05T07:30:00.000Z',
  'weekly jobs must preserve weekday and clock time after missed slots',
);

assert.throws(
  () => nextRecurringTime('monthly', '2026-09-17T09:00:00.000Z', ms('2026-09-17T10:00:00.000Z')),
  /invalid_recurring_schedule/,
  'unsupported recurrence must fail closed',
);

console.log('Scheduler cadence checks passed.');
