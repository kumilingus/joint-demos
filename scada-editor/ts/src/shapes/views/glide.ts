import type { dia } from '@joint/plus';
import { type DataKey, dataOf } from '../common/data';

/*
 * A shape showing a value by a part of it (a level, a charge, a column): its view glides the part from the value it
 * drew last to the value now, when it draws the element again - on a paper that lets it (the runtime mode, unless the
 * animations are the alarms only, see `Animations`). However often the value changed in between, the latest counts.
 */

/** A shape gliding to its value: the value (of its data), the keyframe of each part (by its selector) at a value */
export interface Gliding {
    glideProperty: DataKey;
    glideKeyframes(value: number): Record<string, Keyframe>;
}

export function isGliding(cell: dia.Cell): cell is dia.Element & Gliding {
    return cell.isElement() && 'glideKeyframes' in cell && typeof cell.glideKeyframes === 'function';
}

// How long a glide takes (ms)
const GLIDE_DURATION = 1000;

/** The papers the values glide on */
const glidingPapers = new WeakSet<dia.Paper>();

/** Let the values glide on the paper, or not */
export function setGliding(paper: dia.Paper, gliding: boolean): void {
    if (gliding) glidingPapers.add(paper); else glidingPapers.delete(paper);
}

/** The value a view drew last, its glide (by the view) */
const glidesOf = new WeakMap<dia.ElementView, { drawnValue: number; glides: Animation[] }>();

/** The parts of the element glide from the value the view drew last to the value now (drawn already): its view drawn again */
export function glide(view: dia.ElementView): void {
    const { model } = view;
    if (!isGliding(model)) return;
    const value = Number(dataOf(model, model.glideProperty)) || 0;
    const last = glidesOf.get(view);
    const glides = last?.glides ?? [];
    glidesOf.set(view, { drawnValue: value, glides });
    const drawn = last?.drawnValue;
    if (drawn === undefined || drawn === value || !view.paper || !glidingPapers.has(view.paper)) return;
    glides.forEach(animation => animation.cancel());
    const [from, to] = [model.glideKeyframes(drawn), model.glideKeyframes(value)];
    glidesOf.set(view, { drawnValue: value, glides: Object.keys(to).flatMap((selector) => {
        const node = view.findNode(selector);
        return node ? [node.animate([from[selector], to[selector]], { duration: GLIDE_DURATION, easing: 'ease-in-out' })] : [];
    }) });
}
