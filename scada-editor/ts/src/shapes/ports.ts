import { type dia, util } from '@joint/plus';
import { LABEL_COLOR } from '../const';
import { METAL_STROKE, pipeGradient } from './gradients';

/** The markup of a pipe stub (parsed once) */
const pipeStubMarkup = util.svg`
    <rect @selector='pipeBody' />
    <rect @selector='pipeEnd' />
`;

// The thickness of a pipe stub (its flange is a little taller, see `pipeEnd`)
const STUB_THICKNESS = 30;

/**
 * The group of the pipe stubs of a shape, `length` long (`Shape.stubLength`). The model of a port is
 * its stub: a stub is centered on the position of its port and turned by its angle (see `sideStub()`),
 * with its flange at the outer end (on the right at the angle 0).
 */
function pipeStubGroup(length: number): dia.Element.PortGroup {
    return {
        position: { name: 'absolute' },
        markup: pipeStubMarkup,
        size: { width: length, height: STUB_THICKNESS },
        attrs: {
            portRoot: {
                // The end of the stub: a pipe end can be connected to it (with its arrowhead),
                // but no pipe can be drawn from it (passive). It is highlighted alone.
                magnet: 'passive',
                magnetSelector: 'pipeEnd',
                highlighterSelector: 'pipeEnd'
            },
            pipeBody: {
                x: 'calc(-0.5 * w)',
                y: 'calc(-0.5 * h)',
                width: 'calc(w)',
                height: 'calc(h)',
                fill: pipeGradient
            },
            pipeEnd: {
                x: 'calc(0.5 * w - 10)',
                y: 'calc(-0.5 * h - 3)',
                width: 10,
                height: 'calc(h + 6)',
                stroke: METAL_STROKE,
                strokeWidth: 3,
                fill: 'var(--shape-flange-fill)'
            }
        }
    };
}

/** A side of an element. */
export type Side = 'left' | 'right' | 'top' | 'bottom';

// The angle of the stub on each side (a stub points to the right, turned clockwise)
const SIDE_ANGLES: Record<Side, number> = { right: 0, bottom: 90, left: 180, top: 270 };

/**
 * A stub `length` long sticking out of a side of the element, at the point `along` the side
 * (`calc()` of the width or the height, the middle by default): its port is in the middle of it.
 */
function sideStub(id: string, group: string, side: Side, length: number, along?: string, z = 0): dia.Element.Port {
    const out = length / 2;
    const vertical = side === 'left' || side === 'right';
    const middle = vertical ? 'calc(0.5 * h)' : 'calc(0.5 * w)';
    const across = { left: -out, right: `calc(w + ${out})`, top: -out, bottom: `calc(h + ${out})` }[side];
    const args = vertical
        ? { x: across, y: along ?? middle, angle: SIDE_ANGLES[side] }
        : { x: along ?? middle, y: across, angle: SIDE_ANGLES[side] };
    // Turned upside down on the left: mirrored back, so that it is shaded as on the right
    const attrs = side === 'left' ? { pipeBody: { transform: 'scale(1, -1)' }} : undefined;
    return { id, group, z, position: { args }, attrs };
}

/**
 * The pipe running through the element (or its `half` from a side to the middle) at the height of its stubs
 * (a part of the height, the middle by default): for a body the pipe shows through (a valve symbol,
 * an orifice plate) or a round one (it meets the stubs at the middle of the side only).
 */
export function pipeThroughAttributes(ratio = 0.5, half?: 'left' | 'right') {
    return {
        x: half === 'right' ? 'calc(0.5 * w)' : 0,
        width: half ? 'calc(0.5 * w)' : 'calc(w)',
        y: `calc(${ratio} * h - ${STUB_THICKNESS / 2})`,
        height: STUB_THICKNESS,
        fill: pipeGradient
    };
}

/**
 * The pipe stubs sticking out of a piece of equipment on the left and the right, `length` long,
 * in the middle of the height or at the heights (`calc()` of the height) of each side.
 * They are drawn as ports so that pipes can attach to their ends.
 */
export function pipePorts(
    length: number,
    { left, right }: { left?: string; right?: string } = {},
    [leftZ, rightZ]: [number, number] = [0, 0]
): dia.Element.Attributes['ports'] {
    return {
        groups: {
            pipes: pipeStubGroup(length)
        },
        items: [
            sideStub('left', 'pipes', 'left', length, left, leftZ),
            sideStub('right', 'pipes', 'right', length, right, rightZ)
        ]
    };
}

/**
 * The pipe stubs of a fitting (a tee, a cross, ...): one in the middle of each of the sides.
 * The ports are named after the sides.
 */
export function fittingPorts(sides: Side[], length: number): dia.Element.Attributes['ports'] {
    return {
        groups: {
            pipes: pipeStubGroup(length)
        },
        items: sides.map(side => sideStub(side, 'pipes', side, length))
    };
}

/** The stubs going down from the bottom at the points (`calc()` of the width): the outlets of a manifold. */
export function branchPorts(xs: string[], length: number): dia.Element.Attributes['ports'] {
    return {
        groups: {
            branches: pipeStubGroup(length)
        },
        items: xs.map((x, index) => sideStub(`out${index + 1}`, 'branches', 'bottom', length, x))
    };
}

export const labelAttributes = {
    textAnchor: 'middle',
    textVerticalAnchor: 'top',
    x: 'calc(0.5*w)',
    y: 'calc(h+10)',
    fontSize: 14,
    fontFamily: 'sans-serif',
    fill: LABEL_COLOR
};
