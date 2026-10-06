import { format, V } from '@joint/plus';
import type { App } from '../app';
import type { Example } from '../examples';
import { getScreen } from '../canvas/screen';
import { getStyle } from '../diagram-style';
import Screen from '../shapes/models/diagram/Screen';

/*
 * The diagram as a file: a new one, opened, saved (JSON), exported (an image).
 */

const DIAGRAM_FILE_NAME = 'scada-diagram.json';

/**
 * Download the diagram as JSON: the cells, the images and the favorites. Not the layers:
 * they are those of the app (see `layers.ts`), a cell says in which one it is.
 * Without the attributes left empty (e.g. a gradient as the default one: the difference is an empty object).
 */
export function saveDiagram(app: App): void {
    const { layers: _layers, defaultLayer: _defaultLayer, ...diagram } = app.graph.toJSON({
        cellAttributes: { ignoreEmptyAttributes: () => true }
    });
    const json = JSON.stringify(diagram, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = DIAGRAM_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
}

const IMAGE_FILE_NAME = 'scada-diagram.webp';

// Not of the diagram (of the editor): the grid, the highlighters (the frames of the selection, the controls),
// the tools, the screen (its frame: the area of the image)
const NOT_EXPORTED = ['.joint-grid-layer', '.joint-back-layer > *', '.joint-front-layer > *', '.joint-tools-layer > *', '.joint-type-screen'];

/**
 * Download the diagram as an image (WebP): the screen only if there is one, else all of it; on the background of
 * the canvas in the current color scheme.
 */
export function exportImage(app: App): void {
    const { paper, graph } = app;
    const screen = getScreen(graph);
    const computed = getComputedStyle(paper.el);
    const background = computed.getPropertyValue('--shape-canvas').trim();
    // The gradient of the canvas (see `canvas.css`): its colors, top to bottom
    const gradient = getStyle(graph).canvasGradient
        ? ['--canvas-gradient-top', '--canvas-gradient-bottom'].map(name => computed.getPropertyValue(name).trim())
        : null;
    format.toDataURL(paper, (dataURL, error) => {
        if (error) return;
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = IMAGE_FILE_NAME;
        link.click();
    }, {
        type: 'image/webp',
        quality: 0.92,
        backgroundColor: background,
        // All the computed styles copied (the colors of the theme resolved): drawn as on the canvas
        useComputedStyles: 'full',
        ...(screen ? { area: screen.getBBox() } : { padding: 20 }),
        beforeSerialize: (svg) => {
            NOT_EXPORTED.forEach(selector => svg.querySelectorAll(selector).forEach(node => node.remove()));
            if (gradient) drawGradient(svg, gradient);
        }
    });
}

/** The gradient of the canvas under the whole image (its view box): from the top color to the bottom one */
function drawGradient(svg: SVGSVGElement, [top, bottom]: string[]): void {
    const [x, y, width, height] = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
    if (![x, y, width, height].every(Number.isFinite)) return;
    const id = 'jj-export-canvas-gradient';
    const gradient = V('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }).append([
        V('stop', { offset: 0, style: `stop-color: ${top}` }),
        V('stop', { offset: 1, style: `stop-color: ${bottom}` })
    ]);
    const rect = V('rect', { x, y, width, height, fill: `url(#${id})` });
    svg.prepend(gradient.node, rect.node);
}

/** Whether the diagram may be replaced (by a new one, a file, an example): asked first if it was changed */
export function confirmReplace(app: App, question: string): boolean {
    return !app.history.hasUndo() || window.confirm(`${question} The changes of the diagram will be lost.`);
}

/** A new diagram instead of this one: an empty screen; `false` if the user keeps this one */
export function newDiagram(app: App): boolean {
    if (!confirmReplace(app, 'Start a new diagram?')) return false;
    app.loadJSON({ cells: [new Screen().toJSON()] });
    return true;
}

/** Let the user pick a JSON file of a diagram and load it (asked first if the diagram was changed). */
export function openDiagram(app: App): void {
    if (!confirmReplace(app, 'Open a diagram?')) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async() => {
        const [file] = Array.from(input.files || []);
        if (!file) return;
        try {
            const json = JSON.parse(await file.text());
            if (!Array.isArray(json?.cells)) throw new Error('no cells');
            // Throws before anything changes if the file can't be loaded.
            app.loadJSON(json);
        } catch (error) {
            window.alert(`"${file.name}" is not a diagram (${(error as Error).message}).`);
        }
    });
    input.click();
}

/** Open the example instead of the diagram: as a file, asked first if the diagram was changed */
export function openExample(app: App, example: Example): void {
    if (!confirmReplace(app, `Open the ${example.name} example?`)) return;
    app.loadJSON(example.json);
}
