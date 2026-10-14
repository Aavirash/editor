/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ToolType } from "@diffusionstudio/runtime";
import { AutoCaptionsCommand } from "./auto-captions";
import { EditWithPromptCommand } from "./edit-with-prompt";
import { ExportCurrentFrameCommand } from "./export-current-frame";
import { ExportVideoCommand } from "./export-video";
import { GenerateCommand } from "./generate";
import { MakeVideoCommand } from "./make-video";
import { RemoveBackgroundCommand } from "./remove-background";
import { RerunCommand } from "./rerun";
import { ReuseSettingsCommand } from "./reuse-settings";
import { ShortcutCommands } from "./shortcuts";
import { ToolCommand } from "./tool";
import { UpscaleCommand } from "./upscale";

export { CommandBar } from "./command-bar";
export { CommandPalette } from "./palette";
export { ReloadWindowCommand } from "./reload-window";

/**
 * The canvas's commands: what to generate, what the selected media can be
 * run through, the toolbar's tools, and the keyboard shortcuts.
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
      <ExportVideoCommand />
      <ExportCurrentFrameCommand />
      <ToolCommand tool={ToolType.MOVE} />
      <ToolCommand tool={ToolType.HAND} />
      <ToolCommand tool={ToolType.OBJECT_MASK} />
      <ToolCommand tool={ToolType.SCENE} />
      <ToolCommand tool={ToolType.RECT} />
      <ToolCommand tool={ToolType.ELLIPSE} />
      <ToolCommand tool={ToolType.POLYGON} />
      <ToolCommand tool={ToolType.PEN} />
      <ToolCommand tool={ToolType.TEXT} />
      <ShortcutCommands />
    </>
  );
}
