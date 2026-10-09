import { type dia, mvc } from '@joint/plus';
import { getTag } from '../shapes/common/tag';

// The first number of a prefix: `P-101`
const FIRST_NUMBER = 101;

/**
 * The cells of the diagram by their tags (see `tags.ts`): kept up to date with the graph - created before anything
 * else listens to it (see `App`), so it is up to date for every other listener. A tag taken by another cell is not
 * indexed for the new one (it gets another one, see `TagsController`): the first cell keeps it.
 */
export default class TagIndex extends mvc.Listener<[]> {

    protected cells = new Map<string, dia.Cell>();

    constructor(graph: dia.Graph) {
        super();
        this.listenTo(graph, {
            'add': (cell: dia.Cell) => this.add(cell),
            'remove': (cell: dia.Cell) => this.remove(cell, getTag(cell)),
            'change:tag': (cell: dia.Cell) => {
                this.remove(cell, cell.previous('tag'));
                this.add(cell);
            },
            'reset': () => {
                this.cells.clear();
                graph.getCells().forEach(cell => this.add(cell));
            }
        });
        graph.getCells().forEach(cell => this.add(cell));
    }

    /** The cell of the tag */
    get(tag: string): dia.Cell | undefined {
        return this.cells.get(tag);
    }

    /** Whether a cell other than the given one has the tag */
    isTaken(tag: string, cell?: dia.Cell): boolean {
        const owner = this.cells.get(tag);
        return owner !== undefined && owner !== cell;
    }

    /** The next free tag with the prefix: `P-103` after `P-101` and `P-102` */
    next(prefix: string): string {
        // The prefix as it is (any characters of an ID typed), the number after it
        const start = `${prefix}-`;
        const numbers = [...this.cells.keys()]
            .filter(tag => tag.startsWith(start) && /^\d+$/.test(tag.slice(start.length)))
            .map(tag => Number(tag.slice(start.length)));
        return `${prefix}-${numbers.length > 0 ? Math.max(...numbers) + 1 : FIRST_NUMBER}`;
    }

    protected add(cell: dia.Cell): void {
        const tag = getTag(cell);
        if (tag && !this.cells.has(tag)) {
            this.cells.set(tag, cell);
        }
    }

    protected remove(cell: dia.Cell, tag: string | undefined): void {
        if (tag && this.cells.get(tag) === cell) {
            this.cells.delete(tag);
        }
    }
}
