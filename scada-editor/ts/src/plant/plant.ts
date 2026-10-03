import { type dia, mvc } from '@joint/plus';
import { RUNTIME } from '../runtime/controls';
import { findByTag } from './tags';
import { readProperty, type TagValue, writeProperty } from './properties';

/*
 * The interface of the diagram to the plant (in the runtime mode): any system - a SCADA server, a PLC gateway, an MQTT
 * or OPC UA client, the mock in `simulation/` - changes the diagram by calling `update()` with the tag of an element,
 * the name of a property and its value; it is told the commands of the operator (a pump turned on, a valve opened) by
 * the `command` event. The diagram binds the properties to its elements (see `properties.ts`). Events (`mvc.Events`):
 * `update` - an update applied to the diagram, `command` - a command of the operator; both with the message.
 *
 *     plant.update('FM-101', 'value', 18.6);
 *     plant.update('HV-101', 'open', false);
 *     plant.on('command', ({ tag, property, value }) => server.send({ tag, property, value }));
 *
 * The plant of the app: `app.plant`, created for each run (the runtime mode; `null` while editing) - in the browser
 * console: `window.plant`, see `main.ts`.
 */

/** The events of the plant: an update from it (applied to the diagram), a command of the operator to it */
export type PlantEvent = 'update' | 'command';

/** A message between the diagram and the plant: a new value of a property of an element (by its tag) */
export interface PlantMessage {
    tag: string;
    property: string;
    value: TagValue;
    time: Date;
}

export class Plant {

    protected graph: dia.Graph;

    // Of `mvc.Events` (assigned to the prototype below): the `update` and `command` events
    declare on: mvc.Events_On<Plant>;
    declare off: mvc.Events_Off<Plant>;
    declare trigger: mvc.Events_Trigger<Plant>;

    constructor(graph: dia.Graph) {
        this.graph = graph;
    }

    /**
     * A new value of the property of the element of the tag, from the plant: shown on the diagram (the `update`
     * event). `false` if it is not shown (no element of the tag, no such property of it).
     */
    update(tag: string, property: string, value: TagValue): boolean {
        const element = findByTag(this.graph, tag);
        if (!element || !writeProperty(element, property, value, RUNTIME)) return false;
        this.trigger('update', { tag, property, value, time: new Date() });
        return true;
    }

    /**
     * A command of the operator (the element changed by its control already, see `ControlsController`): sent to the
     * plant (the `command` event)
     */
    send(tag: string, property: string, value: TagValue): void {
        this.trigger('command', { tag, property, value, time: new Date() });
    }

    /** The value of the property of the element of the tag, as the diagram shows it now */
    get(tag: string, property: string): TagValue | undefined {
        const element = findByTag(this.graph, tag);
        return element ? readProperty(element, property) : undefined;
    }
}

// The events of the plant (see `mvc.Events`)
Object.assign(Plant.prototype, mvc.Events);
