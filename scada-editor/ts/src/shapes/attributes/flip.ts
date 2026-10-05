import type { dia } from '@joint/plus';

/*
 * The `flip` attribute: the node mirrored across the middle of its reference box - horizontally (`x`), vertically (`y`)
 * or both (`xy`); none (empty) as it is. On the parts of a shape that show which way it faces (`directional`, a group
 * selector in the markup of a shape that can be flipped, see `Shape.flippable`): the inlet of a cyclone, the drive of a
 * mill - the rest of it (symmetric) stays as it is, its lighting too; its label, its pipe stubs stay. Each part is
 * mirrored across the middle of the element, so it lands on its other side. Not a rotation: what is on top stays on top
 * (the arrow of a check valve).
 */

/** The ways a shape can be flipped */
export type Flip = 'x' | 'y' | 'xy';

export const flipAttributes = {
    flip: {
        set(this: dia.ElementView, flip: Flip | '' | null, refBBox: dia.BBox) {
            const sx = flip === 'x' || flip === 'xy' ? -1 : 1;
            const sy = flip === 'y' || flip === 'xy' ? -1 : 1;
            // Scaled about the middle of the box: a mirrored axis shifted by the box
            const { x, y, width, height } = refBBox;
            const e = sx < 0 ? 2 * x + width : 0;
            const f = sy < 0 ? 2 * y + height : 0;
            return { transform: `matrix(${sx},0,0,${sy},${e},${f})` };
        },
        unset: 'transform'
    }
};
