# GTM API Automation Plan (Agent-Executable)

## Objective
Enable an agent to fully manage Google Tag Manager entities via API v2, excluding credential acquisition.

1. Create branch and workspace scaffolding.
- Branch: `codex/gtm-api-automation`.
- Create folders: `automation/gtm/`, `automation/gtm/spec/`, `automation/gtm/reports/`.
- Initialize Node project for the script runtime if not already present.

2. Add a machine-readable source-of-truth spec.
- Create `automation/gtm/spec/gtm-spec.json`.
- Define arrays for `variables`, `triggers`, `tags`, and optional `folders`.
- Add required stable key per item: `externalKey` for idempotent matching across runs.

3. Implement environment/config loading.
- Create `.env.example` entries for account/container/workspace IDs and runtime flags.
- Add runtime flags: `DRY_RUN`, `ALLOW_DELETE`, `PUBLISH`, `TARGET_ENV`, `MAX_MUTATIONS`.

4. Implement OAuth token loading (without acquiring creds).
- Script should read credentials/token files from paths given via env vars.
- Validate token freshness and fail with a clear message if refresh is not possible.

5. Implement GTM client module.
- Add API wrapper methods for: list/create/update/get/delete for `variables`, `triggers`, `tags`, workspace create/sync, create version, publish version.
- Add standard retry policy for `429`/`5xx` with exponential backoff.

6. Implement workspace lifecycle logic.
- Resolve or create workspace by name (for example: `automation-<date>`).
- Call workspace sync before mutation.
- Abort on unresolved conflicts and emit conflict report.

7. Implement discovery and diff engine.
- Fetch existing workspace entities and index by `externalKey` first, fallback to name.
- Compute four sets: `create`, `update`, `noop`, `delete`.
- Respect `ALLOW_DELETE=false` by default.

8. Implement mutation pipeline in dependency order.
- Upsert `variables` first.
- Upsert `triggers` second.
- Upsert `tags` third.
- Maintain ID/path remapping so references are correctly connected.

9. Add safety guards.
- Enforce `MAX_MUTATIONS` threshold.
- Block wildcard or bulk destructive changes unless explicit override flag is set.
- Require `PUBLISH=true` and `TARGET_ENV=prod` guard for publishing.

10. Add dry-run and report outputs.
- `DRY_RUN=true` should only output diff and planned API calls.
- Write JSON and markdown reports into `automation/gtm/reports/` with timestamp.
- Include: planned changes, applied changes, failures, created GTM version ID, published version ID.

11. Add versioning and publish flow.
- After successful apply, create a container version with a changelog message.
- Publish only if `PUBLISH=true`; otherwise stop after version creation.

12. Add rollback command.
- Implement command to publish a previous version ID.
- Store latest "before" live version in report for quick rollback.

13. Add CLI commands.
- `npm run gtm:plan` -> dry-run diff only.
- `npm run gtm:apply` -> apply to workspace + create version.
- `npm run gtm:publish` -> apply + version + publish.
- `npm run gtm:rollback -- --versionId=<id>` -> publish prior version.

14. Add tests and validation.
- Unit tests for diff logic and ID remapping.
- Contract tests for payload shape generation.
- Preflight validation command to verify spec integrity before API calls.

15. Add operational docs for agent execution.
- `automation/gtm/README.md` with step-by-step runbook.
- Include expected failure handling for conflicts, permission errors, rate limits, and partial updates.

## Required Credentials (User-Provided)
- Google Cloud OAuth client credentials: `client_id`, `client_secret` (for Tag Manager API).
- OAuth refresh token (or another approved auth mechanism token source).
- GTM identifiers: `accountId`, `containerId` (and optional workspace ID if reusing one).
- Access permissions in GTM for the authenticated principal:
  - Edit access to container/workspace.
  - Publish access if production publishing is needed.
