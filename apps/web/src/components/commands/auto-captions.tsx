/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Separator } from "@/components/ui/separator";
import { useCommand, useCommands } from "@/context/commands";
import { useAutoCaptions } from "@/components/genai/use-auto-captions";
import { ActionBar, ActionBarCancel, ActionBarConfirm, ActionBarTarget } from "@/components/canvas/action-bar";

export function AutoCaptionsCommand() {
  useCommand({
    id: "auto-captions",
    title: "Generate captions",
    group: "Media",
    icon: "captions",
    keywords: ["auto-captions", "subtitles", "transcribe"],
    bar: AutoCaptionsBar,
  });

  return null;
}

/** The active scene, captioned from its audio on Confirm. */
function AutoCaptionsBar() {
  const { close } = useCommands();
  const { scene, generate } = useAutoCaptions();

  const confirm = () => {
    generate();
    close();
  };

  return (
    <ActionBar>
      <ActionBarTarget nodes={scene() ? [scene()!] : []} verb="Target:" empty="Open a scene to caption" />
      <Separator orientation="vertical" class="min-h-5" />
      <ActionBarCancel onCancel={close} />
      <ActionBarConfirm disabled={!scene()} onConfirm={confirm} hint="Caption" />
    </ActionBar>
  );
}
