/**
 * The diagram is edited in the edit mode. In the runtime mode it can't be changed:
 * the plant runs (see `simulation.ts`) and the equipment is operated with its controls.
 */
export enum Mode {
    Edit = 'edit',
    Runtime = 'runtime'
}

/**
 * The layers of the graph, from the bottom: the pipes under the equipment, the instruments over it;
 * the background and the foreground for what the user puts under or over everything (see the inspector).
 */
export enum Layer {
    Background = 'background',
    Pipes = 'pipes',
    Equipment = 'equipment',
    Instruments = 'instruments',
    Foreground = 'foreground'
}

/** The grid: the elements move and resize, and the anchors of the pipes snap, in its steps. */
export const GRID_SIZE = 10;

export const LIQUID_COLOR = '#0EAD69';
export const MAX_LIQUID_COLOR = '#ED2637';
export const MIN_LIQUID_COLOR = '#FFD23F';
/** The default color of a pipe (its medium, see `Pipe`): of the theme */
export const PIPE_COLOR = 'var(--shape-pipe)';

/** The outline of a pipe (the dark edges of its line, see `Pipe`): of the theme */
export const PIPE_OUTLINE = 'var(--shape-pipe-outline)';

// The colors of the parts of the shapes are CSS variables (`--shape-*` in `shapes.css`): themed there.
export const LABEL_COLOR = 'var(--shape-label)';

/** The color of the canvas (in each scheme): a color of a shape too - drawn as a line drawing (see `shapes.css`) */
export const CANVAS_COLOR = 'var(--shape-canvas)';

/** The ink on a surface (a scale, a unit, a mark): as the labels on a surface in the color of the canvas (see `shapes.css`) */
export const SURFACE_INK = 'var(--shape-surface-ink)';

/** The default color of a shape of the background (see `Rectangle`, `Ellipse`): translucent, in both schemes */
export const BACKGROUND_FILL = '#64748B';
export const SELECTION_COLOR = '#0075F2';

/** How far the frame of a selected element is around it (`ui.FreeTransform` and the frames of `ui.Selection`) */
export const SELECTION_PADDING = 6;
/** The colors of the app (the design tokens of `variables.css` and the canvas, see `config.ts`). */
export enum ColorScheme {
    Light = 'light',
    Dark = 'dark'
}
