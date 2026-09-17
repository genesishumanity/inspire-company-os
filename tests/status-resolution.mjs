import assert from 'node:assert/strict';
import { operationalStatusFromCounts } from '../src/index.js';

assert.equal(operationalStatusFromCounts({ blocked: 1, review: 2, inProgress: 3, todo: 4, unread: 5 }), 'blocked');
assert.equal(operationalStatusFromCounts({ blocked: 0, review: 1, inProgress: 3, todo: 4, unread: 5 }), 'reviewing');
assert.equal(operationalStatusFromCounts({ blocked: 0, review: 0, inProgress: 2, todo: 4, unread: 5 }), 'working');
assert.equal(operationalStatusFromCounts({ blocked: 0, review: 0, inProgress: 0, todo: 2, unread: 0 }), 'waiting');
assert.equal(operationalStatusFromCounts({ blocked: 0, review: 0, inProgress: 0, todo: 0, unread: 1 }), 'waiting');
assert.equal(operationalStatusFromCounts({ blocked: 0, review: 0, inProgress: 0, todo: 0, unread: 0 }), 'waiting');

console.log('Agent operational status priority checks passed.');
