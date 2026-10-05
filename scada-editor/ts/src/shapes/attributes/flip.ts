import type { dia } from '@joint/plus';

/*
 * A shape flipped (its `flip`, a model attribute: `x` horizontally, `y` vertically, `xy` both; none - as it is): the
 * parts that show which way it faces mirrored across the middle of the element - marked with the `flip` attribute in
 * the defaults of a shape that can be flipped (`directional`, a group selector of its markup, see `Shape.flippable`):
 * the inlet of a cyclone, the drive of a mill. The rest of it (symmetric) stays as it is, its lighting too; its label
 * stays, its pipe stubs mirror with it (see `flipStub()` in `ports.ts`). Not a rotation: what is on top stays on top (the arrow
 * of a check valve).
 */

/** The ways a shape can be flipped */
export type Flip = 'x' | 'y' | 'xy';

/** The flip of the element (its model attribute): `x`, `y`, `xy`, or `''` - not flipped */
export function flipOf(model: dia.Cell): Flip | '' {
    const flip = model.get('flip');
    return flip === 'x' || flip === 'y' || flip === 'xy' ? flip : '';
}

export const flipAttributes = {
    // `flip: true` on the parts to mirror: by the flip of the element (the view renders them again when it changes)
    flip: {
        set(this: dia.ElementView, _mirrored: boolean, refBBox: dia.BBox) {
            const flip = flipOf(this.model);
            const sx = flip.includes('x') ? -1 : 1;
            const sy = flip.includes('y') ? -1 : 1;
            // Scaled about the middle of the box: a mirrored axis shifted by the box
            const { x, y, width, height } = refBBox;
            const e = sx < 0 ? 2 * x + width : 0;
            const f = sy < 0 ? 2 * y + height : 0;
            return { transform: `matrix(${sx},0,0,${sy},${e},${f})` };
        },
        unset: 'transform'
    }
};
