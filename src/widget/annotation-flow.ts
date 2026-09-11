import { createAnnotator, type Tool } from './annotator';
import { createModal } from './ui';
import { escapeWidgetText, t } from './i18n';

export function showAnnotationStep(
  root: HTMLElement,
  screenshot: string,
  opts?: { selectedElementCapture?: boolean }
): Promise<string | 'retake' | 'cancel'> {
  return new Promise(resolve => {
    const configLinkHtml =
      '<a href="https://bugdrop.dev/docs/configuration#select-element-screenshots" target="_blank" rel="noopener noreferrer">data-element-context-max-area</a>';
    const selectedElementNote = opts?.selectedElementCapture
      ? `
        <p class="bd-selected-element-note" style="margin: -4px 0 12px; color: var(--bd-text-secondary); font-size: 13px;">
          ${t().selectedElementNote(configLinkHtml)}
        </p>
      `
      : '';
    const modal = createModal(
      root,
      t().reviewScreenshotTitle,
      `
        <p style="margin: 0 0 12px; color: var(--bd-text-secondary); font-size: 13px;">
          ${escapeWidgetText(t().annotationInstruction)}
        </p>
        ${selectedElementNote}
        <div class="bd-tools">
          <button class="bd-tool active" data-tool="draw">✏️ ${escapeWidgetText(t().toolDraw)}</button>
          <button class="bd-tool" data-tool="arrow">➡️ ${escapeWidgetText(t().toolArrow)}</button>
          <button class="bd-tool" data-tool="rect">▢ ${escapeWidgetText(t().toolRectangle)}</button>
          <button class="bd-tool" data-tool="redact">${escapeWidgetText(t().toolRedact)}</button>
          <button class="bd-tool" data-action="undo">↶ ${escapeWidgetText(t().undo)}</button>
        </div>
        <div id="annotation-canvas" class="bd-annotation-stage"></div>
        <div class="bd-actions">
          <button class="bd-btn bd-btn-secondary" data-action="retake">${escapeWidgetText(t().retake)}</button>
          <button class="bd-btn bd-btn-primary" data-action="done">${escapeWidgetText(t().submitFeedback)}</button>
        </div>
      `,
      false,
      'bd-modal--annotator'
    );

    const canvasContainer = modal.querySelector('#annotation-canvas') as HTMLElement;
    const annotator = createAnnotator(canvasContainer, screenshot);

    const toolButtons = modal.querySelectorAll('[data-tool]');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const tool = target.dataset.tool;

        if (tool) {
          toolButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          annotator.setTool(tool as Tool);
        }
      });
    });

    const undoBtn = modal.querySelector('[data-action="undo"]') as HTMLElement | null;
    undoBtn?.addEventListener('click', () => annotator.undo());

    const closeBtn = modal.querySelector('.bd-close') as HTMLElement;
    const retakeBtn = modal.querySelector('[data-action="retake"]') as HTMLElement;
    const doneBtn = modal.querySelector('[data-action="done"]') as HTMLElement;

    closeBtn?.addEventListener('click', () => {
      annotator.destroy();
      modal.remove();
      resolve('cancel');
    });

    retakeBtn?.addEventListener('click', () => {
      annotator.destroy();
      modal.remove();
      resolve('retake');
    });

    doneBtn?.addEventListener('click', () => {
      const annotated = annotator.getImageData();
      annotator.destroy();
      modal.remove();
      resolve(annotated);
    });
  });
}
