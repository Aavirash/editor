/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { Command as CommandPrimitive, defaultFilter } from "cmdk-solid";
import { Icon } from "@/components/ui/icon";
import { SECTIONS, useCommands } from "@/context/commands";

import type { RegisteredCommand } from "@/context/commands";

const offered = (command: RegisteredCommand) => command.available?.() ?? true;

/**
 * The least score a match needs to be listed. cmdk matches letters anywhere
 * in order, so "group" finds g…r…o…u…p across a command's keywords; such a
 * match scores well under this, a word or prefix or initials well over.
 */
const MIN_SCORE = 0.05;

/** How many of the commands last carried out the palette lists over the rest. */
const RECENTS_LISTED = 4;

/**
 * The command palette, on ⌘K: the commands on offer, by section, found by
 * typing; the arrows pick one, Enter carries it out.
 */
export function CommandPalette() {
  const commands = useCommands();

  // Picking a command can hand the focus to what it opens (the prompt box),
  // which the dialog would otherwise take back on its way out.
  let picked = false;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
    // Nothing on offer outside the editor yet: ⌘K is left alone there.
    if (!commands.paletteOpen() && !commands.commands().some(offered)) return;

    // Ahead of the editor, which would record the K as held.
    event.preventDefault();
    event.stopPropagation();
    commands.setPaletteOpen(!commands.paletteOpen());
  };

  onMount(() => window.addEventListener("keydown", onKeyDown, true));
  onCleanup(() => window.removeEventListener("keydown", onKeyDown, true));

  const pick = (command: RegisteredCommand) => {
    picked = true;
    commands.execute(command);
  };

  return (
    <Dialog open={commands.paletteOpen()} onOpenChange={commands.setPaletteOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay-soft data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0" />
        <Dialog.Content
          class="fixed top-[20vh] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground outline-none shadow-[0px_12px_24px_0px_rgba(0,0,0,0.24)] data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-[0.98] data-[expanded]:zoom-in-[0.98] duration-100"
          onCloseAutoFocus={(event: Event) => {
            if (picked) event.preventDefault();
            picked = false;
          }}
        >
          <Dialog.Title class="sr-only">Commands</Dialog.Title>
          <PaletteContent onPick={pick} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

type ListedSection = {
  name: string;
  commands: RegisteredCommand[];
  /** Tells its items from the same commands listed in another section. */
  key?: string;
};

/**
 * The commands on offer that match `search`, in sections. Without a search,
 * sections in `SECTIONS` order and commands by `order`, then in the order
 * they registered;
 * with one, the best match first, and the section it is in. cmdk scores,
 * but leaves the order alone under Solid.
 */
function rank(commands: RegisteredCommand[], search: string): ListedSection[] {
  const query = search.trim();
  const matches = commands
    .filter(offered)
    .map((command) => ({
      command,
      score: query ? defaultFilter(command.title, query, [command.group, ...(command.keywords ?? [])]) : 1,
    }))
    .filter((match) => match.score >= MIN_SCORE)
    .sort(
      (a, b) =>
        b.score - a.score ||
        SECTIONS.indexOf(a.command.group) - SECTIONS.indexOf(b.command.group) ||
        (a.command.order ?? 0) - (b.command.order ?? 0),
    );

  const byName = new Map<string, RegisteredCommand[]>();
  for (const { command } of matches) {
    const section = byName.get(command.group);
    if (section) section.push(command);
    else byName.set(command.group, [command]);
  }
  return [...byName].map(([name, list]) => ({ name, commands: list }));
}

function PaletteContent(props: { onPick(command: RegisteredCommand): void }) {
  const commands = useCommands();
  const [search, setSearch] = createSignal("");

  const sections = createMemo((): ListedSection[] => {
    const listed = rank(commands.commands(), search());
    if (search().trim()) return listed;

    const recent = commands
      .recents()
      .map((id) => commands.commands().find((command) => command.id === id && offered(command)))
      .filter((command) => command !== undefined)
      .slice(0, RECENTS_LISTED);
    return recent.length ? [{ name: "Recents", commands: recent, key: "recent" }, ...listed] : listed;
  });

  return (
    <CommandPrimitive label="Commands" loop shouldFilter={false} class="flex flex-col">
      <div class="flex h-11 shrink-0 px-2">
        <div class="flex min-w-0 flex-1 items-center border-b border-border">
          <span class="flex size-7 shrink-0 items-center justify-center">
            <Icon name="search" class="text-muted-foreground" />
          </span>
          <CommandPrimitive.Input
            value={search()}
            onValueChange={setSearch}
            placeholder="Search or type a command"
            class="h-full min-w-0 flex-1 bg-transparent text-xs text-foreground outline-hidden placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <CommandPrimitive.List class="max-h-[min(400px,60vh)] scroll-py-1 overflow-y-auto overflow-x-hidden px-3 py-1 [&_[cmdk-list-sizer]]:flex [&_[cmdk-list-sizer]]:flex-col [&_[cmdk-list-sizer]]:gap-2">
        <CommandPrimitive.Empty class="py-6 text-center text-xs text-muted-foreground">
          No commands found
        </CommandPrimitive.Empty>
        <For each={sections()}>
          {(section) => (
            <CommandPrimitive.Group
              heading={section.name}
              class="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:h-8 [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:select-none"
            >
              <For each={section.commands}>
                {(command) => (
                  <CommandPrimitive.Item
                    value={section.key ? `${section.key}:${command.id}` : command.id}
                    onSelect={() => props.onPick(command)}
                    class="group flex h-8 cursor-default items-center text-xs text-foreground outline-hidden select-none"
                  >
                    <span class="flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md pr-1 group-data-[selected=true]:bg-accent [&_svg]:text-muted-foreground group-data-[selected=true]:[&_svg]:text-foreground">
                      <span class="flex size-7 shrink-0 items-center justify-center">
                        <Show when={command.icon}>{(icon) => <Icon name={icon()} />}</Show>
                      </span>
                      <span class="flex-1 truncate">{command.title}</span>
                      <Show when={command.shortcut}>
                        {(keys) => <span class="shrink-0 px-2 text-xxs text-muted-foreground">{keys().join("")}</span>}
                      </Show>
                    </span>
                  </CommandPrimitive.Item>
                )}
              </For>
            </CommandPrimitive.Group>
          )}
        </For>
      </CommandPrimitive.List>
    </CommandPrimitive>
  );
}
