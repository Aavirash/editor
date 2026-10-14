/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useCommand } from "@/context/commands";

/** Loads the window again, for when it is stuck; the project reopens from disk. */
export function ReloadWindowCommand() {
  useCommand({
    id: "reload-window",
    title: "Force reload window",
    group: "Window",
    icon: "reload",
    keywords: ["refresh", "restart"],
    shortcut: ["⌘", "R"],
    run: () => window.location.reload(),
  });

  return null;
}
