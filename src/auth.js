import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwksCache = new Map();

function normalizeTeamDomain(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function localDevAllowed(request, env) {
  if (env.AUTH_MODE !== 'local') return false;
  const host = new URL(request.url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function allowedEmails(env) {
  return String(env.ACCESS_ALLOWED_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function authorizeRequest(request, env) {
  if (localDevAllowed(request, env)) {
    return { ok: true, email: 'local-founder', subject: 'local-development', claims: { local: true } };
  }

  const teamDomain = normalizeTeamDomain(env.TEAM_DOMAIN);
  const audience = String(env.POLICY_AUD || '').trim();
  if (!teamDomain || !audience) {
    return { ok: false, status: 503, error: 'access_not_configured' };
  }

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return { ok: false, status: 403, error: 'access_jwt_required' };

  try {
    const certsUrl = `${teamDomain}/cdn-cgi/access/certs`;
    let jwks = jwksCache.get(certsUrl);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(certsUrl));
      jwksCache.set(certsUrl, jwks);
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: teamDomain,
      audience,
    });

    const email = String(payload.email || '').trim().toLowerCase();
    const allowlist = allowedEmails(env);
    if (allowlist.length && (!email || !allowlist.includes(email))) {
      return { ok: false, status: 403, error: 'access_identity_not_allowed' };
    }

    return {
      ok: true,
      email: email || String(payload.sub || 'access-user'),
      subject: String(payload.sub || ''),
      claims: payload,
    };
  } catch {
    return { ok: false, status: 403, error: 'access_jwt_invalid' };
  }
}
