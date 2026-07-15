# Flightglass repository rules

## Scope before code

Read the files that will change and state the intended outcome, non-goals and
fresh evidence required for completion. Preserve existing work and keep the
diff limited to the requested outcome.

Classify planned files before editing:

```powershell
npm run verify:change -- --dry-run --file <planned-file>
```

Repeat `--file` for every planned file. After editing, run:

```powershell
npm run verify:change
```

The command selects level A (focused), B (risk-triggered) or C (complete
current-main gate), explains the selection and records timing under
`outputs/flightglass-gates/`. Never silently select a lower level. A downgrade
requires explicit owner authorization, `--allow-downgrade` and a concrete
`--reason`. Promote any change with `--level C` when wider evidence is useful.

## Protected boundaries

- Never change app ID `no.strikearc.app`.
- Never change App Store Connect ID `6768449250`.
- Never rename the three `strikearc_pro_*` RevenueCat product IDs.
- Never migrate existing `strikearc.academy.*` storage keys.
- Do not change golf physics output without a failing regression test and
  explicit authorization.

The change gate checks these identifiers on every non-dry run.

## Verification and Git

- Use `npm run test:home` for focused Home contracts.
- Run the browser spot when user-visible runtime behavior changes.
- Generated reports and screenshots under `outputs/flightglass-gates/` are
  local evidence and must not be committed.
- Do not push, merge to `main`, deploy or publish without explicit owner
  authorization.
- AI commits include `Co-Authored-By: Codex <noreply@openai.com>`.
