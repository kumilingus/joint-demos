import type { dia } from '@joint/plus';
import { setStyleFinish, type SurfaceFinish } from './shapes/common/gradients';

/*
 * The style of the diagram (in the settings, saved with it): the finish of all the equipment (shaded, flat), one color
 * for their metal, one for their outlines, one for their accents - instead of the defaults of the shapes (see the `--base-*` in
 * `shapes.css`), everywhere: the canvas, the palette, the preview. An element's own color, outline, accent stay.
 */

/** The attribute of the graph with the style (saved with the diagram) */
export const STYLE_ATTRIBUTE = 'style';

export interface DiagramStyle {
    finish?: SurfaceFinish;
    color?: string;
    outline?: string;
    accent?: string;
}

/** The style of the diagram (none of it set: the defaults of the shapes) */
export function getStyle(graph: dia.Graph): DiagramStyle {
    const style = graph.get(STYLE_ATTRIBUTE);
    return style && typeof style === 'object' ? style : {};
}

// The CSS variables of the colors of the style (see `shapes.css`)
const VARIABLES: Record<Exclude<keyof DiagramStyle, 'finish'>, string> = {
    color: '--style-color',
    outline: '--style-outline',
    accent: '--style-accent'
};

/**
 * The style on the document: its colors in the CSS variables (unset - the defaults), its finish of the shapes
 * (see `finishOf()`: they are rendered again with it, see `App`)
 */
export function applyStyle(style: DiagramStyle): void {
    setStyleFinish(style.finish === 'flat' ? 'flat' : 'shaded');
    const { style: css } = document.documentElement;
    (Object.keys(VARIABLES) as (keyof typeof VARIABLES)[]).forEach((key) => {
        const value = style[key];
        if (value) {
            css.setProperty(VARIABLES[key], value);
        } else {
            css.removeProperty(VARIABLES[key]);
        }
    });
}
