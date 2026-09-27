import { dia } from '@joint/plus';
import type { Overflow } from './footprint';
import { GRID_SIZE, Layer } from '../const';

/** The size constraints of resizing. */
export interface ResizeOptions {
    preserveAspectRatio?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}

/**
 * How an element can be resized: not at all, freely (down to the minimal size),
 * or with constraints (keeping its aspect ratio, within a size).
 */
export type Resizable = boolean | ResizeOptions;

/**
 * Where on the sides of the element a pipe end can be anchored (see `connections.ts`):
 * anywhere (in the steps of the grid), or in the middles of the sides only.
 */
export type Anchors = 'sides' | 'middles';

/** The control operating the element in the runtime mode (see `controls.ts`). */
export type ControlKind = 'power' | 'toggle' | 'slider';

/** What the editor needs to know about a shape. */
export interface ShapeFeatures {
    /** Whether (and how) the element can be resized. */
    resizable: Resizable;
    /** Whether the element can be rotated. */
    rotatable: boolean;
    /** The control of the element, if it has one. */
    control: ControlKind | null;
    /** Where a pipe end can be anchored on the element (unless it has pipe stubs to connect to). */
    anchors: Anchors;
    /** The layer of the graph the element is in (see `layers.ts`). */
    graphLayer: Layer;
    /** How far the pipe stubs (`pipePorts()`) reach out of the element, if it has them (in grid steps: their ends stay on the grid). */
    stubLength: number | null;
    /** How far the drawing reaches out of the bounding box (on top of the label below it, see `footprint.ts`). */
    overflow: Overflow;
    /** The start of the generated tags (the IDs of the elements, see `tags.ts`): `P` for `P-101`. */
    tagPrefix: string;
}

// An element can be made this much smaller than its default size (unless the shape says otherwise).
const MIN_SIZE_RATIO = 0.5;

// The size of an element changes in two steps of the grid (so that its center stays on it).
const SIZE_STEP = 2 * GRID_SIZE;

/** A part of the default size, in the steps of the size (and one step at least). */
const minSize = (size: number) => Math.max(SIZE_STEP, Math.round(size * MIN_SIZE_RATIO / SIZE_STEP) * SIZE_STEP);

/**
 * The base of all the shapes of the SCADA editor. The features are defined on the prototype
 * (as getters): a shape overrides only those that differ from the defaults below.
 */
export abstract class Shape extends dia.Element implements ShapeFeatures {

    get resizable(): Resizable {
        return true;
    }

    get rotatable(): boolean {
        return true;
    }

    get control(): ControlKind | null {
        return null;
    }

    get anchors(): Anchors {
        return 'sides';
    }

    get graphLayer(): Layer {
        return Layer.Equipment;
    }

    get stubLength(): number | null {
        return null;
    }

    get overflow(): Overflow {
        return {};
    }

    /** The initials of the type by default: `CV` for a `ControlValve`. */
    get tagPrefix(): string {
        return String(this.get('type')).replace(/[^A-Z]/g, '');
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        // In the layer of its kind (unless it says otherwise, e.g. in the JSON)
        if (!this.has('layer')) this.set('layer', this.graphLayer, { silent: true });
        if (this.stubLength === null) return;
        this.fitPipeStubs();
        this.on('change:size', (_element: dia.Element, _value: unknown, options: dia.Cell.Options) => this.fitPipeStubs(options));
    }

    /**
     * The pipe stubs start in the center of the element (behind it):
     * they reach half of its width and `stubLength` out of it, whatever its size.
     * The branches (going down from the middle of the height, see `branchPorts()`) half of its height.
     */
    fitPipeStubs(options?: dia.Cell.Options): void {
        const { width, height } = this.size();
        if (this.prop(['ports', 'groups', 'pipes'])) {
            this.prop(['ports', 'groups', 'pipes', 'size', 'width'], width / 2 + this.stubLength!, options);
        }
        if (this.prop(['ports', 'groups', 'branches'])) {
            this.prop(['ports', 'groups', 'branches', 'size', 'width'], height / 2 + this.stubLength!, options);
        }
    }

    /**
     * The constraints of resizing, or `null` if the element can't be resized.
     * The minimal size is a part of the default size unless the shape sets it.
     */
    resizeOptions(): ResizeOptions | null {
        const { resizable } = this;
        if (resizable === false) return null;
        const { width = 0, height = 0 } = this.defaults().size || {};
        return {
            minWidth: minSize(width),
            minHeight: minSize(height),
            ...(resizable === true ? {} : resizable)
        };
    }

    static isShape(cell: dia.Cell): cell is Shape {
        return cell instanceof Shape;
    }
}
