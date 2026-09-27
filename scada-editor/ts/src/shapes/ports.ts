import { type dia, util } from '@joint/plus';
import { LABEL_COLOR } from '../const';
import { METAL_STROKE, pipeGradient } from './gradients';

type PortArgs = NonNullable<dia.Element.Port['position']>['args'];

/**
 * The group of the pipe stubs at the `position`: each stub is drawn from there to the right
 * (turned by the `angle` of its position, see `fittingPorts()`), behind the element.
 * Its width (so that it reaches `Shape.stubLength` out of the element) is set by the shape.
 */
function pipeStubGroup(position: dia.Element.PortGroup['position']): dia.Element.PortGroup {
    return {
        position,
        markup: util.svg`
            <rect @selector='pipeBody' />
            <rect @selector='pipeEnd' />
        `,
        size: { width: 0, height: 30 },
        attrs: {
            portRoot: {
                // The end of the stub: a pipe end can be connected to it (with its arrowhead),
                // but no pipe can be drawn from it (passive). It is highlighted alone
                // (the port reaches the center of the element, hidden behind it).
                magnet: 'passive',
                magnetSelector: 'pipeEnd',
                highlighterSelector: 'pipeEnd'
            },
            pipeBody: {
                width: 'calc(w)',
                height: 'calc(h)',
                y: 'calc(h / -2)',
                fill: pipeGradient
            },
            pipeEnd: {
                width: 10,
                height: 'calc(h+6)',
                y: 'calc(h / -2 - 3)',
                stroke: METAL_STROKE,
                strokeWidth: 3,
                fill: 'white'
            }
        }
    };
}

/** A stub drawn from its position to the right, turned by the angle (the end of the stub at the end). */
const outwardStub = (id: string, group: string, args: PortArgs = {}, z = 0) => ({
    id,
    group,
    z,
    position: { args },
    attrs: {
        pipeEnd: { x: 'calc(w - 10)' }
    }
});

/**
 * The pipe stubs sticking out of a piece of equipment on the left and the right.
 * They are drawn as ports so that pipes can attach to their ends.
 * Both start at the `position` (usually the center of the element) and are drawn behind it.
 * A port can be moved from there by its position `args` (with the `absolute` position).
 */
export function pipePorts(
    position: dia.Element.PortGroup['position'],
    [leftZ, rightZ]: [number, number] = [0, 0],
    args: { left?: PortArgs; right?: PortArgs } = {}
): dia.Element.Attributes['ports'] {
    return {
        groups: {
            pipes: pipeStubGroup(position)
        },
        items: [{
            id: 'left',
            group: 'pipes',
            z: leftZ,
            position: { args: args.left },
            attrs: {
                pipeBody: { x: 'calc(-1 * w)' },
                pipeEnd: { x: 'calc(-1 * w)' }
            }
        }, outwardStub('right', 'pipes', args.right, rightZ)]
    };
}

/** A side of an element. */
export type Side = 'left' | 'right' | 'top' | 'bottom';

// The angle of the stub on each side (a stub is drawn to the right, turned clockwise)
const SIDE_ANGLES: Record<Side, number> = { right: 0, bottom: 90, left: 180, top: 270 };

/**
 * The pipe stubs of a fitting (a tee, a cross, ...): one on each of the sides, from its center.
 * The ports are named after the sides. The fitting is square: the stubs are as long on every side.
 */
export function fittingPorts(sides: Side[]): dia.Element.Attributes['ports'] {
    return {
        groups: {
            pipes: pipeStubGroup(centerPortPosition)
        },
        items: sides.map(side => outwardStub(side, 'pipes', { angle: SIDE_ANGLES[side] }))
    };
}

/**
 * The stubs going down from the positions (the outlets of a manifold): in a group of their own,
 * as long as the half of the height of the element (see `Shape.fitPipeStubs()`).
 */
export function branchPorts(xs: string[]): dia.Element.Attributes['ports'] {
    return {
        groups: {
            branches: pipeStubGroup({ name: 'absolute', args: { y: 'calc(h / 2)' }})
        },
        items: xs.map((x, index) => outwardStub(`out${index + 1}`, 'branches', { x, angle: 90 }))
    };
}

/** Both pipe stubs start at the center of the element. */
export const centerPortPosition: dia.Element.PortGroup['position'] = {
    name: 'absolute',
    args: { x: 'calc(w / 2)', y: 'calc(h / 2)' }
};

export const labelAttributes = {
    textAnchor: 'middle',
    textVerticalAnchor: 'top',
    x: 'calc(0.5*w)',
    y: 'calc(h+10)',
    fontSize: 14,
    fontFamily: 'sans-serif',
    fill: LABEL_COLOR
};
