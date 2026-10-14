/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useCommand } from "@/context/commands";
import { TransformBar } from "./transform-bar";

export function UpscaleCommand() {
  useCommand({
    id: "upscale",
    title: "Upscale",
    group: "Media",
    icon: "arrow-scale",
    keywords: ["resolution", "enhance", "sharpen"],
    bar: () => <TransformBar type="upscale" verb="Upscale" empty="Select an image or video to upscale" />,
  });

  return null;
}
