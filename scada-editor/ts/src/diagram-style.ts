import type { dia } from '@joint/plus';
import { type OutlineWidth, setStyleFinish, setStyleOutlineWidth, type SurfaceFinish } from './shapes/common/gradients';

/*
 * The style of the diagram (in the settings, saved with it): the finish of all the equipment (shaded, flat), one color
 * for their metal, one for their outlines, one for their accents - instead of the defaults of the shapes (see the `--base-*` in
 * `shapes.css`), everywhere: the canvas, the palette, the preview. An element's own color, outline, accent stay.
 * The size and the color of the labels of the elements too (`.jj-label` in `shapes.css`), the color of the canvas.
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
    /** The labels of the elements (not the Label and Zone shapes: texts of their own): their size, their color */
    labelSize?: LabelSize;
    labelColor?: string;
    /** The background of the paper (`--shape-canvas`: the surfaces in the color of the canvas too, its grid) */
    canvas?: string;
    /** The canvas in a subtle gradient of its color (top to bottom, see `--canvas-gradient-*` in `shapes.css`) */
    canvasGradient?: boolean;
}

export type LabelSize = 'small' | 'medium' | 'large' | 'x-large';

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
const VARIABLES: Record<Exclude<keyof DiagramStyle, 'finish' | 'labelSize' | 'canvasGradient' | 'outlineWidth'>, string> = {
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
