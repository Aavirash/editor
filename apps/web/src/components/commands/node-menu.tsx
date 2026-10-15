/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The menu a right-click on nodes puts up, the way Figma's does: the click
// selects what it lands on first (unless that is selected already, so a
// selection of several survives it), and the menu lists what the palette
// offers for that selection. Every surface that shows nodes wraps itself in
// one, and says which nodes are under the pointer.

import { createSignal, For, Show, splitProps } from "solid-js";
import { useWorld } from "@diffusionstudio/koota-solid";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCommands } from "@/context/commands";
import { getDocumentEditor, useSelection } from "@/engine";

import type { Entity } from "koota";
import type { JSX } from "solid-js";
import type { RegisteredCommand } from "@/context/commands";

/**
 * What a menu lists, by command id, a rule between sections: over a
 * selection, and over nothing. A command that has nothing in the selection to
 * work on is left out, and a section left with none goes with it.
 */
export type NodeMenuLayout = {
  nodes: string[][];
  empty: string[][];
};

const CLIPBOARD = ["shortcut:copy", "shortcut:cut", "shortcut:paste", "shortcut:duplicate", "shortcut:delete"];
const STRUCTURE = [
  "shortcut:group",
  "shortcut:ungroup",
  "shortcut:wrap-in-scene",
  "shortcut:wrap-in-sequence",
  "shortcut:unwrap-sequence",
];
const MEDIA = ["upscale", "remove-background", "remove-silence", "auto-captions"];
const GENERATE = ["edit-with-prompt", "make-video", "rerun", "reuse-settings"];

export const CANVAS_MENU: NodeMenuLayout = {
  nodes: [
    CLIPBOARD,
    STRUCTURE,
    ["shortcut:bring-to-front", "shortcut:send-to-back", "shortcut:toggle-hidden"],
    MEDIA,
    GENERATE,
  ],
  empty: [["shortcut:paste", "shortcut:select-all"], ["toggle-ui", "toggle-timeline", "toggle-chat", "actions"]],
};

/**
 * The timeline's: cuts at the playhead and the layer list's monitoring
 * toggles besides. Select all would select what the stage holds rather than
 * the clips in view, so it is not offered over nothing.
 */
export const TIMELINE_MENU: NodeMenuLayout = {
  nodes: [
    CLIPBOARD,
    ["shortcut:split"],
    STRUCTURE,
    ["shortcut:bring-to-front", "shortcut:send-to-back", "shortcut:toggle-hidden", "toggle-muted", "toggle-soloed"],
    MEDIA,
    GENERATE,
  ],
  empty: [["shortcut:paste"]],
};

/**
 * The timeline header's: what its buttons do, and putting the timeline away
 * (or bringing it back), which a double-click on it does too.
 */
export const TIMELINE_HEADER_MENU: string[][] = [
  ["shortcut:toggle-playback", "shortcut:split"],
  ["toggle-timeline"],
];

/** Whether `command` would run over the selection rather than ask for a target. */
const offered = (command: RegisteredCommand) => (command.available?.() ?? true) && (command.ready?.() ?? true);

/** `layout`'s commands that are on offer, sections left with none left out. */
function resolve(commands: RegisteredCommand[], layout: string[][]): RegisteredCommand[][] {
  const byId = new Map(commands.map((command) => [command.id, command]));
  return layout
    .map((ids) => ids.map((id) => byId.get(id)).filter((command) => command !== undefined).filter(offered))
    .filter((section) => section.length > 0);
}

export type NodeContextMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "onContextMenu"> & {
  /** The nodes a right-click at `event` is on; empty over nothing. */
  pick(event: MouseEvent): Entity[];
  /** `CANVAS_MENU` when left out. */
  layout?: NodeMenuLayout;
};

/** The rest of the props go to the element that answers the right-click, which holds `children`. */
export function NodeContextMenu(props: NodeContextMenuProps) {
  const [local, rest] = splitProps(props, ["pick", "layout", "children"]);
  const world = useWorld();
  const { commands } = useCommands();
  const { nodes } = useSelection();

  const select = (event: MouseEvent) => {
    const editor = getDocumentEditor(world);
    const picked = local.pick(event);
    const selected = nodes();

    if (!picked.length) editor.clearSelection();
    else if (!picked.every((node) => selected.includes(node))) editor.select(picked);

    // Nothing to offer (over nothing, with nothing to paste): no menu at all,
    // rather than an empty one. Prevented, the trigger leaves it closed.
    if (live().length === 0) event.preventDefault();
  };

  /**
   * What is on offer for the selection. Followed while the menu is open:
   * what the selected media is (which `upscale` and the other media commands
   * look at) is read off the engine once per tick, so a selection the
   * right-click just made shows up in it a frame after the menu opens.
   */
  const live = () => {
    const layout = local.layout ?? CANVAS_MENU;
    return resolve(commands(), nodes().length ? layout.nodes : layout.empty);
  };

  return (
    <CommandMenu {...rest} sections={live} onContextMenu={select}>
      {local.children}
    </CommandMenu>
  );
}

export type CommandContextMenuProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "onContextMenu"> & {
  /** What the menu lists, by command id, a rule between sections. */
  layout: string[][];
};

/**
 * A right-click menu of commands that work on no selection — a panel's
 * header's, say. Unlike `NodeContextMenu`, the click leaves the selection be.
 */
export function CommandContextMenu(props: CommandContextMenuProps) {
  const [local, rest] = splitProps(props, ["layout", "children"]);
  const { commands } = useCommands();

  const live = () => resolve(commands(), local.layout);

  const prevent = (event: MouseEvent) => {
    if (live().length === 0) event.preventDefault();
  };

  return (
    <CommandMenu {...rest} sections={live} onContextMenu={prevent}>
      {local.children}
    </CommandMenu>
  );
}

type CommandMenuProps = JSX.HTMLAttributes<HTMLDivElement> & {
  /** What is on offer, followed while the menu is open. */
  sections(): RegisteredCommand[][];
  onContextMenu(event: MouseEvent): void;
};

function CommandMenu(props: CommandMenuProps) {
  const [local, rest] = splitProps(props, ["sections", "children"]);
  const { execute } = useCommands();
  const [frozen, setFrozen] = createSignal<RegisteredCommand[][] | null>(null);

  /**
   * Holds the list as it stands until the menu is open again: a command run
   * from it changes the selection, and the menu should not change under the
   * pointer while it fades out.
   */
  const freeze = () => {
    if (frozen() === null) setFrozen(local.sections());
  };

  const sections = () => frozen() ?? local.sections();

  return (
    <ContextMenu onOpenChange={(open) => (open ? setFrozen(null) : freeze())}>
      <ContextMenuTrigger {...rest}>
        {local.children}
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="w-[220px]">
          <For each={sections()}>
            {(section, index) => (
              <>
                <Show when={index() > 0}>
                  <ContextMenuSeparator />
                </Show>
                <ContextMenuGroup>
                  <For each={section}>
                    {(command) => (
                      <ContextMenuItem
                        onSelect={() => {
                          freeze();
                          execute(command);
                        }}
                      >
                        {command.title}
                        <Show when={command.shortcut}>
                          {(keys) => <ContextMenuShortcut>{keys().join("")}</ContextMenuShortcut>}
                        </Show>
                      </ContextMenuItem>
                    )}
                  </For>
                </ContextMenuGroup>
              </>
            )}
          </For>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  );
}
