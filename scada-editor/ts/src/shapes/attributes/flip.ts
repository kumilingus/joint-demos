import { type dia, g, layout, util } from '@joint/plus';

/*
 * A shape flipped (its `flip`, a model attribute: `x` horizontally, `y` vertically, `xy` both; none - as it is): the
 * parts that show which way it faces mirrored across the middle of the element - marked with the `flip` attribute in
 * the defaults of a shape that can be flipped (`directional`, a group selector of its markup, see `Shape.flippable`):
 * the inlet of a cyclone, the drive of a mill. The rest of it (symmetric) stays as it is, its lighting too; its label
 * stays, its pipe stubs mirror with it (see `flippedPorts()`). Not a rotation: what is on top stays on top (the arrow
 * of a check valve).
 */

/** The ways a shape can be flipped */
export type Flip = 'x' | 'y' | 'xy';

/** The flip of the element (its model attribute): `x`, `y`, `xy`, or `''` - not flipped */
export function flipOf(model: dia.Cell): string {
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

/** Whether the flip mirrors horizontally, vertically */
const flipsX = (flip: string) => flip.includes('x');
const flipsY = (flip: string) => flip.includes('y');

/** The angle of a port mirrored by the flip (a stub pointing to the right: to the left when flipped horizontally) */
function flippedAngle(angle: number, flip: string): number {
    let flipped = angle;
    if (flipsX(flip)) flipped = 180 - flipped;
    if (flipsY(flip)) flipped = -flipped;
    return ((flipped % 360) + 360) % 360;
}

/**
 * The layout of the ports of a shape that can be flipped (`flippable` in the namespace of the shapes, see `Shape`):
 * as `absolute`, then mirrored by the flip of the group (its `flip` argument) across the middle of the element.
 */
export function flippablePortLayout(
    ports: Array<{ x?: number | string; y?: number | string; angle?: number }>,
    elBBox: dia.BBox,
    opt: { flip?: string }
): Array<{ x: number; y: number; angle: number }> {
    const flip = opt.flip ?? '';
    const { x, y, width, height } = elBBox;
    return (layout.Port.absolute(ports as layout.Port.Position[], new g.Rect(elBBox), {}) as Array<{ x: number; y: number; angle: number }>)
        .map(position => ({
            x: flipsX(flip) ? 2 * x + width - position.x : position.x,
            y: flipsY(flip) ? 2 * y + height - position.y : position.y,
            angle: flippedAngle(position.angle ?? 0, flip)
        }));
}

/**
 * The ports of a shape (of its defaults) flipped: its groups laid out by `flippablePortLayout()` with the flip, a pipe
 * stub drawn upside down on the left only (see `sideStub()` in `ports.ts`: shaded as one on the right) - after the flip.
 */
export function flippedPorts(ports: dia.Element.Attributes['ports'], flip: string): dia.Element.Attributes['ports'] {
    if (!ports) return ports;
    const flipped = util.cloneDeep(ports);
    Object.values(flipped.groups ?? {}).forEach((group) => {
        const position = group.position as { name?: string } | undefined;
        if (position?.name === 'absolute') group.position = { name: 'flippable', args: { flip }};
    });
    (flipped.items ?? []).forEach((item) => {
        const angle = Number((item.args as { angle?: number } | undefined)?.angle ?? (item.position as { args?: { angle?: number }} | undefined)?.args?.angle ?? 0);
        const isStub = Boolean(flipped.groups?.[item.group ?? '']?.attrs?.pipeBody);
        if (!isStub) return;
        const { pipeBody: _pipeBody, ...attrs } = item.attrs ?? {};
        item.attrs = flippedAngle(angle, flip) === 180 ? { ...attrs, pipeBody: { transform: 'scale(1, -1)' }} : attrs;
    });
    return flipped;
}
