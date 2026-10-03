import type { dia } from '@joint/plus';
import Shape from '../shapes/common/Shape';

/*
 * The tags: the IDs of the elements (`P-101`, `FT-101`, ...), set by the user.
 * JointJS generates the `id` of a cell, but it can't be changed: the tag is an attribute of its own.
 * The runtime updates address the elements by their tags (see `simulation.ts`).
 */

// The first number of a prefix: `P-101`
const FIRST_NUMBER = 101;

export function getTag(element: dia.Element): string | undefined {
    return element.get('tag');
}

export function findByTag(graph: dia.Graph, tag: string): dia.Element | undefined {
    return graph.getElements().find(element => getTag(element) === tag);
}

/** The next free tag with the prefix of the element: `P-103` after `P-101` and `P-102`. */
export function nextTag(graph: dia.Graph, element: dia.Element): string {
    const prefix = Shape.isShape(element) ? element.tagPrefix : 'E';
    const numbers = graph.getElements()
        .map(getTag)
        .map(tag => tag?.match(new RegExp(`^${prefix}-(\\d+)$`)))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map(match => Number(match[1]));
    return `${prefix}-${numbers.length > 0 ? Math.max(...numbers) + 1 : FIRST_NUMBER}`;
}

/** Give the element a tag if it has none, or if another element has the same one. */
export function ensureTag(graph: dia.Graph, element: dia.Element, options?: dia.Cell.Options): void {
    const tag = getTag(element);
    const taken = tag && graph.getElements().some(other => other !== element && getTag(other) === tag);
    if (tag && !taken) return;
    element.set('tag', nextTag(graph, element), options);
}
