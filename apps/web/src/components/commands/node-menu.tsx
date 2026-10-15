/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The menu a right-click on nodes puts up, the way Figma's does: the click
// selects what it lands on first (unless that is selected already, so a
// selection of several survives it), and the menu lists what the palette
// offers for that selection. Every surface that shows nodes wraps itself in
// one, and says which nodes are under the pointer.

import { createSignal, For, Show } from "solid-js";
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
 * The commands listed over a selection, by id, a rule between sections. One
 * that has nothing in the selection to work on is left out, and a section
 * left with none goes with it.
 */
const NODE_SECTIONS = [
  ["shortcut:copy", "shortcut:cut", "shortcut:paste", "shortcut:duplicate", "shortcut:delete"],
  [
    "shortcut:group",
    "shortcut:ungroup",
    "shortcut:wrap-in-scene",
    "shortcut:wrap-in-sequence",
    "shortcut:unwrap-sequence",
  ],
  ["shortcut:bring-to-front", "shortcut:send-to-back", "shortcut:toggle-hidden"],
  ["upscale", "remove-background", "remove-silence", "auto-captions"],
  ["edit-with-prompt", "make-video", "rerun", "reuse-settings"],
];

/** The commands listed over nothing. */
const STAGE_SECTIONS = [["shortcut:paste", "shortcut:select-all"]];

/** Whether `command` would run over the selection rather than ask for a target. */
const offered = (command: RegisteredCommand) => (command.available?.() ?? true) && (command.ready?.() ?? true);

export function NodeContextMenu(props: {
  /** The nodes a right-click at `event` is on; empty over nothing. */
  pick(event: MouseEvent): Entity[];
  class?: string;
  children: JSX.Element;
}) {
  const world = useWorld();
  const { commands, execute } = useCommands();
  const { nodes } = useSelection();
  const [frozen, setFrozen] = createSignal<RegisteredCommand[][] | null>(null);

  const select = (event: MouseEvent) => {
    const editor = getDocumentEditor(world);
    const picked = props.pick(event);
    const selected = nodes();

    if (!picked.length) editor.clearSelection();
    else if (!picked.every((node) => selected.includes(node))) editor.select(picked);
  };

  /**
   * What is on offer for the selection. Followed while the menu is open:
   * what the selected media is (which `upscale` and the other media commands
   * look at) is read off the engine once per tick, so a selection the
   * right-click just made shows up in it a frame after the menu opens.
   */
  const live = () => {
    const byId = new Map(commands().map((command) => [command.id, command]));
    const layout = nodes().length ? NODE_SECTIONS : STAGE_SECTIONS;
    return layout
      .map((ids) => ids.map((id) => byId.get(id)).filter((command) => command !== undefined).filter(offered))
      .filter((section) => section.length > 0);
  };

  /**
   * Holds the list as it stands until the menu is open again: a command run
   * from it changes the selection, and the menu should not change under the
   * pointer while it fades out.
   */
  const freeze = () => {
    if (frozen() === null) setFrozen(live());
  };

  const sections = () => frozen() ?? live();

  return (
    <ContextMenu onOpenChange={(open) => (open ? setFrozen(null) : freeze())}>
      <ContextMenuTrigger class={props.class} onContextMenu={select}>
        {props.children}
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
