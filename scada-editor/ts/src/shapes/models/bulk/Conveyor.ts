import { dia, util } from '@joint/plus';
import { Layer } from '../../../const';
import { followRouting, routingAttributes } from '../../common/routing';
import type { ColorField } from '../../common/Shape';

/** The markup of the shape: parsed once, shared by all its elements. */
const markup = util.svg/* xml */`
    <path @selector='wrapper' fill='none' />
    <path @selector='outline' fill='none' />
    <path @selector='belt' fill='none' />
    <path @selector='cleats' fill='none' />
`;

// The width of the belt, and of its outline around it
const BELT_WIDTH = 14;
const OUTLINE_WIDTH = 20;

/** The pattern of the cleats across the belt: their length along it and the gap after each (see `animations.ts`) */
export const CLEAT_PATTERN = [3, 13];

/**
 * A belt conveyor between the equipment (from a crusher to a mill, from a hopper up to a silo): a link drawn as a belt,
 * straight, inclined or turning on its route. While it runs (`power`) the cleats across the belt move from its start
 * to its end in the runtime mode.
 */
export default class Conveyor extends dia.Link {

    // The color of the belt (see `ColorField`)
    get colorField(): ColorField {
        return { path: ['attrs', 'belt', 'stroke'], defaultValue: 'var(--shape-belt)' };
    }

    // The color of its outline: the dark of the theme by default
    get outlineField(): ColorField {
        return { path: ['attrs', 'outline', 'stroke'], defaultValue: 'var(--shape-belt-outline)' };
    }

    // The accent: the cleats across the belt
    get accentField(): ColorField {
        return { path: ['attrs', 'cleats', 'stroke'], defaultValue: 'var(--shape-belt-cleat)' };
    }

    defaults(): dia.Link.Attributes {
        return {
            ...super.defaults,
            type: 'Conveyor',
            layer: Layer.Pipes,
            z: -1,
            routing: 'straight',
            ...routingAttributes('straight'),
            // 0 = stopped, 1 = running
            power: 1,
            attrs: {
                // An invisible wide stroke that makes the belt easy to grab.
                wrapper: {
                    connection: true,
                    stroke: 'transparent',
                    strokeWidth: 40,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round'
                },
                // Reaching under the element it connects to (the conveyors are drawn under the equipment)
                outline: {
                    connection: true,
                    stroke: 'var(--shape-belt-outline)',
                    strokeWidth: OUTLINE_WIDTH,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'square'
                },
                belt: {
                    connection: true,
                    stroke: 'var(--shape-belt)',
                    strokeWidth: BELT_WIDTH,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'square'
                },
                // The cleats: dashes across the whole width of the belt
                cleats: {
                    connection: true,
                    stroke: 'var(--shape-belt-cleat)',
                    strokeWidth: BELT_WIDTH,
                    strokeDasharray: CLEAT_PATTERN.join(' '),
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
