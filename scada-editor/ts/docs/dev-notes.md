# SCADA Editor - Developer Notes

For programmers extending the demo or connecting a plant. Usage: [user guide](user-guide.md). Summary: [features](features.md).

## Architecture

`App` (`src/app.ts`) owns the graph, the paper, the scroller, the navigator, the toolbar, the stencil, the keyboard, the tooltips, the history and the plant of a run. Two modes (`Mode` in `const.ts`):

- **Edit** - palette, inspector, history, file buttons.
- **Runtime** - none of those; the controls can be operated, a screen fills the window. Entering snapshots the cells (`toJSON({ ignoreDefaults: false })`) and stops the history; leaving syncs them back (`graph.syncCells(..., { remove: true })`).

### Controllers

A controller (`controllers/Controller.ts`) is an `mvc.Listener` with the app as its first callback argument: handlers are plain functions `(app, ...eventArgs)`. `App.controllers` listen all the time; `App.modeControllers` start and stop with their mode. A controller decides *when*, an action in `actions/` *what*.

| Controller | Mode | Listens to |
|---|---|---|
| `CanvasController` | always | paper: blank drag (pan), pinch, pan |
| `ControlsController` | always | graph: controls of added elements; the `command` event of an element → `app.plant` |
| `SelectionController` | always | selection: free transform, link tools, inspector |
| `TagsController` | always | graph: a free tag for every element |
| `PipeColorController` | always | graph: pipe colors; a control valve shows its pipe's |
| `GroupController` | always | graph: a member changed → its groups refit |
| `ToolbarController` | each mode | toolbar buttons |
| `EditController` | edit | paper: cell click, region, context menus |
| `PaletteController` | edit | palette: click, drop; graph: the derived groups |
| `KeyboardController` | edit | shortcuts |
| `RuntimeController` | runtime | paper: a cell drag pans |
| `MockPlantController` | runtime | the mock plant (`plant/mock/`) |
| `LogController` | runtime | Log button; plant messages; element clicks filter the log |
| `AnimationsController` | runtime | graph: `power`, `open`, `level`, `value` |
| `ElectricalController` | runtime | graph: `energized` |

### History

Everything edited is recorded (image upload, rename, delete included). Not recorded (`historyOptions` in `config.ts`) - changes with:

- `RUNTIME` (`runtime/controls.ts`) - by the plant during a run,
- `DERIVED` (`shapes/common/routing.ts`) - derived from another change (a router, table rows taken by a resize),
- `PREFERENCE` (`palette/favorites.ts`) - favorites.

Opening a diagram clears the history.

## Project structure

```
src/
  main.ts, app.ts, config.ts, const.ts   entry, App, options, constants
  diagram-style.ts    the style of a diagram
  examples.ts         the examples list
  styles.css          imports: JointJS+ and theme layers, tokens, then the area CSS (layout.css, */*.css)
  tokens.css, icons/  app tokens and icons (over the theme's)
  actions/            selection, history, clipboard, order, groups, pipes, file, palette, view
  canvas/             selection frames, snaplines, link tools, connections, layers, navigator, screen, context menu, tint
  palette/            stencil, packing, preview, descriptions, images, favorites
  inspector/          inspector, selection inspector, color field, help, settings
  runtime/            controls, animations
  plant/              plant.ts (the interface), properties.ts, tags.ts; mock/ - the simulated plant
  log/                the log of plant messages
  controllers/
  shapes/             models/<palette group>/, views/, common/ (Shape, ports, footprint, routing, gradients, charts),
                      attributes/ (label, text styles), shapes.css (shape colors), index.ts (the namespace)
  theme/              the reusable `minimal` theme (see theme/README.md)
  diagrams/           the examples (saved JSON)
```

## Conventions

- **Comments** say what or why, in short phrases; every export and non-obvious constant has one.
- **File names** - a class default export: PascalCase (`Shape.ts`); otherwise kebab-case (`mock-plant.ts`). Attribute keys camelCase.
- **Change options** - `RUNTIME`, `DERIVED`, `PREFERENCE` (see [History](#history)). An operator command is not a change but an event (see [Connecting a plant](#connecting-a-plant)).
- **Model geometry** - routes, positions and sizes come from the models (`getFootprint()`, the getters), never from the rendered DOM.
- **Embedding** - listen to `change:parent`, not the deprecated `change:embeds`.
- **Example JSON** - when edited by a script, set only what the inspector can set (fields, positions, sizes, link ends, vertices).

## Shapes

Every element extends `Shape` (`shapes/common/Shape.ts`) and overrides the getters that differ:

| Getter | Default | Example |
|---|---|---|
| `resizable` | `true` (min half the default size) | `false`, `{ preserveAspectRatio: true }`, `{ minWidth, minHeight, directions }` |
| `rotatable` | `true` | `false` (a display) |
| `control` | `null` | `'power'` (checkbox), `'toggle'` (open / closed), `'slider'` |
| `graphLayer` | `Layer.Equipment` | `Layer.Instruments` |
| `anchors` | `'sides'` | `'middles'` (a join) |
| `stubLength` | `null` | `20`: pipe stub length |
| `tagPrefix` | the type's initials | `'NRV'` |
| `overflow` | `{}` (a label below) | `{ top: 42 }`: drawing outside the bounding box |
| `colorField` / `outlineField` | surface `color` / `outline` | `{ path: ['attrs', 'body', 'fill'] }` |
| `accentField` | `null` | a boiler's flames |

A shape showing a value by a part (level panel, battery bank, fuel tank, thermometer) defines `glideProperty` and `glideKeyframes(value)`; `Animations.animateLevel()` glides the parts to a new value.

Special attributes:

- `labelPosition` (`shapes/attributes/label.ts`) - `top`, `left`, `right`, `bottom`; laid out clear of the drawing, horizontal on a rotated shape. Labels spread `labelAttributes` (class `jj-label`: the diagram's label size and color).
- `textStyles` (`shapes/attributes/text-styles.ts`) - italic, underline, strike (Label, Zone).
- `surfaceFill`, `surfaceStroke`, `materialFill` (`shapes/common/gradients.ts`) - metal shading with the element's color mixed in.
- `pipePorts()`, `terminalPorts()`, `pipeThroughAttributes()` (`shapes/common/ports.ts`).

### Adding a shape

1. A class in `shapes/models/<group>/` (`markup`, `defaults()` with `labelAttributes`, getters); register it in `shapes/index.ts`.
2. An instance in `createShapes()` (`palette/stencil.ts`).
3. Its title and description in `palette/descriptions.ts`.
4. Plant properties in `plant/properties.ts`; a generator in `plant/mock/mock-plant.ts`.
5. A `control` getter if the operator can switch it.
6. An animator in `runtime/animations.ts` (kind `equipment`, `flow`, `alarm` or `level`).

## Connecting a plant

`app.plant` (`plant/plant.ts`) is the only way the plant changes the diagram: a tag, a property, a plain value. A new one is created for each run (`null` while editing).

```ts
app.plant.update('FM-101', 'value', 18.6);    // a reading
app.plant.update('HV-101', 'open', false);    // a state
app.plant.get('LI-101', 'level');             // what the diagram shows
app.plant.on('command', ({ tag, property, value }) => { /* ... */ });   // an operator command
app.plant.on('update', ({ tag, property, value }) => { /* ... */ });    // an update applied
```

Commands: a control triggers `command` on its element, `ControlsController` passes it to `plant.send()`, and the element changes only when the plant answers with an update (the mock after 0.3-0.8 s). Until then the control shows it pending (5 s at most). Properties per element type are in `plant/properties.ts` (`power`, `open`, `level`, `value`).

In the console during a run: `plant.update('LI-101', 'level', 90)` (`window.plant`).

To connect a real plant, replace the mock with a controller of your own. It extends `Controller` because `App` starts and stops controllers with the mode, and the plant exists only during a run:

```ts
export default class PlantSocketController extends Controller {
    socket: WebSocket | null = null;

    startListening(): void {
        const plant = this.context.plant!;
        const socket = this.socket = new WebSocket('wss://scada.example.com/plant');
        socket.onmessage = ({ data }) => {
            const { tag, property, value } = JSON.parse(data);
            plant.update(tag, property, value);
        };
        // A handler registered by `listenTo()` gets the app first (see `Controller`)
        this.listenTo(plant, 'command', (_app: App, { tag, property, value }: PlantMessage) => {
            socket.send(JSON.stringify({ tag, property, value }));
        });
    }

    stopListening(): void {
        super.stopListening();
        this.socket?.close();
    }
}
```

```ts
// app.ts
[Mode.Runtime]: [
    new ToolbarController(this),
    new RuntimeController(this),
    new PlantSocketController(this),    // was: new MockPlantController(this)
    new LogController(this),
    new AnimationsController(this),
    new ElectricalController(this)
]
```

Then delete `plant/mock/`. The mock also derives the energized circuits (`plant/mock/energized.ts`), the table readouts and the chart values; without it, your system has to send them.

## Log, tint, theme, style, animations

- **Log** (`log/log.ts`, `LogController`) - listens to the plant's `update` and `command`, keeps the last 200 messages of a run, in a `ui.Dialog`. Tags are badge highlighters, pings are ring highlighters behind the element, the element of the clicked message is tinted (`canvas/tint.ts`: a filter - gray multiplied by a theme color - on the children of the view but the ping).
- **Theme** (`theme/theme-minimal.css`, `setTheme('minimal')`) - styles the JointJS+ components, every rule scoped to `.joint-theme-minimal`, using only `theme/tokens.css` (shadcn/ui variable names). Cascade layers: `joint` → `theme` → the app (unlayered), so the app always wins. Reuse: `theme/README.md`.
- **Shape colors** - CSS variables (`--shape-*` in `shapes/shapes.css`); the dark scheme redefines them.
- **Diagram style** (`diagram-style.ts`, saved as `graph.get('style')`) - `finish`, `color`, `outline`, `accent` for shapes without their own; `labelSize` (`small` 12, `medium` 14, `large` 16, `x-large` 18 px), `labelColor` (theme colors only). Applied as CSS variables, so the palette and the preview follow.
- **Animations** (`runtime/animations.ts`, Web Animations API, never the model) - kinds `equipment`, `flow`, `alarm`, `level`. Level `full`, or `alarms` (alarms and levels only; also with reduced motion). The palette preview runs them and switches the shape every 2.5 s.

## Where things are

| Feature | Code |
|---|---|
| Palette packing (skyline, no labels) | `palette/packing.ts` |
| Uploaded images (one `<symbol>` per paper) | `palette/images.ts` |
| Where a link end connects | `connectionStrategy` in `canvas/connections.ts` |
| Routing straight / orthogonal / curved | `shapes/common/routing.ts` |
| Conveyor (a link drawn as a belt) | `shapes/models/bulk/Conveyor.ts` |
| Charts (paths from model data) | `shapes/common/charts.ts` |
| Table (own view, per-cell updates) | `shapes/models/charts/Table.ts`, `shapes/views/TableView.ts` |
| Groups | `shapes/models/diagram/Group.ts`, `GroupController`, `canvas/Snaplines.ts` (drag fix) |
| Multi-selection inspector ("mixed") | `inspector/selection-inspector.ts` |
| Save / open / export (WebP) | `actions/file.ts`; ports are not saved (`Shape.toJSON()`) |
| Screen | `shapes/models/diagram/Screen.ts`, `canvas/screen.ts` |
| Controls (front layer, upright, inert while editing) | `runtime/controls.ts` |

## Gotchas

- **Controls are in the paper's front layer**, not in the element views; the paper's `guard` (`app.ts`) ignores their events, or a slider press would be a blank-canvas press.
- **Import cycles** - `shapes/common/footprint.ts` imports `Shape` as a type only.
- **Stencil** - `fitPaperToContent()` is overridden (not in the typings); the `cellCursor` option breaks link hit-testing, fixed in the theme.
- **Context menus** (`ui.ContextToolbar`) - one open at a time, no submenus; kept inside the window by `keepInWindow()` (`canvas/context-menu.ts`).
- **Workarounds of missing APIs** - the drag handed over to the copy of a duplicating drag (`canvas/drag.ts`, `ElementView`'s internal event data) and `preventSelectionInteraction()` (`canvas/selection.ts`, `ui.Selection`'s internals): to be replaced when JointJS / JointJS+ expose them.
- **The mock is random** beyond a few couplings (feedwater follows the feed pumps, charts follow the flow, the beacon follows the pressure).
