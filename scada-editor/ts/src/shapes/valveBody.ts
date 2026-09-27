/** The bow tie of a valve symbol, filling the element. */
export const bowTieAttributes = {
    d: 'M 0 0 L calc(w) calc(h) V 0 L 0 calc(h) Z',
    fill: 'var(--shape-face)',
    stroke: 'var(--shape-valve-stroke)',
    strokeWidth: 2,
    strokeLinejoin: 'round'
};

/** A lever on top of a quarter-turn valve (ball, butterfly). */
export const leverAttributes = {
    d: 'M calc(w / 2) calc(h / 2) V -14 H calc(w / 2 + 34)',
    fill: 'none',
    stroke: '#555',
    strokeWidth: 5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
};
