import type { dia } from '@joint/plus';
import { type StyleKey, styleOf } from '../common/style';

/*
 * A part of a shape in a color of its style (see `style.ts`): `styleFill: 'accent'`, `styleStroke: 'color'` on the
 * part - its fill, its stroke the color of the cell if it has one, else the part's own (its `fill`, its `stroke` in
 * the defaults of the shape: the default of the color field, see `ColorField.part`).
 */

const styleColor = (property: 'fill' | 'stroke' | 'opacity' | 'fill-opacity') => ({
    set(this: dia.CellView, key: StyleKey) {
        const color = styleOf<string>(this.model, key);
        return color === undefined ? {} : { [property]: color };
    }
});

export const styleColorAttributes = {
    'style-fill': styleColor('fill'),
    'style-stroke': styleColor('stroke'),
    // `styleOpacity: 'opacity'`, `styleFillOpacity: 'opacity'`: its opacity (an image), of its fill (a shape of the background)
    'style-opacity': styleColor('opacity'),
    'style-fill-opacity': styleColor('fill-opacity')
};
