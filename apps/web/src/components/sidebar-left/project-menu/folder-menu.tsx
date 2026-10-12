/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { For, Show, createResource } from "solid-js";
import { toast } from "somoto";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useProject } from "@/context/project";
import { listEditors, openInEditor, revealPath } from "@/lib/shell";
import { isWindowsDesktop } from "@/projects";

import type { EditorInfo } from "@/lib/shell";

/** What can be done with the project's folder. */
export function FolderMenu() {
  const project = useProject();
  const [editors] = createResource(listEditors, { initialValue: [] });

  const handleSaveFolder = async () => {
    try {
      await project.save();
    } catch (e) {
      toast.error("Failed to save project", { description: (e as Error).message });
    }
  };

  const handleReveal = async () => {
    try {
      await revealPath(project.dir());
    } catch (e) {
      toast.error("Failed to show the folder", { description: (e as Error).message });
    }
  };

  const handleOpenInEditor = async (editor: EditorInfo) => {
    try {
      await openInEditor(editor.id, project.dir());
    } catch (e) {
      toast.error(`Failed to open in ${editor.label}`, { description: (e as Error).message });
    }
  };

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={handleSaveFolder} disabled={!project.draft()}>
          Save folder...
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleReveal}>
          {isWindowsDesktop() ? "Show in Explorer" : "Show in Finder"}
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <Show when={editors().length > 0}>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <For each={editors()}>
            {(editor) => (
              <DropdownMenuItem onSelect={() => handleOpenInEditor(editor)}>
                Open in {editor.label}
              </DropdownMenuItem>
            )}
          </For>
        </DropdownMenuGroup>
      </Show>
    </>
  );
}
