import { type dia, util } from '@joint/plus';
import type { App } from './app';
import { type OutlineWidth, setStyleFinish, setStyleOutlineWidth, type SurfaceFinish } from './shapes/common/gradients';
import { CANVAS_COLOR } from './const';

/*
 * The style of the diagram (in the settings, saved with it): the finish of all the equipment (shaded, flat), one color
 * for their metal, one for their outlines, one for their accents - instead of the defaults of the shapes (see the `--base-*` in
 * `shapes.css`), everywhere: the canvas, the palette, the preview. An element's own color, outline, accent stay.
 * The size and the color of the labels of the elements too (`.scada-shape-label` in `shapes.css`), the color of the canvas.
 */

/** The attribute of the graph with the style (saved with the diagram) */
export const STYLE_ATTRIBUTE = 'style';

export interface DiagramStyle {
    finish?: SurfaceFinish;
    color?: string;
    outline?: string;
    /** The width of the outlines (of the shapes outlined: an outline color, the flat finish; the borders of the pipes) */
    outlineWidth?: OutlineWidth;
    accent?: string;
    /** The labels of the elements (not the Label shape: a text of its own; of a zone the size only): their size, their color */
    labelSize?: LabelSize;
    labelColor?: string;
    /** What the labels of the shapes show (as `labelSize`): their names, their IDs (the tags), or both */
    labels?: LabelContent;
    /** The background of the paper (`--shape-canvas`: the surfaces in the color of the canvas too, its grid) */
    canvas?: string;
    /** The canvas in a subtle gradient of its color (top to bottom, see `--canvas-gradient-*` in `shapes.css`) */
    canvasGradient?: boolean;
}

export type LabelSize = 'small' | 'medium' | 'large' | 'x-large';

/**
 * What the labels of the shapes show: their names (by default), their IDs (the tags: as a P&ID), or both - the ID in bold
 * above the name (as the operator displays of ISA-101)
 */
export type LabelContent = 'name' | 'tag' | 'both';

/** The sizes of the labels of the elements to pick: their names, their sizes (px) - medium by default */
export const LABEL_SIZES: Record<LabelSize, { name: string; px: number }> = {
    small: { name: 'Small', px: 12 },
    medium: { name: 'Medium', px: 14 },
    large: { name: 'Large', px: 16 },
    'x-large': { name: 'X-Large', px: 18 }
};

/** The style of the diagram (none of it set: the defaults of the shapes) */
export function getStyle(graph: dia.Graph): DiagramStyle {
    const style = graph.get(STYLE_ATTRIBUTE);
    return style && typeof style === 'object' ? style : {};
}

// The CSS variables of the colors of the style (see `shapes.css`)
const VARIABLES: Record<Exclude<keyof DiagramStyle, 'finish' | 'labelSize' | 'canvasGradient' | 'outlineWidth' | 'labels'>, string> = {
    color: '--style-color',
    outline: '--style-outline',
    accent: '--style-accent',
    labelColor: '--style-label-color',
    canvas: '--style-canvas'
};

/**
 * The style on the document: its colors in the CSS variables (unset - the defaults), its finish of the shapes
 * (see `finishOf()`: they are rendered again with it, see `App`)
 */
export function applyStyle(style: DiagramStyle): void {
    setStyleFinish(style.finish === 'flat' ? 'flat' : 'shaded');
    setStyleOutlineWidth(style.outlineWidth);
    const { style: css } = document.documentElement;
    (Object.keys(VARIABLES) as (keyof typeof VARIABLES)[]).forEach((key) => {
        const value = style[key];
        if (value) {
            css.setProperty(VARIABLES[key], value);
        } else {
            css.removeProperty(VARIABLES[key]);
        }
    });
    // The gradient drawn behind the paper (`canvas.css`)
    document.documentElement.toggleAttribute('data-canvas-gradient', Boolean(style.canvasGradient));
    const labelSize = style.labelSize && LABEL_SIZES[style.labelSize];
    if (labelSize) {
        css.setProperty('--style-label-size', `${labelSize.px}px`);
    } else {
        css.removeProperty('--style-label-size');
    }
}

// The keys of the style whose change requires an update of the views (read when they are drawn, see `gradients.ts`); the
// others are CSS variables
const VIEW_UPDATE_KEYS: (keyof DiagramStyle)[] = ['finish', 'outlineWidth', 'labels'];

/** Whether the change of the style requires an update of the views (see `VIEW_UPDATE_KEYS`): always without a previous one */
function isViewUpdateRequired(style: DiagramStyle, previous?: DiagramStyle): boolean {
    if (!previous) return true;
    return !util.isEqual(util.pick(style, ...VIEW_UPDATE_KEYS), util.pick(previous, ...VIEW_UPDATE_KEYS));
}

/**
 * The style of the diagram on the document (see `diagram-style.ts`), its finish on the shapes: on the canvas, in the palette.
 * Changed from the previous style: the views updated only when that requires it (see `isViewUpdateRequired()`; the colors
 * are CSS variables - the browser repaints them).
 */
export function applyDiagramStyle(app: App, previous?: DiagramStyle): void {
    const style = getStyle(app.graph);
    applyStyle(style);
    // The canvas in a gradient: drawn behind the paper (on its scroller, see `canvas.css`) - the paper transparent
    app.paper.drawBackground({ color: style.canvasGradient ? 'transparent' : CANVAS_COLOR });
    if (!isViewUpdateRequired(style, previous)) return;
    const { paper, stencil } = app;
    const papers: dia.Paper[] = [paper];
    // The open groups of the palette: a closed one is not drawn (nothing to measure) - restyled when it is opened (see
    // `PaletteController`)
    if (stencil) {
        const groups = Object.keys(stencil.options.groups ?? {}).filter(group => stencil.isGroupOpen(group));
        papers.push(...groups.map(group => stencil.getPaper(group)));
    }
    papers.forEach(restylePaper);
}

/**
 * The cells of the paper in the style of the diagram: their attributes evaluated again (the surfaces of the elements, the
 * borders of the pipes) - requested from the paper: done when they are in the DOM (a diagram being loaded is not yet)
 */
export function restylePaper(paper: dia.Paper): void {
    paper.model.getCells().forEach((cell) => {
        const view = cell.findView(paper);
        view?.requestUpdate(view.getFlag('UPDATE'));
    });
}
