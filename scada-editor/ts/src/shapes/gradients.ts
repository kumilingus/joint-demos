import type { dia } from '@joint/plus';

/*
 * The shading of the equipment: brushed steel lit from the top left.
 * The highlight is off-center and the edges are darker, so that
 * the cylinders and the spheres read as round.
 */

/** The outline of the metal parts: the color of the shaded edge, so the outline blends into it. */
export const METAL_STROKE = '#6a737b';

const metalStops = [
    { offset: '0%', color: '#737c84' },
    { offset: '10%', color: '#a3acb4' },
    { offset: '24%', color: '#e9edf0' },
    { offset: '32%', color: '#ffffff' },
    { offset: '48%', color: '#d6dce1' },
    { offset: '78%', color: '#a7b0b8' },
    { offset: '100%', color: '#6a737b' }
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
        { offset: '0%', color: '#ffffff' },
        { offset: '40%', color: '#eef1f4' },
        { offset: '80%', color: '#bac2c9' },
        { offset: '100%', color: '#7f888f' }
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
        { offset: '0%', color: '#f4f6f8' },
        { offset: '45%', color: '#dde2e6' },
        { offset: '100%', color: '#b9c1c8' }
    ],
    attrs: {
        x1: '0%',
        y1: '0%',
        x2: '100%',
        y2: '100%'
    }
};
