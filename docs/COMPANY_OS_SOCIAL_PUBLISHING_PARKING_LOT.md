# COMPANY OS — Social Publishing / Ads Automation Parking Lot

Updated: 2026-09-17
Status: PARKED — activate only after Company OS V0 is stable and core INSPIRE launch gates are not endangered.

## Founder intent

Give INSPIRE's internal agents controlled access to company social channels so Company OS can prepare, approve, schedule, publish and learn from organic content; later extend the same control plane to paid media under Finance/Performance guardrails.

Initial channels:
- Instagram — primary organic channel
- TikTok — primary short-form organic channel
- Facebook Page — Meta business/permissions/ads infrastructure and selective cross-posting

Reserve matching brand handles on other strategically useful channels when low effort, but do not create a launch blocker from channel sprawl.

## Proposed operating model

Founder -> Admin -> domain agents -> Social Publishing Queue -> provider API -> audit/metrics.

Responsibilities:
- Admin: orchestration, conflict resolution, publish policy and escalation.
- Marketing/Growth: content strategy, captions, calendar, organic experiments.
- Design/Creative: approved assets and visual consistency.
- Research: factual/source review when a post makes model/category/market claims.
- Legal/Security: claim, privacy, credential and platform-policy gates when triggered.
- Performance: paid media experiments only.
- Finance: spend envelope / stop-loss approval only.
- Company OS Engineer: integrations, OAuth/token lifecycle, queues, retries, audit log and metrics ingestion.

## Permission model

Never share personal account passwords with agents or store them in GitHub.
Use official business/developer access, OAuth tokens and provider permissions. Store secrets only in Cloudflare secret storage.

Phase A — assisted publishing:
- agents draft content and attach approved asset
- queue records channel, scheduled time, caption, asset, campaign/content ID and owner
- Founder/Admin approval required before public publish
- publish result and provider post ID written to audit log

Phase B — bounded autopublish:
- low-risk recurring content classes may auto-publish after policy is proven
- claims, pricing, legal/security statements, crisis replies and partner/customer references remain approval-gated
- emergency kill switch disables all outbound publishing without deleting drafts

Phase C — paid media:
- separate permission boundary from organic publishing
- no agent may create/raise spend outside explicit Finance + Performance envelope
- campaign creation, budget changes and scaling are auditable
- current INSPIRE paid authorization remains $0 until existing launch/measurement/finance gates change

## Platform notes to verify at implementation time

Instagram/Meta:
- use a professional Instagram account and Meta business/Page permissions rather than shared credentials
- connect the Instagram account to the business/Page assets required by the chosen official integration
- organic publishing and ads permissions must be separated
- verify current API support for post/reel/story formats before implementing each format

TikTok:
- use TikTok Content Posting API and OAuth
- direct public posting requires the provider's current app/scope approval/audit requirements
- retain a draft/manual fallback while the app is unaudited or a format is unsupported

## Suggested V1 data model

social_accounts
social_content
social_assets
social_publish_jobs
social_approvals
social_publish_results
social_metrics_daily
social_experiments
social_ad_authorizations (future)

Every outbound action records actor/agent, content version, approval state, provider, account, timestamp and provider response ID. Do not store provider access tokens in these tables.

## Launch discipline

This project is not a blocker for the 2026-09-18 product launch.
If Company OS V0 becomes stable today, the only pre-launch social work worth activating is account/permission setup plus an approval-gated organic publishing prototype. Do not build autonomous ads before launch.
