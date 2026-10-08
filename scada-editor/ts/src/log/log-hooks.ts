import type { App } from '../app';
import type { LogHooks } from './LogView';
import type { PlantEvent, PlantMessage } from '../plant/plant';
import { setMarker } from '../canvas/marker';
import { ping, removePings } from '../canvas/ping';
import { dimCellsExceptTags, undimCells } from '../canvas/dim';
import { getTag } from '../shapes/common/tag';
import { normalizeSearch } from '../list/FilterListView';

/*
 * What the log shows on the diagram (its hooks, see `LogController`): the cell of the message clicked marked, the
 * elements of the messages pinged (the tags: hold Alt, see `canvas/tag-badges.ts`), the elements the filter finds by their
 * tags brought forward - the others dimmed (see `canvas/dim.ts`).
 */

const PING_ID = 'log-ping';

// The pings of the messages: an update in the color of the selection, a command in amber (as in the log)
const PING_COLORS: Record<PlantEvent, string> = {
    update: 'var(--selection)',
    command: 'var(--color-amber)'
};

/** What the log shows on the paper of the app */
export function logHooks(app: App): LogHooks {
    const { graph, paper, tags } = app;
    let stopPinging: (() => void) | null = null;
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
            if (!filter) {
                undimCells();
                return;
            }
            const { words, tags: shown } = filter;
            const found = graph.getCells().map(getTag).filter((tag): tag is string => {
                return tag !== undefined && words.some(word => normalizeSearch(tag).startsWith(word));
            });
            dimCellsExceptTags(app, [...new Set([...shown, ...found])]);
        }
    };
}
