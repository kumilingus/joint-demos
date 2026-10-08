import type { App } from '../app';

/*
 * The cells of some IDs brought forward, the others dimmed (the log filtered by them): one CSS rule listing the IDs
 * matched (on the views: `data-tag`, see `markTag()`), nothing of the diagram changes. The screen is not dimmed (it is
 * the canvas of the runtime mode).
 */

const STYLE_ID = 'scada-dim';

// A dimmed cell: gray and flat - in the background (its shapes still read); faded in Safari, which does not draw the
// CSS filter functions on the SVG elements (an SVG filter there: blurred, or a straight pipe gone)
const DIMMED = isSafari() ? 'opacity: 0.25;' : 'filter: grayscale(1) contrast(0.5) brightness(1.15);';

/** Whether the browser is Safari (its engine: on iOS every browser) */
function isSafari(): boolean {
    const { userAgent } = navigator;
    return /AppleWebKit/.test(userAgent) && !/Chrome|Chromium|Edg|Android/.test(userAgent);
}

/**
 * The cells of the diagram dimmed but the cells of the tags. No tags (nothing found): none dimmed - a filter finding
 * nothing does not hide the diagram.
 */
export function dimCellsExceptTags(app: App, tags: string[]): void {
    if (tags.length === 0) {
        undimCells();
        return;
    }
    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        document.head.append(style);
    }
    const kept = ['[data-type="Screen"]', ...tags.map(tag => `[data-tag=${CSS.escape(tag)}]`)].join(', ');
    style.textContent = `.scada-app[data-mode="${app.mode}"] .scada-diagram .joint-cell:not(${kept}) { ${DIMMED} }`;
}

/** None of the cells dimmed */
export function undimCells(): void {
    document.getElementById(STYLE_ID)?.remove();
}
