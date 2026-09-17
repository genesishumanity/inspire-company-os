import assert from 'node:assert/strict';
import { authorizeRequest } from '../src/auth.js';

const local = await authorizeRequest(new Request('http://127.0.0.1:8787/'), { AUTH_MODE: 'local' });
assert.equal(local.ok, true);
assert.equal(local.email, 'local-founder');

const remoteBypassAttempt = await authorizeRequest(new Request('https://ops.getinspiration.com/'), { AUTH_MODE: 'local' });
assert.equal(remoteBypassAttempt.ok, false);
assert.equal(remoteBypassAttempt.error, 'access_not_configured');

const missingAccessConfig = await authorizeRequest(new Request('https://ops.getinspiration.com/'), { AUTH_MODE: 'access' });
assert.equal(missingAccessConfig.ok, false);
assert.equal(missingAccessConfig.status, 503);

const missingToken = await authorizeRequest(new Request('https://ops.getinspiration.com/'), {
  AUTH_MODE: 'access',
  TEAM_DOMAIN: 'https://example.cloudflareaccess.com',
  POLICY_AUD: 'example-aud',
});
assert.equal(missingToken.ok, false);
assert.equal(missingToken.status, 403);
assert.equal(missingToken.error, 'access_jwt_required');

console.log('Access auth smoke checks passed.');
