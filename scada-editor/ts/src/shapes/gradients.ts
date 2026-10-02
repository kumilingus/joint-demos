import { type dia, util } from '@joint/plus';

/*
 * The shading of the equipment: brushed steel lit from the top left.
 * The highlight is off-center and the edges are darker, so that
 * the cylinders and the spheres read as round.
 * The colors are CSS variables (`--shape-metal-*`, ... in `shapes.css`): blue steel in the dark theme.
 */

/** The outline of the metal parts: the color of the shaded edge, so the outline blends into it. */
export const METAL_STROKE = 'var(--shape-metal-stroke)';

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

/** Whether the surface is tinted with the color (not the default one) */
const isTint = (color: unknown): color is string => typeof color === 'string' && !color.startsWith('var(');

// The shadings of the surfaces: of the metal
const SURFACE_GRADIENTS = {
    cylinder: cylinderGradient,
    pipe: pipeGradient,
    sphere: sphereGradient,
    cone: coneGradient,
    plate: plateGradient
};

/** The fill of a surface: a shading (by the form of the part), or flat (`--shape-metal-flat`, `--shape-metal-flat-2`) */
export type SurfaceFill = keyof typeof SURFACE_GRADIENTS | 'flat' | 'flat-2';

// The outlines of the surfaces
const SURFACE_STROKES = {
    // The shaded edge of the metal: the outline blends into it
    edge: METAL_STROKE
};

/** The outline of a surface */
export type SurfaceStroke = keyof typeof SURFACE_STROKES;

/** The gradient tinted with the color */
function tintGradient(gradient: dia.SVGGradientJSON, color: string): dia.SVGGradientJSON {
    return { ...gradient, stops: gradient.stops.map(stop => ({ ...stop, color: tint(color, stop.color) })) };
}

/**
 * The special attributes of the surfaces of an element, in its color: `surfaceFill` (the shading of the part),
 * `surfaceStroke` (its outline). The view renders them again when the color changes (see `ShapeView`).
 */
export const surfaceAttributes = {
    // `surfaceFill` in the attributes
    'surface-fill': {
        set(this: dia.ElementView, fill: SurfaceFill) {
            const color = this.model.get('color');
            if (fill === 'flat' || fill === 'flat-2') {
                const base = `var(--shape-metal-${fill})`;
                return { fill: isTint(color) ? tint(color, base) : base };
            }
            const gradient = SURFACE_GRADIENTS[fill];
            return { fill: `url(#${this.paper!.defineGradient(isTint(color) ? tintGradient(gradient, color) : gradient)})` };
        }
    },
    // `surfaceStroke` in the attributes
    'surface-stroke': {
        set(this: dia.ElementView, stroke: SurfaceStroke) {
            const color = this.model.get('color');
            const base = SURFACE_STROKES[stroke];
            return { stroke: isTint(color) ? tint(color, base) : base };
        }
    }
};

/** The types with surfaces (see `hasSurface()`) by whether they have them */
const surfaceTypes = new Map<string, boolean>();

/**
 * Whether the element has surfaces (its color can be set): `surfaceFill` in the attributes of its type
 * (an outline alone, `surfaceStroke`, would show the color hardly)
 */
export function hasSurface(element: dia.Element): boolean {
    const type = element.get('type');
    if (!surfaceTypes.has(type)) {
        const { attrs = {}} = util.result(element, 'defaults') as dia.Element.Attributes;
        surfaceTypes.set(type, Object.values(attrs).some(node => node && 'surfaceFill' in node));
    }
    return surfaceTypes.get(type)!;
}
