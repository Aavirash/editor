/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSignal } from "solid-js";
import { computeOutputSize } from "@diffusionstudio/encoder";
import { Computed } from "@diffusionstudio/runtime";
import { Separator } from "@/components/ui/separator";
import { useCommand, useCommands } from "@/context/commands";
import { useExport } from "@/context/export";
import { useActiveScene, useDerived } from "@/engine/hooks";
import { store } from "@/init";
import { ActionBar, ActionBarCancel, ActionBarConfirm, ActionBarTarget } from "@/components/canvas/action-bar";
import { PresetMenu } from "./preset-menu";

import type { PresetGroup } from "./preset-menu";

/** The preset the bar opened on last, kept across sessions. */
const LAST_PRESET_KEY = "commands.export-current-frame.preset";

/** The sizes an image is offered at, named as the video presets name them; each is the shorter side. */
const PRESETS = [
  { id: "1080p", name: "Full HD", resolution: 1080 },
  { id: "1440p", name: "2k Quad HD", resolution: 1440 },
  { id: "2160p", name: "4K Ultra HD", resolution: 2160 },
];

export function ExportCurrentFrameCommand() {
  useCommand({
    id: "export-current-frame",
    title: "Export current frame",
    group: "Export",
    icon: "image",
    keywords: ["image", "still", "png", "screenshot", "1080p", "1440p", "4k"],
    shortcut: ["⇧", "⌘", "E"],
    bar: ExportCurrentFrameBar,
  });

  return null;
}

/** The frame at the active scene's playhead, exported as a PNG at the size picked. */
function ExportCurrentFrameBar() {
  const { close } = useCommands();
  const { exportFrame } = useExport();
  const scene = useActiveScene();
  const size = useDerived(
    () => {
      const computed = scene()?.get(Computed);
      return { width: computed?.width || 1920, height: computed?.height || 1080 };
    },
    (a, b) => a.width === b.width && a.height === b.height,
  );

  const [picked, setPicked] = createSignal(store.get<string>(LAST_PRESET_KEY));
  const preset = () => PRESETS.find((entry) => entry.id === picked()) ?? PRESETS[0]!;

  // Each preset with the pixel size it makes of this scene.
  const groups = (): PresetGroup[] => [
    {
      label: "Size",
      presets: PRESETS.map((entry) => {
        const output = computeOutputSize(size().width, size().height, entry.resolution);
        return { id: entry.id, name: entry.name, detail: `${output.width}×${output.height}` };
      }),
    },
  ];

  const pick = (id: string) => {
    setPicked(id);
    store.set(LAST_PRESET_KEY, id);
  };

  const confirm = () => {
    const active = scene();
    if (!active) return;
    close();
    void exportFrame(active, preset().resolution);
  };

  return (
    <ActionBar>
      <ActionBarTarget nodes={scene() ? [scene()!] : []} verb="Export frame of" empty="Open a scene to export" />
      <PresetMenu groups={groups()} value={preset().id} onChange={pick} tooltip="Image size" />
      <Separator orientation="vertical" class="min-h-5" />
      <ActionBarCancel onCancel={close} />
      <ActionBarConfirm disabled={!scene()} onConfirm={confirm} hint="Export current frame" />
    </ActionBar>
  );
}
