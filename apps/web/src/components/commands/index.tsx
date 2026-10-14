/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AutoCaptionsCommand } from "./auto-captions";
import { EditWithPromptCommand } from "./edit-with-prompt";
import { MakeVideoCommand } from "./make-video";
import { RemoveBackgroundCommand } from "./remove-background";
import { RerunCommand } from "./rerun";
import { ReuseSettingsCommand } from "./reuse-settings";
import { UpscaleCommand } from "./upscale";

export { CommandBar } from "./command-bar";
export { CommandPalette } from "./palette";

/** The commands on the selection in the canvas: what the media can be run through, and generated from. */
export function CanvasCommands() {
  return (
    <>
      <UpscaleCommand />
      <RemoveBackgroundCommand />
      <AutoCaptionsCommand />
      <EditWithPromptCommand />
      <MakeVideoCommand />
      <RerunCommand />
      <ReuseSettingsCommand />
    </>
  );
}
