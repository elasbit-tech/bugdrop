// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The READ of `data-auto-mask`.
 *
 * `test/mask.test.ts` ("automatic redaction opt-out") pins what the switch does
 * once it is set. Nothing pinned the link in front of it: `src/widget/index.ts`
 * reading the attribute off its own script tag while the module evaluates, and
 * handing it to `setAutoMaskEnabled`. Inverting that comparison, or reading the
 * wrong attribute, left the whole suite green. These cases evaluate the real
 * module under a script tag, the way a host page does, and read the switch back.
 *
 * `document.currentScript` is null under vitest, so the widget finds the tag
 * through its own async/defer fallback, `script[src*="bugdrop"][src*="widget"]`.
 * The tag carries no `data-repo`, so the bootstrap logs "Missing data-repo" and
 * stops before `initWidget`: the import builds no UI. `vi.resetModules()` gives
 * every case a fresh `index` and a fresh `mask`, so no case inherits another's
 * flag. Ported from Holver's vendored copy
 * (`packages/bug-report/test/autoMaskScriptTag.test.ts`).
 *
 * Mutants of `src/widget/index.ts`, applied one at a time against the whole
 * suite (1657 cases):
 *
 *   inverted (`rawAutoMask === 'false'`)              -> all four cases below
 *   wrong attribute (`dataset.autoRedact`)            -> "false" case; unrecognised case (no warning)
 *   `setAutoMaskEnabled(...)` call deleted            -> "false" case only
 *   case-insensitive (`rawAutoMask?.toLowerCase()`)   -> unrecognised case only
 *   invalid-value warning deleted                     -> unrecognised case only (no warning)
 *
 * Measured 2026-09-11 (vitest 4.1.10): no other case in the suite failed under
 * any of them.
 */
async function autoMaskAfterLoading(attrs: Record<string, string>): Promise<boolean> {
  const script = document.createElement('script');
  script.src = 'https://cdn.test/bugdrop/widget.js';
  for (const [name, value] of Object.entries(attrs)) script.setAttribute(name, value);
  document.head.appendChild(script);
  vi.resetModules();
  await import('../src/widget/index');
  const { isAutoMaskEnabled } = await import('../src/widget/mask');
  return isAutoMaskEnabled();
}

describe('data-auto-mask, read off the script tag', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The bootstrap logs by design here (null `currentScript`, no `data-repo`).
    // Silenced so the run stays readable; `warn` is asserted in the last case.
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.head.querySelectorAll('script').forEach(script => script.remove());
    vi.restoreAllMocks();
  });

  it('switches masking off for the literal "false"', async () => {
    expect(await autoMaskAfterLoading({ 'data-auto-mask': 'false' })).toBe(false);
  });

  it('keeps masking on when the tag carries no data-auto-mask', async () => {
    expect(await autoMaskAfterLoading({})).toBe(true);
  });

  it('keeps masking on for "true"', async () => {
    expect(await autoMaskAfterLoading({ 'data-auto-mask': 'true' })).toBe(true);
  });

  it('keeps masking on for a value it does not recognise, and says so', async () => {
    // Only the literal is OFF: a typo must fail toward masking, and loudly.
    expect(await autoMaskAfterLoading({ 'data-auto-mask': 'False' })).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      '[BugDrop] Invalid data-auto-mask "False". Expected "true" or "false".'
    );
  });
});
