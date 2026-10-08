import { type dia, type g, util } from '@joint/plus';
import { builtInSet } from './built-in';
import type Shape from '../common/Shape';

/*
 * The computed parts of a shape: `computed: true` on a part - its attributes (`attrs`) computed by the shape from its
 * model when the element is drawn (`getComputedAttrs()`, by the selector of the part: the rotation of a needle of its `data`,
 * the bolts of a busbar of its `taps`), not stored in it. The view draws the element again when they change (see
 * `ShapeView`).
 * The attributes as the shapes write them: `calc()` of the size, a `text` (laid out by the built-in attribute), a `style`.
 */

// The built-in text: its lines, its anchors
const textSet = builtInSet('text');

export const computedAttributes = {
    computed: {
        // Of a shape only (see `Shape.attributes`)
        set(this: dia.ElementView<Shape>, _drawn: boolean, refBBox: g.Rect, node: Element, attrs: Record<string, unknown>) {
            const selector = node.getAttribute('joint-selector');
            if (!selector) return {};
            const computed: Record<string, unknown> = {};
            Object.entries(this.model.getComputedAttrs(selector, refBBox)).forEach(([name, value]) => {
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
