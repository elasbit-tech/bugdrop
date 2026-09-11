# RCA — issue #1: "Remove automatic screenshot redaction; keep only the manual Redact tool"

**Issue:** https://github.com/elasbit-tech/bugdrop/issues/1 (reported 2026-09-11 from the Holver portal, Chrome / macOS).
**Symptom:** Every screenshot attached to a report arrives almost entirely black. The reporter never gets to decide what is covered.
**Status:** FIXED on branch `fix/remove-automatic-redaction` 2026-09-11. See §6.

## 1. What the user hit

`src/widget/screenshot.ts` `captureScreenshot()` and `captureAreaScreenshot()` call
`createRedactionSnapshot(target)` before rendering and `applyMaskToImage()` after it.
`src/widget/mask.ts` collects every element matching

```ts
const EXPLICIT_SELECTOR =
  '[data-bugdrop-mask], [data-bugdrop-redact], [data-bd-redact], [data-bugdrop-redacted]';
const DEFAULT_SELECTOR =
  'input[type="password"], input[autocomplete*="cc-number"], input[autocomplete*="cc-csc"], input[autocomplete*="cc-exp"]';
```

and paints an opaque `#000` rectangle over each one. `walk()` applies a "top-most ancestor"
rule: a marked container yields one rectangle for its whole box and its subtree is not
inspected. The PNG handed to the annotator (`showAnnotationStep`) already carries the black
boxes, so the manual tools (draw, arrow, rectangle, redact, undo) operate on top of them.
"Undo" stops at the masked image; "Retake" masks again.

## 2. Evidence, step by step

| Layer | Verdict | Evidence |
|---|---|---|
| Host page (Holver portal) | trigger | `packages/portal/src/views/InboxView.tsx:101` puts `data-bugdrop-mask=""` on the `agent-root` div that wraps the whole inbox; `TranscriptModal.tsx:125`, `ResolutionsTable.tsx:86`, `QueryEditorPreview.tsx:188` and 20 more mark panes, tables and rows. |
| `mask.ts` `createRedactionSnapshot` | **the defect** | Top-most-ancestor rule turns each marked container into one rectangle the size of the container. Unit test `test/mask.test.ts` "parent mask covers all descendants (inheritance)" documents it as intended. |
| `screenshot.ts` | the defect | `applyMaskToImage` runs unconditionally for full-page, element, area and auto captures. The only capture path without it is native viewport capture. |
| `capture-loading.ts` | aggravates | A masking failure (`MaskApplicationError`) discards the screenshot entirely ("Privacy masking failed" modal, no retry). |
| `annotation-flow.ts` / `annotator.ts` | works | The manual `redact` tool draws black rectangles on user demand and `undo` removes them (`test/annotator.test.ts`, E2E "redact tool bakes black regions into the submitted screenshot"). This is the behaviour the reporter wants to keep. |
| API (`src/routes/api.ts`) | not involved | Receives the PNG as submitted; no server-side masking. |

**The reporter's browser is irrelevant:** the mask is computed from DOM geometry and painted on a canvas; every DOM-rendered capture path applies it.

## 3. Root cause

Commit `15c60ca` (2026-05-10, "feat: add user screenshot redaction") introduced developer-marked
masking and `aa0eef5` / `01eff5c` hardened it into a mandatory pre-annotation step with an
ancestor rule. The design assumes hosts mark the "smallest stable container" (docs/website/security.mdx).
A host that marks whole views gets whole views blacked out, and nothing in the widget lets the
reporter override the result. The behaviour is by design, and the design is wrong for this
deployment: the reporter, not the host markup, should decide what to cover.

## 4. Why it shipped and stayed broken

- Every masking test asserts that marked boxes ARE black (`test/mask.test.ts`, E2E "Screenshot Masking"); none asks whether the resulting screenshot is still useful.
- The host-side comment in `packages/portal/src/lib/bugReport.ts` says explicitly there is no configuration path to disable masking, so the host could only add more marks, never fewer.
- The annotator shows the masked image as the "unannotated" undo floor, which hides the cause: the reporter sees a black screenshot and no tool that removes it.

## 5. Resolution plan

### Fix
Remove automatic masking entirely; keep the manual Redact tool.

- Delete `src/widget/mask.ts`.
- `screenshot.ts`: `captureScreenshot` / `captureAreaScreenshot` return the rendered PNG (`string`); no snapshot, no mask, no `getRedactionCount`.
- `capture-loading.ts`: drop `MaskApplicationError` handling and the "Privacy masking failed" modal.
- `capture-flow.ts`, `annotation-flow.ts`, `screenshot-options.ts`, `area-picker.ts`, `index.ts`, `ui.ts`: drop redaction counts, availability flags and the `.bd-redaction-note` banners.
- `i18n.ts` + `locales/{en,de,nl,pl}.ts`: drop the ten strings that only described automatic masking. `toolRedact` and `annotationInstruction` stay.
- Docs: README, installation, configuration, security.
- Deliberately NOT changed: `annotator.ts` (manual redact + undo), console-log redaction (`console-log-redaction.ts`), URL redaction in metadata, the frozen `scripts/default-flow-fixed-baseline` snapshot (it is a pinned rollback artifact of commit `bb0f1b5`; its `.txt` assets are self-contained).

### Regression guards
- `test/cropScreenshot.test.ts` "leaves a descendant marked data-bugdrop-mask untouched": watched to FAIL before the fix:
  `AssertionError: expected { dataUrl: 'data:image/png;base64,masked', …, redaction: { count: 1, … } } to be 'data:image/png;base64,iVBORw0KGgo…'`
- `test/annotationFlow.test.ts`, `test/screenshotOptions.test.ts`, `test/areaPicker.test.ts`: assert no `.bd-redaction-note` and the plain area-picker instruction.
- E2E `e2e/widget.spec.ts` "Screenshot capture without automatic masking": full-page capture of `/test/masking-basic.html` keeps the password input and the `data-bugdrop-mask` panel non-black; auto mode on `/test/redaction.html` keeps the marked input non-black.
- E2E `e2e/default-flow-compatibility.spec.ts`: paired fixed/private journeys no longer show redaction banners.

### Verification (in order)
1. `npm run typecheck`, `npm run lint`, `npm run format:check`, `npx vitest run`, `npm run knip`.
2. `BUGDROP_TEST_HOOKS=1 npm run build:widget` and `npx playwright test --project=chromium e2e/widget.spec.ts e2e/default-flow-compatibility.spec.ts`.
3. Grep the built `public/widget.js` for `data-bugdrop-mask` (absent) and `data-tool="redact"` (present).
4. PR + issue comment + close.

### Promote
Holver runs the vendored copy in `elasbit-tech/holver` `packages/bug-report`; it needs the same change ported (separate issue there). This repo is the diff anchor only.

### Follow-ups (separate, small, not blocking)
- Port to `elasbit-tech/holver` `packages/bug-report`.
- Optionally strip the now-inert `data-bugdrop-mask` marks from the Holver portal components.

## 6. Resolution

- `src/widget/mask.ts`: deleted. `screenshot.ts`, `capture-loading.ts`, `capture-flow.ts`, `annotation-flow.ts`, `screenshot-options.ts`, `area-picker.ts`, `index.ts`, `ui.ts`, `i18n.ts`, four locales: automatic masking, its notes and its failure modal removed.
- Tests: `test/mask.test.ts` deleted; unit and E2E specs rewritten to assert marked elements stay visible; fixtures `masking-nested/layout-edge/edge-surfaces.html` removed.
- Docs: README, installation, configuration, security describe manual redaction only.
- Measured: see the issue comment for unit/E2E counts and the built-bundle grep.
- Still open (separate): port to the Holver vendored copy.
