/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useCommand } from "@/context/commands";
import { TransformBar } from "./transform-bar";

export function RemoveBackgroundCommand() {
  useCommand({
    id: "remove-background",
    title: "Remove background",
    group: "Media",
    icon: "ai-generate",
    keywords: ["cutout", "matte", "transparent"],
    bar: () => (
      <TransformBar type="removeBackground" verb="Remove the background of" empty="Select an image to cut out" />
    ),
  });

  return null;
}
