/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";
import { Command as CommandPrimitive, defaultFilter } from "cmdk-solid";
import { Icon } from "@/components/ui/icon";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SECTIONS, useCommands } from "@/context/commands";

import type { RegisteredCommand } from "@/context/commands";

const offered = (command: RegisteredCommand) => command.available?.() ?? true;

/**
 * The least score a match needs to be listed. cmdk matches letters anywhere
 * in order, so "group" finds g…r…o…u…p across a command's keywords; such a
 * match scores well under this, a word or prefix or initials well over.
 */
const MIN_SCORE = 0.05;

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
          class="fixed top-[20vh] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-180 -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground outline-none shadow-[0px_0px_1px_2px_rgba(0,0,0,0.12),0px_4px_12px_8px_rgba(0,0,0,0.12),0px_12px_16px_0px_rgba(0,0,0,0.16)] data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-[0.98] data-[expanded]:zoom-in-[0.98] duration-100"
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

type ListedSection = { name: string; commands: RegisteredCommand[] };

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

  const sections = createMemo(() => rank(commands.commands(), search()));

  return (
    <CommandPrimitive label="Commands" loop shouldFilter={false} class="flex flex-col">
      {/* Inset like the items below, so the icon sits over theirs and the text over their titles. */}
      <div class="mx-2 flex h-12 shrink-0 items-center gap-1.5 border-b border-border px-1.5">
        <Icon name="search" class="text-muted-foreground" />
        <CommandPrimitive.Input
          value={search()}
          onValueChange={setSearch}
          placeholder="Type a command or search..."
          class="h-full min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
        />
        {/* Enter runs the highlighted command; with nothing listed it does nothing. */}
        <Show when={sections().length > 0}>
          <span class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground select-none">
            Run
            <Kbd>↵</Kbd>
          </span>
        </Show>
      </div>
      <CommandPrimitive.List class="max-h-[min(400px,60vh)] scroll-py-2 overflow-y-auto overflow-x-hidden px-2 pt-1 pb-2">
        <CommandPrimitive.Empty class="py-6 text-center text-xs text-muted-foreground">
          No commands found
        </CommandPrimitive.Empty>
        <For each={sections()}>
          {(section) => (
            <CommandPrimitive.Group
              heading={section.name}
              class="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:h-8 [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              <For each={section.commands}>
                {(command) => (
                  <CommandPrimitive.Item
                    value={command.id}
                    onSelect={() => props.onPick(command)}
                    class="flex h-10 cursor-default items-center gap-1.5 rounded-lg px-1.5 text-sm text-foreground outline-hidden select-none data-[selected=true]:bg-input [&_svg]:text-muted-foreground data-[selected=true]:[&_svg]:text-foreground"
                  >
                    <Show when={command.icon} fallback={<span class="size-[25px] shrink-0" />}>
                      {(icon) => <Icon name={icon()} />}
                    </Show>
                    <span class="flex-1 truncate">{command.title}</span>
                    <Show when={command.shortcut}>
                      {(keys) => (
                        <KbdGroup class="pr-1">
                          <For each={keys()}>{(key) => <Kbd>{key}</Kbd>}</For>
                        </KbdGroup>
                      )}
                    </Show>
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
