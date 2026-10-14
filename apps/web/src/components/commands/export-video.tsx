/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createMemo, createSignal } from "solid-js";
import { Separator } from "@/components/ui/separator";
import { useCommand, useCommands } from "@/context/commands";
import { useExport } from "@/context/export";
import { useActiveScene } from "@/engine/hooks";
import { useProjectConfig } from "@/engine/project-config";
import { store } from "@/init";
import {
  DEFAULT_EXPORT_TEMPLATE_ID,
  EXPORT_TEMPLATE_GROUPS,
  TEMPLATE_BY_ID,
} from "@/components/sidebar-right/inspector/export-templates";
import { ActionBar, ActionBarCancel, ActionBarConfirm, ActionBarTarget } from "@/components/canvas/action-bar";
import { PresetMenu } from "./preset-menu";

import type { ExportConfig } from "@/components/sidebar-right/inspector/export-templates";
import type { PresetGroup } from "./preset-menu";

/** The preset the bar opened on last, kept across sessions. */
const LAST_PRESET_KEY = "commands.export-video.preset";

/** The scene's own settings, from the inspector's Export panel, as a pick. */
const SCENE_SETTINGS = "scene";

export function ExportVideoCommand() {
  useCommand({
    id: "export-video",
    title: "Export video",
    group: "Export",
    icon: "film-video-export",
    keywords: ["render", "mp4", "webm", "720p", "1080p", "1440p", "4k", "youtube", "tiktok", "instagram"],
    shortcut: ["⌘", "E"],
    bar: ExportVideoBar,
  });

  return null;
}

/** "1080p", "4K", with the container when it is not MP4: what a preset comes out as. */
function describe(config: ExportConfig): string {
  if (config.format === "ogg" || config.video?.enabled === false) return "Audio only";
  const resolution = config.video?.resolution ?? 1080;
  const size = resolution === 2160 ? "4K" : `${resolution}p`;
  return config.format && config.format !== "mp4" ? `${size} · ${config.format.toUpperCase()}` : size;
}

/** The active scene, exported as a video with the preset picked. */
function ExportVideoBar() {
  const { close } = useCommands();
  const { exportScene } = useExport();
  const scene = useActiveScene();
  const config = useProjectConfig();

  const sceneSettings = createMemo(() => {
    const active = scene();
    return active ? config()?.exportOf(active) ?? null : null;
  });

  // The scene's own settings when it has them, else the last preset used.
  const [picked, setPicked] = createSignal<string | null>(null);
  const preset = () => {
    const id = picked();
    if (id === SCENE_SETTINGS && sceneSettings()) return id;
    if (id !== null && TEMPLATE_BY_ID.has(id)) return id;
    if (sceneSettings()) return SCENE_SETTINGS;
    const last = store.get<string>(LAST_PRESET_KEY);
    return last && TEMPLATE_BY_ID.has(last) ? last : DEFAULT_EXPORT_TEMPLATE_ID;
  };

  const groups = (): PresetGroup[] => {
    const own = sceneSettings();
    return [
      ...(own ? [{ label: "Scene", presets: [{ id: SCENE_SETTINGS, name: "Scene settings", detail: describe(own) }] }] : []),
      ...EXPORT_TEMPLATE_GROUPS.map((group) => ({
        label: group.label,
        presets: group.items.map((template) => ({ id: template.id, name: template.name, detail: describe(template) })),
      })),
    ];
  };

  const pick = (id: string) => {
    setPicked(id);
    if (id !== SCENE_SETTINGS) store.set(LAST_PRESET_KEY, id);
  };

  const confirm = () => {
    const active = scene();
    const id = preset();
    const settings = id === SCENE_SETTINGS ? sceneSettings() : TEMPLATE_BY_ID.get(id);
    if (!active || !settings) return;
    close();
    void exportScene(active, { format: settings.format, video: settings.video, audio: settings.audio });
  };

  return (
    <ActionBar>
      <ActionBarTarget nodes={scene() ? [scene()!] : []} verb="Export" empty="Open a scene to export" />
      <PresetMenu groups={groups()} value={preset()} onChange={pick} tooltip="Export preset" />
      <Separator orientation="vertical" class="min-h-5" />
      <ActionBarCancel onCancel={close} />
      <ActionBarConfirm disabled={!scene()} onConfirm={confirm} hint="Export video" />
    </ActionBar>
  );
}
