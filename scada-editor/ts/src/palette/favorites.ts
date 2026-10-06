import type { dia } from '@joint/plus';
import { PREFERENCE } from '../history';

/*
 * The favorite shapes of the palette (by their keys, see `paletteKey()`): stored on the graph,
 * so that they are saved with the diagram (`graph.toJSON()`) and opened with it. A preference of the user,
 * not an edit of the diagram: not undone.
 */

/** The attribute of the graph with the favorite shapes */
export const FAVORITES_ATTRIBUTE = 'favorites';


export function getFavorites(graph: dia.Graph): Set<string> {
    const favorites = graph.get(FAVORITES_ATTRIBUTE);
    return new Set(Array.isArray(favorites) ? favorites.filter(key => typeof key === 'string') : []);
}

function setFavorites(graph: dia.Graph, favorites: Set<string>): void {
    graph.set(FAVORITES_ATTRIBUTE, [...favorites], PREFERENCE);
}

export function isFavorite(graph: dia.Graph, key: string): boolean {
    return getFavorites(graph).has(key);
}

/** Add the shape to the favorites, or remove it; `true` if it is a favorite now. */
export function toggleFavorite(graph: dia.Graph, key: string): boolean {
    const favorites = getFavorites(graph);
    const favorite = !favorites.has(key);
    if (favorite) {
        favorites.add(key);
    } else {
        favorites.delete(key);
    }
    setFavorites(graph, favorites);
    return favorite;
}

/** Forget a shape that doesn't exist anymore (a deleted image). */
export function removeFavorite(graph: dia.Graph, key: string): void {
    const favorites = getFavorites(graph);
    if (!favorites.delete(key)) return;
    setFavorites(graph, favorites);
}
