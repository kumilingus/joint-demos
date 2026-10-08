import { dia, type g } from '@joint/plus';
import type { Overflow } from '../common/footprint';
import { GRID_SIZE, Layer } from '../../const';
import { DERIVED } from '../../history';
import { hasOutline, hasSurface, materialAttributes, SURFACE_COLOR, surfaceAttributes } from '../common/gradients';
import { flippedPorts, pipeAttributes } from '../common/ports';
import { fromModelAttributes } from '../attributes/label';
import { type Flip, flipAttributes, flipOf } from '../attributes/flip';
import { computedAttributes } from '../attributes/computed';
import { fromStyleAttributes } from '../attributes/from-style';

/** The size constraints of resizing. */
export interface ResizeOptions {
    preserveAspectRatio?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    /** The sides and corners it is resized by (all of them by default, see `SelectionController`) */
    directions?: dia.Direction[];
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

/**
 * A color the user sets (the Color, the Outline field of the inspector, the swatches of the colors of the diagram,
 * see `color-field.ts`): its path in the model, and its default if the defaults of the shape don't have it
 * (none of them: it can be none of the cell's own - Auto).
 */
export interface ColorField {
    /** Where it is set: in the style of the cell (`['style', 'accent']`, see `style.ts`) */
    path: string[];
    /** The part drawn in it (its selector and its attribute: `['bands', 'fill']`) - its own color the default */
    part?: [string, 'fill' | 'stroke'];
    defaultValue?: string;
}

/** What the editor needs to know about a cell of its own: a shape (see `ShapeFeatures`), a link (see `Connection`). */
export interface CellFeatures {
    /** The start of the generated tags (the IDs of the cells, see `tags.ts`): `P` for `P-101`; none - no IDs. */
    tagPrefix: string | null;
    /** Whether a new one gets an ID (a part of the plant, see `tags.ts`). */
    autoTag: boolean;
    /** The color the user sets, if any. */
    colorField: ColorField | null;
    /** The color of the outline the user sets, if any. */
    outlineField: ColorField | null;
    /** The color of the accent the user sets (a marking: the bands of a stack, a handwheel), if any. */
    accentField: ColorField | null;
}

/** What the editor needs to know about a shape (an element). */
export interface ShapeFeatures extends CellFeatures {
    /** Whether (and how) the element can be resized. */
    resizable: Resizable;
    /** Whether the element can be rotated. */
    rotatable: boolean;
    /** How the element can be flipped (its `flip`, see `flip.ts`): the parts of its markup in `directional`; `null` - not. */
    flippable: Flip | null;
    /** The control of the element, if it has one. */
    control: ControlKind | null;
    /** Where a pipe end can be anchored on the element (unless it has pipe stubs to connect to). */
    anchors: Anchors;
    /** The layer of the graph the element is in (see `layers.ts`). */
    graphLayer: Layer;
    /** How long the pipe stubs (`pipePorts()`) are, out of the element, if it has them (in grid steps: their ends stay on the grid). */
    stubLength: number | null;
    /** How far the drawing reaches out of the bounding box (on top of the label below it, see `footprint.ts`). */
    overflow: Overflow;
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
export default abstract class Shape extends dia.Element implements ShapeFeatures {

    // The surfaces in the color of the element (`surfaceFill`, `surfaceStroke`), the outlines of its pipes
    // (`pipeOutline`), its texts of the model (`fromModel`), the values of its style (`fromStyle`), the mirrored
    // parts of a flipped one (`flip`), the parts drawn from its data (`computed`); a shape with
    // attributes of its own adds them to these
    static attributes: typeof dia.Element.attributes = {
        ...surfaceAttributes, ...materialAttributes, ...pipeAttributes, ...fromModelAttributes, ...flipAttributes,
        ...computedAttributes, ...fromStyleAttributes
    };

    get resizable(): Resizable {
        return true;
    }

    get rotatable(): boolean {
        return true;
    }

    get flippable(): Flip | null {
        return null;
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

    /**
     * The prefix of the series of its IDs (see `plant/tags.ts`): the initials of the type by default - `CV` for a
     * `ControlValve`; none - never a part of the plant (a text, a zone)
     */
    get tagPrefix(): string | null {
        return String(this.get('type')).replace(/[^A-Z]/g, '');
    }

    /**
     * Whether a new one gets an ID (dropped from the palette): a part of the plant - the equipment, the instruments, the
     * charts of their values; not a picture, a background shape (an ID only when asked: the ID field of the inspector)
     */
    get autoTag(): boolean {
        return true;
    }

    /** The color of the surfaces of the element, if it has any (see `surfaceAttributes`): the metal of the theme by default */
    get colorField(): ColorField | null {
        return hasSurface(this) ? { path: ['style', 'color'], defaultValue: SURFACE_COLOR } : null;
    }

    /** The color of the outlines of its surfaces, if it has any: none of its own by default (Auto - as the shape draws them) */
    get outlineField(): ColorField | null {
        return hasOutline(this) ? { path: ['style', 'outline'] } : null;
    }

    /** The color of the accent of the element (a marking of it), if it has one: none by default */
    get accentField(): ColorField | null {
        return null;
    }

    initialize(...args: Parameters<dia.Element['initialize']>): void {
        super.initialize(...args);
        // Its ports mirrored with its drawing (see `flip.ts`): derived, not in the history
        if (this.flippable) {
            this.flipPorts();
            this.on('change:flip', (_cell: dia.Cell, _flip: unknown, options: dia.Cell.Options) => this.flipPorts(options));
        }
        // In the layer of its kind (unless it says otherwise, e.g. in the JSON)
        if (!this.has('layer')) this.set('layer', this.graphLayer, { silent: true });
    }

    /** The flip its ports are laid out with (see `flipPorts()`): declared - set in `initialize()`, called by the constructor */
    private declare portsFlip?: string;

    /** The ports of its defaults with their stubs flipped as the element (see `flipStub()`), when its flip changes */
    protected flipPorts(options: dia.Cell.Options = {}): void {
        const flip = flipOf(this);
        if (flip === (this.portsFlip ?? '')) return;
        this.portsFlip = flip;
        const { unset: _unset, ...setOptions } = options;
        this.set('ports', flippedPorts(this.defaults().ports, flip), { ...setOptions, ...DERIVED });
    }

    /**
     * Without the ports: they are the shape's (its pipe stubs, its terminals), not the diagram's - an element
     * gets them from the defaults of its shape when it is created from the JSON (a busbar makes them of its taps);
     * nor a finish `auto` (none of its own).
     */
    toJSON(options?: dia.Cell.ExportOptions): dia.Cell.JSON {
        const { ports: _ports, ...json } = super.toJSON(options);
        // No finish of its own (Auto: of the diagram, see `finishOf()`)
        const style: Record<string, unknown> | undefined = json.style;
        if (style?.finish === 'auto') delete style.finish;
        // No style, no data of its own: none (an empty one left by a value removed)
        (['style', 'data'] as const).forEach((key) => {
            const value = json[key];
            if (value && typeof value === 'object' && Object.keys(value).length === 0) delete json[key];
        });
        return json;
    }

    /**
     * The attributes of a computed part (by its selector, see `computed.ts`) for the model of the element and its
     * size: none by default - a shape with computed parts overrides it
     */
    getComputedAttrs(_selector: string, _bbox: g.Rect): Record<string, unknown> {
        return {};
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

