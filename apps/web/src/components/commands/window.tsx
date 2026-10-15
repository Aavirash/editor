/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { onCleanup, onMount } from "solid-js";
import { setSidebarTab } from "@/agent-chat/store";
import { useCommand, useCommands } from "@/context/commands";
import { useLayout } from "@/context/layout";

/** Showing and hiding the panels around the canvas, the chat, and the palette itself. */
export function WindowCommands() {
  const layout = useLayout();
  const { setPaletteOpen } = useCommands();

  useCommand({
    id: "toggle-ui",
    title: "Show/Hide UI",
    group: "Window",
    icon: "sidebar",
    keywords: ["panels", "sidebar", "focus", "fullscreen", "toggle ui"],
    shortcut: ["⌘", "\\"],
    run: layout.toggleUI,
  });

  useCommand({
    id: "open-chat",
    title: "Open chat",
    group: "Window",
    icon: "ask-chat",
    keywords: ["agent", "assistant", "message", "claude"],
    run: () => {
      if (!layout.uiVisible()) layout.toggleUI();
      setSidebarTab("chat");
      // A composer that mounts with the tab focuses itself; one that was up
      // already is focused here, once the menu that ran this has let go.
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("[data-chat-composer]")?.focus());
    },
  });

  useCommand({
    id: "actions",
    title: "Actions…",
    group: "Window",
    icon: "tool.actions-spotlight",
    shortcut: ["⌘", "K"],
    palette: false,
    run: () => setPaletteOpen(true),
  });

  // ⌘\ wherever focus is, a field included, as ⌘K is: ahead of the editor,
  // which would otherwise record the key as held.
  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
    if (event.key !== "\\" && event.code !== "Backslash") return;

    event.preventDefault();
    event.stopPropagation();
    layout.toggleUI();
  };

  onMount(() => window.addEventListener("keydown", onKeyDown, true));
  onCleanup(() => window.removeEventListener("keydown", onKeyDown, true));

  return null;
}
