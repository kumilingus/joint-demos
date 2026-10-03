import type { dia } from '@joint/plus';
import { RUNTIME } from './controls';
import { findByTag } from './tags';
import { readProperty, type TagValue, writeProperty } from './tag-values';

/*
 * The interface of the diagram to the plant (in the runtime mode): any system - a SCADA server, a PLC gateway, an MQTT
 * or OPC UA client, the mock in `simulation/` - changes the diagram by calling `update()` with the tag of an element,
 * the name of a property and its value; it is told the commands of the operator (a pump turned on, a valve opened) by
 * `subscribe()`. The diagram binds the properties to its elements (see `tag-values.ts`).
 *
 *     plant.update('FM-101', 'value', 18.6);
 *     plant.update('HV-101', 'open', false);
 *     const unsubscribe = plant.subscribe(({ direction, tag, property, value }) => {
 *         if (direction === 'out') server.send({ tag, property, value });
 *     });
 *
 * (In the browser console: `window.plant`.)
 */

/** From the plant (an update) or to it (a command of the operator) */
export type MessageDirection = 'in' | 'out';

/** A message between the diagram and the plant: a new value of a property of an element (by its tag) */
export interface PlantMessage {
    direction: MessageDirection;
    tag: string;
    property: string;
    value: TagValue;
    time: Date;
}

export type PlantListener = (message: PlantMessage) => void;

export class Plant {

    protected graph: dia.Graph | null = null;
    protected listeners = new Set<PlantListener>();

    /** Connect the diagram of the graph (the runtime mode): updated by the plant from now on */
    connect(graph: dia.Graph): void {
        this.graph = graph;
    }

    /** The diagram is not updated any more (the edit mode) */
    disconnect(): void {
        this.graph = null;
    }

    get connected(): boolean {
        return this.graph !== null;
    }

    /**
     * A new value of the property of the element of the tag, from the plant: shown on the diagram, told to the
     * listeners. `false` if it is not shown (not connected, no element of the tag, no such property of it).
     */
    update(tag: string, property: string, value: TagValue): boolean {
        const element = this.graph && findByTag(this.graph, tag);
        if (!element || !writeProperty(element, property, value, RUNTIME)) return false;
        this.notify({ direction: 'in', tag, property, value, time: new Date() });
        return true;
    }

    /** A command of the operator (see `controls.ts`): shown on the diagram, sent to the plant (the listeners) */
    send(tag: string, property: string, value: TagValue): boolean {
        const element = this.graph && findByTag(this.graph, tag);
        if (!element || !writeProperty(element, property, value, RUNTIME)) return false;
        this.notify({ direction: 'out', tag, property, value, time: new Date() });
        return true;
    }

    /** The value of the property of the element of the tag, as the diagram shows it now */
    get(tag: string, property: string): TagValue | undefined {
        const element = this.graph && findByTag(this.graph, tag);
        return element ? readProperty(element, property) : undefined;
    }

    /** Listen to the messages (the updates and the commands): returns the function that stops it */
    subscribe(listener: PlantListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    protected notify(message: PlantMessage): void {
        this.listeners.forEach(listener => listener(message));
    }
}

/** The interface of the app (one diagram) */
export const plant = new Plant();

declare global {
    interface Window {
        plant: Plant;
    }
}
window.plant = plant;
