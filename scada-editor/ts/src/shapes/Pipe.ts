import { dia, util } from '@joint/plus';
import { followRouting, routingAttributes } from './routing';
import { Layer, PIPE_COLOR } from '../const';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='outline' fill='none' />
    <path @selector='line' fill='none' />
    <path @selector='flow' fill='none' />
`;

export default class Pipe extends dia.Link {

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'Pipe',
            layer: Layer.Pipes,
            z: -1,
            routing: 'orthogonal',
            ...routingAttributes('orthogonal'),
            attrs: {
                // An invisible wide stroke that makes the pipe easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 40,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    cursor: 'move'
                },
                outline: {
                    connection: true,
                    stroke: '#444',
                    strokeWidth: 16,
                    strokeLinejoin: 'round',
                    // Reaching under the element it connects to (the pipes are drawn under the equipment):
                    // no gap at a slanted side (the tip of a zone) or a round one
                    strokeLinecap: 'square'
                },
                line: {
                    connection: true,
                    stroke: PIPE_COLOR,
                    strokeWidth: 10,
                    strokeLinejoin: 'round',
                    // Reaching under the element it connects to (the pipes are drawn under the equipment):
                    // no gap at a slanted side (the tip of a zone) or a round one
                    strokeLinecap: 'square'
                },
                // The dashes of the flowing liquid: hidden, shown by the animation in the runtime mode
                flow: {
                    connection: true,
                    stroke: '#ffffff',
                    strokeOpacity: 0,
                    strokeWidth: 3,
                    strokeDasharray: '6 18',
                    strokeLinecap: 'round',
                    pointerEvents: 'none'
                }
            }
        };
    }

    preinitialize(): void {
        this.markup = markup;
    }

    initialize(...args: Parameters<dia.Link['initialize']>): void {
        super.initialize(...args);
        followRouting(this);
    }
}
