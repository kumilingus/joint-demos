import { type dia, util } from '@joint/plus';
import { LABEL_COLOR } from '../const';
import { METAL_STROKE, pipeGradient } from './gradients';

type PortArgs = NonNullable<dia.Element.Port['position']>['args'];

/**
 * The pipe stubs sticking out of a piece of equipment on the left and the right.
 * They are drawn as ports so that pipes can attach to their ends.
 * Both start at the `position` (usually the center of the element) and are drawn behind it:
 * their width (so that they reach `Shape.stubLength` out of the element) is set by the shape.
 * A port can be moved from there by its position `args` (with the `absolute` position).
 */
export function pipePorts(
    position: dia.Element.PortGroup['position'],
    [leftZ, rightZ]: [number, number] = [0, 0],
    args: { left?: PortArgs; right?: PortArgs } = {}
): dia.Element.Attributes['ports'] {
    return {
        groups: {
            pipes: {
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
            }
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
        }, {
            id: 'right',
            group: 'pipes',
            z: rightZ,
            position: { args: args.right },
            attrs: {
                pipeEnd: { x: 'calc(w - 10)' }
            }
        }]
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
