# SPEC — Readiness Diagnostics and Three-Page UX

Status: proposed active implementation spec  
Repository: `joeloverbeck/continuity-loom`  
Target commit: `e1df2d032c7ae7976108f70cafa5802a7398ce39`

## Executive decision

The app should stop leading with raw diagnostic codes. Authors need a readiness checklist first and technical codes second.

The generation brief page, prompt preview page, and generate page must share one readiness model. A user should always understand whether the problem is an unsaved draft, a missing structural story-state field, a missing launch directive, provider/API configuration, optional quality risk, or a technical/internal diagnostic.

## Current problems found at the target commit

The current `ValidationResultView` renders raw codes as primary clickable labels, followed by terse message text, generic `whyItMatters`, generic suggested actions, and affected raw paths/IDs. The warning factory uses a universal why-it-matters sentence for several unrelated warnings. Long dossier warnings are emitted per record and point to raw record IDs.

The preview page blocks prompt preview when the compile route returns validation blockers, which is correct. The generate page separately checks provider settings and disables generate when the OpenRouter credential is absent, which is also correct. The missing piece is a shared readiness presentation model that explains why each gate is closed.

## Readiness model

Introduce a derived readiness object used by all three pages:

```ts
type GenerationReadiness = {
  status: "draft" | "blocked" | "ready-with-warnings" | "ready";
  canSaveDraft: true;
  canPreview: boolean;
  canGenerate: boolean;
  blockers: ReadinessDiagnostic[];
  warnings: ReadinessDiagnostic[];
  provider: {
    configured: boolean;
    blockers: ReadinessDiagnostic[];
  };
  unsavedDraft: {
    hasUnsavedChanges: boolean;
    readinessMayBeStale: boolean;
  };
  summary: {
    headline: string;
    nextAction: string;
  };
};
```

Rules:

- `canSaveDraft` is always true unless there is a malformed request or no project is open.
- `canPreview` is false only when validation blockers remain.
- `canGenerate` is false only when validation blockers remain, provider configuration is missing/invalid, or a send is already in progress.
- Warnings never change `canPreview` or `canGenerate`.
- Unsaved draft state never becomes a blocker, but it must be visibly called out because readiness may be stale.

## Page behavior

### Generation Brief page

Primary job: edit and save draft generation fields.

Required UX:

1. Header: `Generation Brief`.
2. Draft status line: `Saved`, `Unsaved changes`, `Saving…`, or `Save failed`.
3. Readiness checklist below save status.
4. Save button remains available while blockers exist.
5. Validation/Readiness refresh button remains available.
6. Field-level focus actions jump to the relevant editor field.
7. Defaulted fields are labeled clearly.

Recommended copy:

```text
Draft saved. Preview is still blocked because the launch directive is missing.
```

```text
This draft has unsaved changes. The readiness checklist is based on the last saved draft.
```

### Prompt Preview page

Primary job: show the compiled prompt when generation-readiness blockers are cleared.

Required UX:

- If blockers exist: show `Prompt preview is blocked` and the readiness checklist. Do not render a prompt body.
- If only warnings exist: render prompt body and show warnings under `Recommended before sending`.
- If no warnings: render prompt body and `Ready to generate`.
- Technical metadata remains outside the prompt body.
- Warnings are not inserted into the compiled prompt.

### Generate page

Primary job: show prompt, send to provider, and manage draft candidate lifecycle.

Required UX:

- If validation blockers exist: show the same blocked readiness checklist as Preview.
- If provider settings are missing: show a provider configuration blocker in the readiness checklist; prompt preview can still render if validation is ready.
- If only warnings exist: Generate button remains enabled when provider settings are valid.
- Provider errors after send are separate from readiness blockers.
- Candidate accept/discard behavior remains unchanged: candidates are not canon until accepted, and accepted prose still requires manual record updates.

## Readiness checklist groups

Render groups in this order:

1. **Required before prompt generation**
   - true validation blockers
   - provider blockers on Generate page
   - malformed technical states

2. **Recommended for stronger output**
   - optional voice/body salience
   - weak setting texture
   - optional current pressure pins
   - cue salience warnings

3. **Prompt length / salience risks**
   - long context
   - too many high-salience records
   - grouped long cast dossier risks

4. **Technical diagnostics**
   - raw codes
   - rule IDs
   - affected raw paths
   - fingerprints and versions when relevant

The first three groups are author-facing. Technical diagnostics should be collapsed by default.

## Diagnostic copy model

Every diagnostic must provide these fields:

```ts
type ReadinessDiagnostic = {
  severity: "blocker" | "warning";
  code: string;
  title: string;
  group:
    | "required-before-prompt-generation"
    | "recommended-for-stronger-output"
    | "prompt-length-salience-risk"
    | "technical-diagnostics";
  summary: string;
  whyItMatters: string;
  fastestFix: string;
  whenItBecomesBlocking?: string;
  whyThisIsNotBlocking?: string;
  ignoringIsReasonableWhen?: string;
  affected: AffectedTarget[];
  actions: DiagnosticAction[];
  dedupeKey: string;
  sortKey: string;
  technical: {
    legacyCode?: string;
    ruleId?: string;
    rawPaths: string[];
    evidence?: string[];
  };
};
```

Affected targets must support display labels:

```ts
type AffectedTarget = {
  kind: "generation-field" | "record" | "provider-setting" | "project" | "technical";
  fieldPath?: string;
  recordId?: string;
  recordType?: string;
  displayLabel?: string;
  navTarget?: string;
};
```

## Required rewritten diagnostic examples

### Missing launch directive

```yaml
severity: blocker
code: missing-launch-directive
title: Add the launch directive
summary: The prompt needs your immediate local action or pressure before it can be generated.
whyItMatters: The compiler can describe the current state, but it cannot choose the next authored move for you.
fastestFix: In Launch directive, write one concise instruction such as "Have Mara test whether the flour bin has been moved."
whenItBecomesBlocking: Always blocks Preview and Generate until supplied.
affected:
  - kind: generation-field
    fieldPath: generationSession.manual_moment_directive.must_render
actions:
  - label: Edit launch directive
    target: generationSession.manual_moment_directive.must_render
```

### First-segment blank handoff

No diagnostic. The compiler renders the first-segment empty state.

### Continuation handoff missing

```yaml
severity: blocker
code: missing-continuation-handoff
title: Summarize the handoff from accepted prose
summary: Continuation generation needs a recent causal bridge because accepted prose is not included in the prompt.
whyItMatters: The model must know where to begin without seeing prior accepted prose.
fastestFix: Add the last visible moment and the begin-after point in record terms, not pasted prose.
whenItBecomesBlocking: Blocks only when generation context is continuation_after_accepted_segment.
```

### Blank stop guidance

No diagnostic. Blank means no extra narrowing beyond the universal stop rule.

### Nonlocal stop guidance

```yaml
severity: blocker
code: stop-guidance-nonlocal
title: Keep stop guidance local
summary: The stop guidance asks for a chapter, reveal, branch, or downstream consequence.
whyItMatters: Continuity Loom only asks the model for the next local prose unit.
fastestFix: Replace it with a nearby response point, or leave it blank to use the default local stop rule.
```

### Cast salience risk

```yaml
severity: warning
code: cast-salience-risk
title: Long cast context may dilute local voice emphasis
summary: Generation can proceed, but a long active cast dossier may make the current speaker's local stress less salient.
whyItMatters: Long-context models can underuse information in the middle of long prompts.
whyThisIsNotBlocking: Durable CAST MEMBER voice anchors are present, so the prompt remains structurally valid.
fastestFix: Add one short current voice/body pressure only for the cast member whose local stress matters most.
ignoringIsReasonableWhen: The scene is quiet, the durable voice anchor is strong, or exact local voice coloring is not important.
affected:
  - kind: record
    recordType: CAST MEMBER
    displayLabel: Mara Vale
```

## Grouping and deduplication

Rules:

- Same code + same root cause + same fix becomes one grouped diagnostic.
- Per-record warnings may list multiple affected records inside one warning.
- Per-field blockers remain separate if they require different fields to fix.
- Warnings about prompt length and active dossier count should never appear as dozens of separate rows.
- A record display label must be resolved from the repository/read model when available. Raw IDs appear only in the technical expander.

## Navigation and actions

Diagnostics should provide direct actions:

- Focus generation brief field.
- Open record editor for affected record.
- Open settings for provider configuration.
- Open active working set selector.
- Copy technical diagnostic JSON.

Action labels must be user-facing, not raw codes.

## Accessibility

Requirements:

- Readiness summary is an `aria-live="polite"` region after validation refresh.
- Blocker count and warning count are exposed in headings.
- Diagnostic cards have keyboard-reachable actions.
- Collapsed technical details use `<details>`/`<summary>` or equivalent accessible disclosure controls.
- Field focus actions move keyboard focus to the corresponding input and announce context.
- Color is never the only indicator of blocker/warning status.

## Technical details expander

Each diagnostic card should include collapsed technical details:

- raw code
- rule ID
- severity
- raw affected field paths
- raw record IDs
- validation source version
- compiler/template/contract versions when applicable
- normalized generation context source: `persisted`, `accepted-segment-count`, or `migration`

This lets developers debug without making raw codes the author’s primary experience.

## Shared route/model recommendation

Add a core `deriveReadiness(result, providerState, draftState)` function or server response adapter used by all three pages.

Possible API endpoints:

- Keep existing `/api/validate` and map to readiness on the client; or
- Add `/api/readiness` that returns the shared model directly.

The preferred route is `/api/readiness` because the three pages need the same grouping, display labels, default-source metadata, and provider-state distinctions. The route must not include prompt text, candidate text, accepted prose, full record payloads, or secrets.

## Test requirements

- Warning-only readiness renders `ready-with-warnings` and leaves Preview/Generate available.
- Provider missing key blocks Generate but not Preview.
- Missing launch directive blocks Preview and Generate but not Save.
- Unsaved changes show stale-readiness notice.
- Grouped cast salience warning shows display labels and raw IDs only in technical details.
- Raw code buttons are replaced by user-facing action labels.
- Keyboard navigation/focus actions work.
- The same readiness result renders consistently on generation brief, preview, and generate pages.
