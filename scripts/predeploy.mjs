import fs from 'node:fs';

const config = fs.readFileSync('wrangler.toml', 'utf8');
const approved = process.env.COMPANY_OS_DEPLOY_APPROVED === '1';

if (!approved) {
  console.error('Production deploy blocked: set COMPANY_OS_DEPLOY_APPROVED=1 only after Founder/Admin approval.');
  process.exit(1);
}

if (config.includes('REPLACE_WITH_COMPANY_OS_D1_ID')) {
  console.error('Production deploy blocked: Company OS D1 database_id is still the placeholder.');
  process.exit(1);
}

if (!/AUTH_MODE\s*=\s*"access"/.test(config)) {
  console.error('Production deploy blocked: AUTH_MODE must remain access.');
  process.exit(1);
}

if (!/workers_dev\s*=\s*false/.test(config) || !/preview_urls\s*=\s*false/.test(config)) {
  console.error('Production deploy blocked: public preview surfaces must remain disabled.');
  process.exit(1);
}

if (!/ops\.getinspiration\.com/.test(config)) {
  console.error('Production deploy blocked: canonical ops domain missing.');
  process.exit(1);
}

console.log('Predeploy guard passed. This only validates repository-side gates; Cloudflare Access policy must already exist.');
