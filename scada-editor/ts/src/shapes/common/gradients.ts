import type { dia } from '@joint/plus';
import type Shape from './Shape';
import { styleOf } from './style';
import { getCellDefaults } from '../defaults';

/*
 * The shading of the equipment: brushed steel lit from the top left.
 * The highlight is off-center and the edges are darker, so that
 * the cylinders and the spheres read as round.
 * The colors are CSS variables (`--shape-metal-*`, ... in `shapes.css`): blue steel in the dark theme.
 */

/** The outline of the metal parts: the color of the shaded edge, so the outline blends into it. */
export const METAL_STROKE = 'var(--shape-metal-stroke)';

// The outline of the flat finish: the edge of the metal (darker than the flat surfaces in the dark scheme)
const FLAT_STROKE = 'var(--shape-flat-stroke)';

const metalStops = [
    { offset: '0%', color: 'var(--shape-metal-1)' },
    { offset: '10%', color: 'var(--shape-metal-2)' },
    { offset: '24%', color: 'var(--shape-metal-3)' },
    { offset: '32%', color: 'var(--shape-metal-4)' },
    { offset: '48%', color: 'var(--shape-metal-5)' },
    { offset: '78%', color: 'var(--shape-metal-6)' },
    { offset: '100%', color: 'var(--shape-metal-7)' }
];

/** A vertical cylinder (a tank, a stack): the shading runs from the left to the right. */
export const cylinderGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: metalStops
};

/** A horizontal cylinder (a pipe, a heat exchanger shell): the shading runs from the top to the bottom. */
export const pipeGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: metalStops,
    attrs: {
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
    }
};

/** A sphere (a valve body, a pump casing): the highlight is up and to the left of the center. */
export const sphereGradient: dia.SVGGradientJSON = {
    type: 'radialGradient',
    stops: [
        { offset: '0%', color: 'var(--shape-sphere-1)' },
        { offset: '40%', color: 'var(--shape-sphere-2)' },
        { offset: '80%', color: 'var(--shape-sphere-3)' },
        { offset: '100%', color: 'var(--shape-sphere-4)' }
    ],
    attrs: {
        cx: '50%',
        cy: '50%',
        r: '50%',
        fx: '35%',
        fy: '30%'
    }
};

/**
 * A cone (the bottom of a conic tank): the same metal as the cylinder above it,
 * but the slope reflects the light differently - the shading is tilted.
 */
export const coneGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: metalStops,
    attrs: {
        gradientTransform: 'rotate(-10)'
    }
};

/** A flat metal plate (a panel): lit from the top left, the same metal as the rest. */
export const plateGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: 'var(--shape-plate-1)' },
        { offset: '45%', color: 'var(--shape-plate-2)' },
        { offset: '100%', color: 'var(--shape-plate-3)' }
    ],
    attrs: {
        x1: '0%',
        y1: '0%',
        x2: '100%',
        y2: '100%'
    }
};

/** A copper bar (a busbar, a ground rod): the shading runs from the top to the bottom. */
export const copperGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: 'var(--shape-copper-1)' },
        { offset: '35%', color: 'var(--shape-copper-2)' },
        { offset: '100%', color: 'var(--shape-copper-3)' }
    ],
    attrs: {
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
    }
};

/** A porcelain insulator (a bushing, a post, an arrester): glazed, the shading from the left to the right. */
export const porcelainGradient: dia.SVGGradientJSON = {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: 'var(--shape-porcelain-1)' },
        { offset: '35%', color: 'var(--shape-porcelain-2)' },
        { offset: '100%', color: 'var(--shape-porcelain-3)' }
    ]
};

/** The glass of a bulb: the highlight up and to the left. */
export const glassGradient: dia.SVGGradientJSON = {
    type: 'radialGradient',
    stops: [
        { offset: '0%', color: 'var(--shape-glass-1)' },
        { offset: '100%', color: 'var(--shape-glass-2)' }
    ],
    attrs: {
        cx: '35%',
        cy: '35%',
        r: '70%'
    }
};

/*
 * The surface of an element in its own color (the `color` of the model, set in the inspector): each stop of the
 * shading mixed with it - the highlight stays light, the edges dark - in the colors of the theme still.
 * Its gradient is defined once for each color (the paper defines a gradient by its JSON). The default
 * color (a CSS variable) leaves the surface as the metal of the theme.
 */

/** The default color of a surface: the metal as it is (see `surfaceAttributes`) */
export const SURFACE_COLOR = 'var(--shape-metal-3)';

// How much of the color there is in the surface (%): more flattens the shading.
const TINT = 55;

const tint = (color: string, base: string) => `color-mix(in oklab, ${color} ${TINT}%, ${base})`;

/** Whether the surface is tinted with the color: any but the default one (a hex, a color of the theme) */
const isTint = (color: unknown): color is string => typeof color === 'string' && color !== '' && color !== SURFACE_COLOR;

// The shadings of the surfaces: of the metal
const SURFACE_GRADIENTS = {
    cylinder: cylinderGradient,
    pipe: pipeGradient,
    sphere: sphereGradient,
    cone: coneGradient,
    plate: plateGradient
};

// The flat surfaces of the metal: the light ones (`flat`), the details (`dark` - a stem, a shaft, feet; `mid`; `pale`)
const FLAT_SURFACES = {
    'flat': 'var(--shape-metal-flat)',
    'flat-2': 'var(--shape-metal-flat-2)',
    'dark': 'var(--shape-metal-dark)',
    'mid': 'var(--shape-metal-mid)',
    'pale': 'var(--shape-metal-pale)'
};

// The details of the metal: in a darker tone of the color of the element (see `surfaceFillOf()`)
const DETAILS = new Set<string>(['dark', 'mid', 'pale']);

/** A color of a shape of its own (a CSS variable of the theme, a hex) a surface can have instead of a kind of the metal */
export type SurfaceColor = `var(${string})` | `#${string}`;

const isSurfaceColor = (value: string): value is SurfaceColor => value.startsWith('var(') || value.startsWith('#');

/** The fill of a surface: a shading (by the form of the part), the flat metal, or a color of the shape (flat) */
export type SurfaceFill = keyof typeof SURFACE_GRADIENTS | keyof typeof FLAT_SURFACES | SurfaceColor;

/**
 * The finish of the surfaces of an element (its `finish`, set in the inspector): shaded (their gradients, the color
 * mixed into them), or flat - the color as it is, every surface outlined, as the high-performance HMI (ISA-101)
 * style draws the equipment (in the color of the canvas: a line drawing, as a P&ID).
 */
export type SurfaceFinish = 'shaded' | 'flat';

/** The finish of the diagram (its style, see `diagram-style.ts`): of the elements without one of their own */
let styleFinish: SurfaceFinish = 'shaded';

export function setStyleFinish(finish: SurfaceFinish): void {
    styleFinish = finish;
}

/** The finish of the element: its own (`finish` set, shaded or flat), else of the diagram (Auto: none, or `auto`) */
export function finishOf(model: dia.Cell): SurfaceFinish {
    const finish = styleOf(model, 'finish');
    return finish === 'shaded' || finish === 'flat' ? finish : styleFinish;
}

/**
 * The width of the outlines of an element outlined (its `outline`, the flat finish): one for all its surfaces -
 * its own (`outlineWidth`, set in the inspector), else of the diagram (Auto). The border of a pipe too (see `Pipe`).
 */
export type OutlineWidth = 'thin' | 'normal' | 'thick';

/** The widths to pick: their names, their widths (px) */
export const OUTLINE_WIDTHS: Record<OutlineWidth, { name: string; px: number }> = {
    thin: { name: 'Thin', px: 1 },
    normal: { name: 'Normal', px: 2 },
    thick: { name: 'Thick', px: 3 }
};

/** The outline width of the diagram (its style): of the cells without one of their own */
let styleOutlineWidth: OutlineWidth = 'normal';

export function setStyleOutlineWidth(width: OutlineWidth | undefined): void {
    styleOutlineWidth = width && width in OUTLINE_WIDTHS ? width : 'normal';
}

/** The outline width of the cell: its own (`outlineWidth` set), else of the diagram (Auto: none, or `auto`) */
export function outlineWidthOf(model: dia.Cell): number {
    const width = String(styleOf(model, 'outlineWidth'));
    return OUTLINE_WIDTHS[width in OUTLINE_WIDTHS ? width as OutlineWidth : styleOutlineWidth].px;
}

/** The finish of the diagram (its style) */
export function getStyleFinish(): SurfaceFinish {
    return styleFinish;
}

/**
 * The outline of the surfaces of the element, if it is outlined: its own (`outline`, a color set in the inspector),
 * or in the flat finish the edge of the metal; `null` - the surfaces' own outlines (shaded: in the color mixed).
 * The color of the element is of the fills.
 */
function outlineOf(model: dia.Cell): string | null {
    const outline = styleOf(model, 'outline');
    if (typeof outline === 'string' && outline !== '') return outline;
    // Flat: of an element with a finish only (a gauge, a thermometer has none - not restyled by the diagram's finish)
    return model.isElement() && hasFinish(model) && finishOf(model) === 'flat' ? FLAT_STROKE : null;
}

/** Whether the color of the element is its outline (a gauge: its frame) - drawn as wide as the shape draws it */
const isColorOutline = (shape: Shape) => shape.colorField?.path.join('/') === 'style/outline';

// A shaded surface made flat: the middle tone of its shading
const FLAT_SHADING = 'var(--shape-metal-5)';

// The outlines of the surfaces of the metal
const SURFACE_STROKES = {
    // The shaded edge of the metal: the outline blends into it
    edge: METAL_STROKE
};

/** The outline of a surface: of the metal, or a color of the shape */
export type SurfaceStroke = keyof typeof SURFACE_STROKES | SurfaceColor;

/** The gradient tinted with the color */
function tintGradient(gradient: dia.SVGGradientJSON, color: string): dia.SVGGradientJSON {
    return { ...gradient, stops: gradient.stops.map(stop => ({ ...stop, color: tint(color, stop.color) })) };
}

/**
 * The special attributes of the surfaces of an element, in its color and its finish: `surfaceFill` (the shading
 * of the part), `surfaceStroke` (its outline) - a kind of the metal, or a color of the shape (its color mixed into
 * that one as into the metal). The view renders them again when they change (see `ShapeView`).
 */
export const surfaceAttributes = {
    // `surfaceFill` in the attributes
    'surface-fill': {
        set(this: dia.ElementView, fill: SurfaceFill) {
            // Outlined: every surface (one without an outline of its own too)
            const outline = outlineOf(this.model);
            const outlined = outline ? { stroke: outline, 'stroke-width': outlineWidthOf(this.model) } : {};
            return { fill: surfaceFillOf(this, fill), ...outlined };
        }
    },
    // `surfaceStroke` in the attributes
    'surface-stroke': {
        // Of a shape only (see `Shape.attributes`)
        set(this: dia.ElementView<Shape>, stroke: SurfaceStroke) {
            const outline = outlineOf(this.model);
            if (outline) return isColorOutline(this.model) ? { stroke: outline } : { stroke: outline, 'stroke-width': outlineWidthOf(this.model) };
            const color = styleOf(this.model, 'color');
            const base = isSurfaceColor(stroke) ? stroke : SURFACE_STROKES[stroke];
            return { stroke: isTint(color) ? tint(color, base) : base };
        }
    }
};

/** The fill of the surface of the element view: in its finish and its color */
function surfaceFillOf(view: dia.ElementView, fill: SurfaceFill): string {
    const { model } = view;
    const color = styleOf(model, 'color');
    // Flat: the color as it is (nothing to shade) - a detail keeps its darker tone of it
    if (finishOf(model) === 'flat' && isTint(color) && !DETAILS.has(fill)) return color;
    // A flat one (a color of the shape, the flat metal), or a shaded one made flat
    const flat = isSurfaceColor(fill) ? fill : FLAT_SURFACES[fill as keyof typeof FLAT_SURFACES];
    if (flat || finishOf(model) === 'flat') {
        const base = flat ?? FLAT_SHADING;
        return isTint(color) ? tint(color, base) : base;
    }
    const gradient = SURFACE_GRADIENTS[fill as keyof typeof SURFACE_GRADIENTS];
    return `url(#${view.paper!.defineGradient(isTint(color) ? tintGradient(gradient, color) : gradient)})`;
}

// The materials other than the metal (their own colors, not tinted with the color of the element)
const MATERIAL_GRADIENTS = {
    porcelain: porcelainGradient,
    copper: copperGradient,
    glass: glassGradient
};

/** A material of a part: shaded by its gradient, or flat (its middle tone) in the flat finish */
export type MaterialFill = keyof typeof MATERIAL_GRADIENTS;

/** The special attribute of a part of a material (`materialFill`): in the finish of the element, in its own colors */
export const materialAttributes = {
    // `materialFill` in the attributes
    'material-fill': {
        set(this: dia.ElementView, material: MaterialFill) {
            const gradient = MATERIAL_GRADIENTS[material];
            if (finishOf(this.model) === 'flat') return { fill: gradient.stops[1]?.color ?? gradient.stops[0].color };
            return { fill: `url(#${this.paper!.defineGradient(gradient)})` };
        }
    }
};

/** The surfaces of the types (see `surfacesOf()`) */
const surfaceTypes = new Map<string, { fills: Set<SurfaceFill>; outlined: boolean; materials: boolean }>();

/** The surfaces of the element: the fills (`surfaceFill`) in the attributes of its type, whether it has outlines (`surfaceStroke`) */
function surfacesOf(element: dia.Element): { fills: Set<SurfaceFill>; outlined: boolean; materials: boolean } {
    const type = element.get('type');
    if (!surfaceTypes.has(type)) {
        const { attrs = {}} = getCellDefaults(element);
        const nodes = Object.values(attrs).filter(Boolean) as Record<string, unknown>[];
        surfaceTypes.set(type, {
            fills: new Set(nodes.map(node => node.surfaceFill).filter(Boolean) as SurfaceFill[]),
            outlined: nodes.some(node => 'surfaceStroke' in node),
            materials: nodes.some(node => 'materialFill' in node)
        });
    }
    return surfaceTypes.get(type)!;
}

const surfaceFills = (element: dia.Element) => surfacesOf(element).fills;

/** Whether the element has a finish (shaded or flat): surfaces of the metal or parts of a material */
export function hasFinish(element: dia.Element): boolean {
    const { fills, materials } = surfacesOf(element);
    return fills.size > 0 || materials;
}

/** Whether the element can be outlined (its `outline`): it has surfaces, or outlines of them */
export function hasOutline(element: dia.Element): boolean {
    const { fills, outlined } = surfacesOf(element);
    return fills.size > 0 || outlined;
}

/**
 * Whether the element has surfaces (its color can be set): `surfaceFill` in the attributes of its type
 * (an outline alone, `surfaceStroke`, would show the color hardly)
 */
export function hasSurface(element: dia.Element): boolean {
    return surfaceFills(element).size > 0;
}
