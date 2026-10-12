/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { toast } from "somoto";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useProject } from "@/context/project";

/** What can be done with the project's folder. */
export function FolderMenu() {
  const project = useProject();

  const handleSaveFolder = async () => {
    try {
      await project.save();
    } catch (e) {
      toast.error("Failed to save project", { description: (e as Error).message });
    }
  };

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem onSelect={handleSaveFolder} disabled={!project.draft()}>
        Save folder...
        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
