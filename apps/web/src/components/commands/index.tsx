/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ToolType } from "@diffusionstudio/runtime";
import { AutoCaptionsCommand } from "./auto-captions";
import { EditWithPromptCommand } from "./edit-with-prompt";
import { GenerateCommand } from "./generate";
import { MakeVideoCommand } from "./make-video";
import { RemoveBackgroundCommand } from "./remove-background";
import { RerunCommand } from "./rerun";
import { ReuseSettingsCommand } from "./reuse-settings";
import { ToolCommand } from "./tool";
import { UpscaleCommand } from "./upscale";

export { CommandBar } from "./command-bar";
export { CommandPalette } from "./palette";

/**
 * The canvas's commands: what to generate, what the selected media can be
 * run through, and the toolbar's tools. Sections are listed in the order
 * they are first mounted here.
 */
export function CanvasCommands() {
  return (
    <>
      <GenerateCommand mode="IMAGE" />
      <GenerateCommand mode="VIDEO" />
      <GenerateCommand mode="VOICE" />
      <GenerateCommand mode="AUDIO" />
      <EditWithPromptCommand />
      <MakeVideoCommand />
      <RerunCommand />
      <ReuseSettingsCommand />
      <UpscaleCommand />
      <RemoveBackgroundCommand />
      <AutoCaptionsCommand />
      <ToolCommand tool={ToolType.MOVE} />
      <ToolCommand tool={ToolType.HAND} />
      <ToolCommand tool={ToolType.OBJECT_MASK} />
      <ToolCommand tool={ToolType.SCENE} />
      <ToolCommand tool={ToolType.RECT} />
      <ToolCommand tool={ToolType.ELLIPSE} />
      <ToolCommand tool={ToolType.POLYGON} />
      <ToolCommand tool={ToolType.PEN} />
      <ToolCommand tool={ToolType.TEXT} />
    </>
  );
}
