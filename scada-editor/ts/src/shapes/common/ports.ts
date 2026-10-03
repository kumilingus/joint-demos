import { type dia, util } from '@joint/plus';

/**
 * The special attributes of the pipes of a shape (its stubs, a pipe running through it): `pipeOutline` - the outline
 * of the rectangle of a pipe along it only, its top and bottom sides (a dash of its length, a gap of its thickness:
 * from the model, its `width` and `height`), not its ends - they meet the element, a flange, another pipe.
 */
export const pipeAttributes = {
    // `fillFrom` in the attributes: the fill as a color of another part (its path in the attributes, e.g. `['line', 'stroke']`)
    // - parts of one color, set on one of them (the accent of a chart, see `accentField`)
    'fill-from': {
        set(this: dia.ElementView, path: string[]) {
            return { fill: this.model.attr(path) };
        }
    },
    // `pipeOutline` in the attributes
    'pipe-outline': {
        set(_value: boolean, refBBox: dia.BBox, _node: Element, attrs: Record<string, unknown>) {
            const size = (value: unknown) => Number(util.evalCalcExpression(String(value ?? 0), refBBox)) || 0;
            return { 'stroke-dasharray': `${size(attrs.width)} ${size(attrs.height)}` };
        }
    }
};

/** The markup of a pipe stub (parsed once) */
const pipeStubMarkup = util.svg`
    <rect @selector='pipeBody' />
    <rect @selector='pipeEnd' />
`;

// The thickness of a pipe stub (its flange is a little taller, see `pipeEnd`)
const STUB_THICKNESS = 30;

// How far a pipe stub reaches under a piece of equipment (its body: no gap at a round side); a fitting is flat
// where its stubs meet it (none needed)
const STUB_TUCK = 20;

/**
 * The group of the pipe stubs of a shape, `length` long (`Shape.stubLength`) out of it and `tuck` under it.
 * The model of a port is its stub: a stub is centered on the position of its port and turned by its angle
 * (see `sideStub()`), with its flange at the outer end (on the right at the angle 0).
 */
function pipeStubGroup(length: number, tuck = STUB_TUCK): dia.Element.PortGroup {
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
            // In the color of the element (see `surfaceAttributes`), tucked under it
            pipeBody: {
                x: `calc(-0.5 * w - ${tuck})`,
                y: 'calc(-0.5 * h)',
                width: `calc(w + ${tuck})`,
                height: 'calc(h)',
                surfaceFill: 'pipe',
                // Its edges (the flat finish has no shading to show them), along it only
                surfaceStroke: 'edge',
                strokeWidth: 2,
                pipeOutline: true
            },
            pipeEnd: {
                x: 'calc(0.5 * w - 10)',
                y: 'calc(-0.5 * h - 3)',
                width: 10,
                height: 'calc(h + 6)',
                surfaceStroke: 'edge',
                strokeWidth: 3,
                // Its face in the color of the element too
                surfaceFill: 'var(--shape-flange-fill)'
            }
        }
    };
}

/** The markup of an electrical terminal (parsed once) */
const terminalMarkup = util.svg`
    <path @selector='lead' />
    <circle @selector='terminal' />
`;

// How far a terminal reaches out of the element
const TERMINAL_LENGTH = 12;

/**
 * The group of the electrical terminals: a lead out of the side (the model of the port, centered
 * on its position and turned by its angle as a pipe stub) with the terminal at its end. A wire connects
 * to the terminal (see `Wire`).
 */
function terminalGroup(): dia.Element.PortGroup {
    return {
        position: { name: 'absolute' },
        markup: terminalMarkup,
        size: { width: TERMINAL_LENGTH, height: 10 },
        attrs: {
            portRoot: {
                magnet: 'passive',
                magnetSelector: 'terminal',
                highlighterSelector: 'terminal'
            },
            lead: {
                d: 'M calc(-0.5 * w) 0 H calc(0.5 * w)',
                stroke: 'var(--shape-instrument-ink)',
                strokeWidth: 2.5
            },
            terminal: {
                cx: 'calc(0.5 * w)',
                r: 4,
                fill: 'var(--shape-face)',
                stroke: 'var(--shape-instrument-ink)',
                strokeWidth: 2
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
function sideStub(id: string, group: string, side: Side, length: number, along?: string | number, z = 0): dia.Element.Port {
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
        surfaceFill: 'pipe',
        surfaceStroke: 'edge',
        strokeWidth: 2,
        pipeOutline: true
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
            pipes: pipeStubGroup(length, 0)
        },
        items: sides.map(side => sideStub(side, 'pipes', side, length))
    };
}

/** An electrical terminal of an element: on a side, at a point `along` it (the middle by default). */
export interface Terminal {
    id: string;
    side: Side;
    along?: string | number;
}

/** Whether the port is an electrical terminal (a wire connects to it, a pipe doesn't) */
export function isTerminal(port: dia.Element.Port): boolean {
    return port.group === 'terminals';
}

/** A terminal on a side, at a point `along` it (see `terminalPorts()`): for the ports changed with the size (see `Busbar`) */
export function terminal({ id, side, along }: Terminal): dia.Element.Port {
    return sideStub(id, 'terminals', side, TERMINAL_LENGTH, along);
}

/** The electrical terminals of an element (see `terminalGroup()`) */
export function terminalPorts(terminals: Terminal[]): dia.Element.Attributes['ports'] {
    return {
        groups: {
            terminals: terminalGroup()
        },
        items: terminals.map(terminal)
    };
}

/** The stubs going down from the bottom at the points (`calc()` of the width): the outlets of a manifold. */
export function branchPorts(xs: string[], length: number): dia.Element.Attributes['ports'] {
    return {
        groups: {
            branches: pipeStubGroup(length, 0)
        },
        items: xs.map((x, index) => sideStub(`out${index + 1}`, 'branches', 'bottom', length, x))
    };
}
