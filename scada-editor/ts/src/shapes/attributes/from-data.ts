import { dia, g, util } from '@joint/plus';

/*
 * The parts of a shape drawn from its data (see `data.ts`): `fromData: true` on a part - its attributes computed by
 * the shape (`dataAttributes()`, by the selector of the part) when the element is drawn, not stored in it (its JSON
 * holds the data only). The view draws the element again when its data change (see `ShapeView`).
 * The attributes as the shapes write them: `calc()` of the size, a `text` (laid out by the built-in attribute), a `style`.
 */

/** A shape drawing parts from its data */
export interface DataDrawn {
    /** The attributes of the part (by its selector) for the data of the element and its size */
    dataAttributes(selector: string, bbox: g.Rect): Record<string, unknown>;
}

// The built-in text: its lines, its anchors
const text = dia.Element.getAttributeDefinition('text')!;
const textSet = text.set as dia.Cell.SetCallback<dia.ElementView>;

export const fromDataAttributes = {
    'from-data': {
        set(this: dia.ElementView, _drawn: boolean, refBBox: g.Rect, node: Element, attrs: Record<string, unknown>) {
            const model = this.model as dia.Element & Partial<DataDrawn>;
            const selector = node.getAttribute('joint-selector');
            if (!selector || typeof model.dataAttributes !== 'function') return {};
            const computed: Record<string, unknown> = {};
            Object.entries(model.dataAttributes(selector, refBBox)).forEach(([name, value]) => {
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

/**
 * The attributes of the parts drawn from its data removed from the element (silently): stored by a diagram saved
 * before they were computed - they would compete with the computed ones (a `text` would win).
 */
export function withoutDrawnAttributes(cell: dia.Cell): void {
    const model = cell as dia.Element & Partial<DataDrawn>;
    if (!cell.isElement() || typeof model.dataAttributes !== 'function') return;
    const { width, height } = cell.size();
    const bbox = new g.Rect(0, 0, width, height);
    Object.keys(cell.attr() ?? {}).forEach((selector) => {
        if (!cell.attr([selector, 'fromData'])) return;
        Object.keys(model.dataAttributes!(selector, bbox)).forEach((name) => {
            if (cell.attr([selector, name]) !== undefined) cell.removeAttr([selector, name], { silent: true });
        });
    });
}
