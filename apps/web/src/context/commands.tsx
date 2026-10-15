/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The commands the palette (⌘K) offers. A command is registered by the
// component that knows how to carry it out (see `useCommand`), mounted where
// the context it needs is: it is on offer for as long as that component is
// up, and its handlers and its bar see that component's context.

import { createContext, createSignal, getOwner, onCleanup, useContext } from "solid-js";
import { store } from "@/init";
import { createStoredSignal } from "@/lib/store";

import type { Accessor, Component, JSX, Owner } from "solid-js";

/**
 * The palette's sections, in the order it lists them. Fixed here rather than
 * taken from the order commands register in, which depends on what mounted
 * first and changes as parts of the UI come and go.
 */
export const SECTIONS = ["Media", "Generate", "Assets", "Export", "Timeline", "Object", "Tools", "Edit", "Window"] as const;

export type Section = (typeof SECTIONS)[number];

/**
 * How many of the commands last carried out are remembered, most recent
 * first. More than the palette lists, so the ones not on offer right now
 * leave room for older ones.
 */
const RECENTS_KEPT = 6;

type CommandAction =
  | {
    /** What picking it does. */
    run(): void;
    bar?: never;
    ready?: never;
  }
  | {
    /**
     * The action bar picking it puts up, over the canvas until the bar
     * closes it (see `useCommands().close`) or Esc does. For commands
     * that need a target picked, or a go-ahead, before they run.
     */
    bar: Component;
    run?: never;
    ready?: never;
  }
  | {
    /** What picking it does while `ready`: what the bar would ask for is settled already. */
    run(): void;
    /** The bar picking it puts up otherwise. */
    bar: Component;
    /** Whether it can run without the bar (what it runs over is selected). */
    ready(): boolean;
  };

export type Command = CommandAction & {
  /** Unique among the commands registered at once. */
  id: string;
  title: string;
  /** The palette section it is listed under. */
  group: Section;
  icon?: string;
  /** More words the palette finds it by. */
  keywords?: string[];
  /** The keys it is bound to, one cap each (["⌘", "K"]); shown, not bound. */
  shortcut?: string[];
  /**
   * Where it is listed in its section, lowest first; 0 when left out.
   * Commands with the same index keep the order they registered in.
   */
  order?: number;
  /** Whether it is offered right now; always, when left out. */
  available?(): boolean;
};

/** A command as registered: with the owner of the component that registered it. */
export type RegisteredCommand = Command & { owner: Owner | null };

type CommandsContextValue = {
  /** Every command registered right now, in the order they were registered. */
  commands: Accessor<RegisteredCommand[]>;
  paletteOpen: Accessor<boolean>;
  setPaletteOpen(open: boolean): void;
  /** The ids of the commands last carried out, most recent first; kept across sessions. */
  recents: Accessor<string[]>;
  /** The command whose bar is up. */
  active: Accessor<RegisteredCommand | null>;
  /** Carries `command` out: runs it, or puts its bar up. */
  execute(command: RegisteredCommand): void;
  /** Takes the bar down. */
  close(): void;
  register(command: RegisteredCommand): () => void;
};

const CommandsContext = createContext<CommandsContextValue>();

export function CommandsProvider(props: { children: JSX.Element }) {
  const [commands, setCommands] = createSignal<RegisteredCommand[]>([]);
  const [paletteOpen, setPaletteOpen] = createSignal(false);
  const [active, setActive] = createSignal<RegisteredCommand | null>(null);
  const [recents, setRecents] = createStoredSignal(store.define<string[]>("commands.recents", []));

  const execute = (command: RegisteredCommand) => {
    setPaletteOpen(false);
    setRecents([command.id, ...recents().filter((id) => id !== command.id)].slice(0, RECENTS_KEPT));
    if (!command.bar || command.ready?.()) {
      command.run?.();
    } else {
      setActive(command);
    }
  };

  const register = (command: RegisteredCommand) => {
    setCommands((list) => [...list, command]);

    return () => {
      setCommands((list) => list.filter((entry) => entry !== command));
      // Its component is gone, and with it what the bar was working with.
      if (active() === command) setActive(null);
    };
  };

  return (
    <CommandsContext.Provider
      value={{ commands, paletteOpen, setPaletteOpen, recents, active, execute, close: () => setActive(null), register }}
    >
      {props.children}
    </CommandsContext.Provider>
  );
}

export function useCommands() {
  const context = useContext(CommandsContext);
  if (!context) throw new Error("useCommands must be used within a CommandsProvider");
  return context;
}

/** Offers `command` in the palette for as long as the calling component is mounted. */
export function useCommand(command: Command): void {
  const { register } = useCommands();
  onCleanup(register({ ...command, owner: getOwner() }));
}
