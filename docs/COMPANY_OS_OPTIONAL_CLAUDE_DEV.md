# COMPANY OS — Optional Claude Code Development Path

Updated: 2026-09-17

Claude/OpenAI paid APIs are not runtime dependencies of Company OS V0.

A human-operated Claude subscription / Claude Code session may be used as an **optional development worker** if the subscription terms and local setup permit it. That path is deliberately outside production runtime.

## Safe use

Claude Code may:

- inspect this repository;
- propose/edit Company OS source files on a development branch;
- run local lint/tests;
- prepare a pull request for human review.

Claude Code must not:

- receive INSPIRE core production secrets;
- receive Company OS production secrets unless explicitly required and human-controlled;
- autonomously deploy production;
- execute destructive GitHub actions;
- send email, make payments, or automate customer data;
- become a hidden paid inference dependency for live agents.

## Recommended isolation

Use a development branch/worktree with only the repository permissions needed for the task. Production Cloudflare credentials should stay out of the model context and local transcripts whenever possible.

The production agent runtime remains Cloudflare Workers + separate Company OS D1 + Workers AI under the cost guardrails documented in `COMPANY_OS_COST_GUARDRAILS.md`.
