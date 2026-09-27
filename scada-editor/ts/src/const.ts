/**
 * The diagram is edited in the edit mode. In the runtime mode it can't be changed:
 * the plant runs (see `simulation.ts`) and the equipment is operated with its controls.
 */
export enum Mode {
    Edit = 'edit',
    Runtime = 'runtime'
}

/** The grid: the elements move and resize, and the anchors of the pipes snap, in its steps. */
/** The layers of the graph, from the bottom: the pipes under the equipment, the instruments over it. */
export enum Layer {
    Pipes = 'pipes',
    Equipment = 'equipment',
    Instruments = 'instruments'
}

export const GRID_SIZE = 10;

export const LIQUID_COLOR = '#0EAD69';
export const MAX_LIQUID_COLOR = '#ED2637';
export const MIN_LIQUID_COLOR = '#FFD23F';
export const PIPE_COLOR = '#6CC59A';
export const LABEL_COLOR = '#350100';
export const SELECTION_COLOR = '#0075F2';
/** The colors of the app (the design tokens of `styles.css` and the canvas, see `config.ts`). */
export enum ColorScheme {
    Light = 'light',
    Dark = 'dark'
}
