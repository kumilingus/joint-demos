import { type dia, highlighters } from '@joint/plus';
import type { App } from '../app';
import type { LogHooks } from './LogView';
import type { PlantEvent, PlantMessage } from '../plant/plant';
import { setMarker } from '../canvas/marker';
import { ping, removePings } from '../canvas/ping';
import { dimCells } from '../canvas/dim';
import { getTag } from '../shapes/common/tag';
import { normalizeSearch } from '../list/FilterListView';

/*
 * What the log shows on the diagram (its hooks, see `LogController`): the cell of the message clicked marked, the
 * elements of the messages pinged (the tags: hold Alt, see `canvas/tag-badges.ts`), the elements the filter finds by their
 * tags brought forward - the others dimmed (see `canvas/dim.ts`); while it is open, the cells a click filters it by (with
 * an ID) marked (their cursor, see `canvas.css`).
 */

const PING_ID = 'log-ping';

// The cells a click filters the log by: their class (a highlighter)
const CLICKABLE_ID = 'log-clickable';
const CLICKABLE_CLASS = 'scada-log-clickable';

// The pings of the messages: an update in the color of the selection, a command in amber (as in the log)
const PING_COLORS: Record<PlantEvent, string> = {
    update: 'var(--selection)',
    command: 'var(--color-amber)'
};

/** What the log shows on the paper of the app */
export function logHooks(app: App): LogHooks {
    const { graph, paper, tags } = app;
    let stopPinging: (() => void) | null = null;
    // What is dimmed: the cells the filter leaves out (none kept: not filtered, or nothing found - nothing dimmed by it),
    // the cells without an ID if asked (see `markClickable`)
    let kept = new Set<dia.Cell>();
    let grayUntagged = false;
    const updateDimmed = () => {
        dimCells(paper, new Set(graph.getCells().filter((cell) => {
            return (kept.size > 0 && !kept.has(cell)) || (grayUntagged && !getTag(cell));
        })));
    };
    return {
        // The cell of the tag marked (an arrow above it, see `marker.ts`), none
        highlight: (tag) => {
            setMarker(paper, (tag && tags.get(tag)) || null);
        },
        pingChanges: (pinged) => {
            stopPinging?.();
            stopPinging = null;
            // A listener of the plant too: the element of a message pinged
            const { plant } = app;
            if (!pinged || !plant) {
                return;
            }
            const onMessage = (kind: PlantEvent) => ({ tag }: PlantMessage) => {
                const cell = tags.get(tag);
                if (cell?.isElement()) {
                    ping(paper, cell, PING_COLORS[kind], PING_ID);
                }
            };
            const onUpdate = onMessage('update');
            const onCommand = onMessage('command');
            plant.on('update', onUpdate);
            plant.on('command', onCommand);
            stopPinging = () => {
                plant.off('update', onUpdate);
                plant.off('command', onCommand);
                removePings(paper, PING_ID);
            };
        },
        // The tags of the messages shown, and the tags starting with a word of the filter (`p101`: P-101, not GRP-101;
        // as the log normalizes them, see `normalizeSearch()`: a cell clicked before its first message); not filtered -
        // nothing dimmed
        filterChange: (filter) => {
            kept = new Set();
            if (filter) {
                const { words, tags: shown } = filter;
                shown.forEach((tag) => {
                    const cell = tags.get(tag);
                    if (cell) {
                        kept.add(cell);
                    }
                });
                graph.getCells().forEach((cell) => {
                    const tag = getTag(cell);
                    if (tag && words.some(word => normalizeSearch(tag).startsWith(word))) {
                        kept.add(cell);
                    }
                });
            }
            updateDimmed();
        },
        // The cells with an ID: a click filters the log by them - the others grayed if asked (an option of the log)
        markClickable: (marked, grayOthers) => {
            highlighters.addClass.removeAll(paper, CLICKABLE_ID);
            grayUntagged = marked && grayOthers;
            updateDimmed();
            if (!marked) {
                return;
            }
            graph.getCells().filter(cell => getTag(cell)).forEach((cell) => {
                const view = cell.findView(paper);
                if (view) {
                    highlighters.addClass.add(view, 'root', CLICKABLE_ID, { className: CLICKABLE_CLASS });
                }
            });
        }
    };
}
