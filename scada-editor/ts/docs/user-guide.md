# SCADA Editor - User Guide

What it offers: [features](features.md). How it is built: [developer notes](dev-notes.md).

## Getting started

![The editor: the palette, the canvas, the inspector panel with the examples](images/editor-overview.png)

Palette on the left, canvas in the middle, inspector panel on the right. The toolbar: new, open, save, export image, undo / redo, zoom, Settings, Find, show / hide the palette and the inspector, full screen, light / dark, **Run**.

- **Examples** - with nothing selected, the inspector panel lists Boiler House, Microgrid and Cement Plant.
- **New diagram** - starts with a screen and opens the settings.
- **The screen** - the dashed frame (*Screen 1920 × 1080*) is what the operator sees in run mode.
- **Pan** by dragging the blank canvas, **zoom** with the toolbar or a pinch.
- **More room** - hide the palette or the inspector with their toolbar buttons, or both with `Cmd` + `\`; the diagram stays where it is.

![The Cement Plant example](images/cement-plant.png)

## The palette

![A shape clicked in the palette: its preview in the inspector panel](images/palette-preview.png)

- **Search** filters the shapes (*pump*, *valve*, *tank*).
- **Click** a shape to preview it: it runs, switching on and off. **Add to favorites** there.
- **Drag** a shape onto the canvas to add it.
- **Upload images** in the Custom group adds your own pictures; rename or delete one in its preview. On the canvas, its *Opacity* is in the inspector.
- **In Use** lists the shapes already in the diagram (can be turned off in Settings).

## Shapes

- **Select** - click; `Ctrl` / `Cmd` / `Shift` + click to add or remove; `Shift` + drag a region.
- **Select All / Elements / Connections** - right-click the blank canvas, or the [shortcuts](#keyboard-shortcuts).
- **Select Same Type** - right-click a shape: all shapes of the selected types (*Pump · 2*).
- **Select Below** - right-click where shapes overlap: the one underneath.
- **Lock** - right-click a shape or a group: it stays where it is and the pointer goes through it (an image in the background, a frame) - not selected by a click, a region or *Select All*, no link connects to it, not in the minimap. To unlock, right-click it: the canvas menu offers *Unlock* (its ID) and *Unlock All*.
- **Move** by dragging, or with the arrow keys (a grid step, five with `Shift`); **resize** and **rotate** a single shape with its handles. With *Move selected shapes only* (Settings) a drag moves a selected shape only - on any other it pans the canvas: click (tap) the shape first.
- **Flip** - shapes that face a way (pump, check valve, strainer, manifold, turbine, compressor, fan, blower, cyclone, kiln, crusher, mill, bucket elevator): right-click *Flip Horizontally* (`Shift` + `H`) or *Flip Vertically* (`Shift` + `V`) mirrors them instead of turning them upside down; connected pipes stay on their stubs. The strainer and the manifold flip vertically too (the leg up, the outlets up).
- **Name** - in the inspector; the label of the shape shows it (or its ID, or both - *Labels* in the [settings](#settings)), at its *Label position* (top, left, right, bottom).
- **Label shape** (a text on its own) - several lines (`Enter` in its text), its font size, style, weight and *Alignment* (left, center, right).
- **Control position** - the side of a valve's buttons or slider (Controls group).

![The context menu of a shape](images/context-menu.png)

## Connecting

- **Pipes** - drag one from Piping, then drag its ends onto the pipe stubs of the equipment.
- **Wires** - to the terminals of electrical shapes only.
- **Signal lines** and **arrows** - to a shape; an arrow can also point from a Label. Its ends and color are in the inspector.
- **Conveyors** - to the body of the equipment, where the end is dropped (a chute, an inlet).
- **Routing** - Straight, Orthogonal or Curved in the inspector; drag the handles to move ends and bends.
- **Size** of a pipe (Small, Medium, Large), **Thickness** of a wire (Thin, Normal, Thick) - in the inspector.
- **Split Here** / **Insert Join** - right-click a connection / a pipe.
- **Disconnect** - right-click a shape: its connections stay, their ends disconnected where they were; the shape moves off them.

## The inspector

![The inspector of a valve](images/inspector.png)

- **ID** - the tag the plant uses (*HV-101*): optional - the equipment gets one when it is dropped, a picture or a background shape only when you type one or press *Generate* (the next free one of its kind); a copy gets a new one. A Label shape and a zone have none.
- **Name**, **Unit**, ... - the texts.
- **Appearance** - Finish (Auto, Shaded, Flat), Color, Outline, Outline width, Accent (the slashed swatch is Auto), Label position, Layer. *Outline width* shows while the shape is outlined: an outline color of its own, or flat.
- **Values**, **Thresholds**, **Slices**, **Columns** - the data of the shape.
- **Controls** - *Use controls* and *Control position*.

`?` explains a field. With several shapes selected, a field that differs shows *mixed*.

## Groups

- **Group** - select shapes, right-click, *Group*. A group has a dashed frame and an ID badge.
- Click a member to select the group, click again to select the member; `Escape` goes one level up.
- **Ungroup** from the context menu. The group's inspector lists its members and styles them together.

## Layers

Background, Pipes, Equipment, Instruments, Foreground - pipes under the equipment, instruments over it.

- **Bring to Front / Send to Back** - within the layer.
- **Move to …** - offered when a shape is covered by a higher layer (or covers a lower one).
- **Layer** in the inspector sets it directly.

## Settings

![The settings](images/settings-style.png)

**Settings** in the toolbar.

**Screen**
- *Enabled* - shows or hides the screen frame. Without a screen, run mode and the exported image show the whole diagram.
- *Width*, *Height* - the screen size in pixels. While the settings are open, drag the screen by its edge or its name to move it.

**Style** - the defaults for every shape that has no style of its own (Auto in its inspector).
- *Finish* - Shaded (gradients) or Flat.
- *Color*, *Outline*, *Accent* - the body, edge and detail colors.
- *Outline width* - Thin, Normal or Thick: the outlines of outlined shapes and the borders of the pipes.
- *Labels* - what the shape labels show (to see the IDs for a moment, hold `Alt`): the *Name*, the *ID* (as a P&ID), or *ID + name* (the ID in bold above the name, as an operator display). A shape without a name shows its ID alone, one without an ID its name; the Label shape and zones keep their text.
- *Label size* - Small to X-Large, for shape labels and zones (not for the Label shape).
- *Label color* - the text color of those labels.
- *Canvas* - the background color (White / Black, Blue, Green, Violet, Gray as in ISA-101, Sand; each with a light and a dark tone); the grid follows.
- *Canvas gradient* - the canvas lighter at the top, darker at the bottom (the exported image too).

**Run mode**
- *Animations* - Full: everything animates (running equipment, flames, levels). Alarms only: only the levels and the alarms move.

**Editor** - remembered in this browser (not saved with the diagram).
- *Snaplines* - guide lines that align a moved or resized shape with the others.
- *In Use group* - shows or hides the In Use group in the palette.
- *Move selected shapes only* - a drag on a shape that is not selected pans the canvas instead of moving it (a connection not attached to anything is then moved by its ends). On by default on a tablet or a phone.

## Find

**Find** in the toolbar, or `Cmd` + `F` - in both modes. The shapes with an ID or a name: their ID, name and kind (*P-101 · Feed Pump 1 · Pump*).

- **Filter** - words of the ID, the name or the kind; every word has to match, dashes don't count (*p101* finds *P-101*).
- **Click** a row - the shape is selected (edit mode) or marked by an arrow (run mode, while the list is open), scrolled into view.
- **Several** (edit mode) - `Cmd` + click adds or removes a row, `Shift` + click selects the rows from the one clicked before, `Cmd` + `Shift` + click adds them.
- **Keys** - `↑` / `↓` go through the rows (with `Shift`: a range), `Enter` picks the row and closes the list; a double click too. `Escape` closes it.
- A shape selected on the canvas closes it; it opens with an empty filter (a new search).

## Run mode

![Run mode with the log and the tags shown](images/run-mode-log.png)

**Run** starts the plant; **Edit** goes back (nothing of the run is kept). A screen fills the window; move the pointer to the top for the toolbar.

- **Controls** - a checkbox starts or stops a pump or a burner, *Open* / *Closed* switches a valve or a breaker, a slider sets a control valve. The request shows as **pending** until the plant confirms it (5 s at most).

  ![A valve switch pending](images/control-pending.png)

- **Log** - the messages between the diagram and the plant: time, *update* or *command*, tag, property, value.
  - *Ping the changes* - an element pings when its message arrives (blue update, amber command).
  - Filter by words (dashes ignored: `p101` finds `P-101`), by All / Updates / Commands, or by clicking elements on the diagram. While it is filtered, the rest of the diagram is grayed (faded in Safari): the elements of the messages shown and the elements whose IDs start with the words (with their controls) stay as they are.
  - Click a message to mark its element - a violet arrow pointing at it (and mark its messages); click it again to clear.
  - `L` opens it, `Escape` closes it.

## Files

- **Save** - downloads `scada-diagram.json` (with images, favorites, style).
- **Open** - loads a saved file.
- **Export image** - downloads `scada-diagram.webp`: the screen, or the whole diagram without one.

Replacing a diagram with changes (new, open, an example) asks first.

## Keyboard shortcuts

Edit mode, not while typing. `Cmd` on macOS, `Ctrl` elsewhere.

| Action | Shortcut |
|---|---|
| Undo / redo | `Cmd` + `Z` / `Cmd` + `Y` or `Cmd` + `Shift` + `Z` |
| Copy / cut / paste | `Cmd` + `C` / `X` / `V` |
| Select all | `Cmd` + `A` |
| Select elements only | `Cmd` + `Shift` + `A` |
| Group / ungroup | `Cmd` + `G` / `Cmd` + `Shift` + `G` |
| Flip horizontally / vertically | `Shift` + `H` / `Shift` + `V` |
| Move the selection (a grid step / five) | Arrow keys / `Shift` + arrow keys |
| Hide / show the palette and the inspector | `Cmd` + `\` |
| Find (in both modes) | `Cmd` + `F` |
| The plant messages (the log, in run mode) | `L` |
| See the IDs on the diagram (in both modes) | hold `Alt` (`Option`) |
| Duplicate (drag a copy) | `Cmd` + drag a shape, or a connection (the copy detached from what it connected) |
| Delete | `Delete`, `Backspace` |
| Close a menu or Find, one group level up, clear the selection | `Escape` |
