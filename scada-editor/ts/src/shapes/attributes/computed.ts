import { type dia, type g, util } from '@joint/plus';
import { builtInSet } from './built-in';

/*
 * The computed parts of a shape: `computed: true` on a part - its attributes (`attrs`) computed by the shape from its
 * model when the element is drawn (`attrsOf()`, by the selector of the part: the rotation of a needle of its `data`,
 * the bolts of a busbar of its `taps`), not stored in it. The view draws the element again when they change (see
 * `ShapeView`).
 * The attributes as the shapes write them: `calc()` of the size, a `text` (laid out by the built-in attribute), a `style`.
 */

/** A shape with computed parts */
export interface Computed {
    /** The attributes of the part (by its selector) for the model of the element and its size */
    attrsOf(selector: string, bbox: g.Rect): Record<string, unknown>;
}

// The built-in text: its lines, its anchors
const textSet = builtInSet('text');

export const computedAttributes = {
    computed: {
        set(this: dia.ElementView, _drawn: boolean, refBBox: g.Rect, node: Element, attrs: Record<string, unknown>) {
            const model = this.model as dia.Element & Partial<Computed>;
            const selector = node.getAttribute('joint-selector');
            if (!selector || typeof model.attrsOf !== 'function') return {};
            const computed: Record<string, unknown> = {};
            Object.entries(model.attrsOf(selector, refBBox)).forEach(([name, value]) => {
                if (name === 'text') {
                    textSet.call(this, value, refBBox, node, attrs, this);
                } else if (name === 'style') {
                    Object.assign((node as HTMLElement).style, value);
                } else {
                    computed[util.toKebabCase(name)] = typeof value === 'string' && util.isCalcExpression(value)
                        ? util.evalCalcExpression(value, refBBox)
                        : value;
                }
            });
            return computed;
        }
    }
};
