/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useWorld } from "@diffusionstudio/koota-solid";
import { Tool, ToolType } from "@diffusionstudio/runtime";
import { useCommand } from "@/context/commands";

type ToolEntry = {
  title: string;
  icon: string;
  /** The key that picks it outside the palette. */
  key?: string;
  keywords: string[];
};

/** The toolbar's tools, as the palette lists them. */
const TOOLS: Partial<Record<ToolType, ToolEntry>> = {
  [ToolType.MOVE]: { title: "Move objects", icon: "move", key: "V", keywords: ["select", "pointer", "cursor"] },
  [ToolType.HAND]: { title: "Pan canvas", icon: "hand", key: "H", keywords: ["hand", "scroll"] },
  [ToolType.OBJECT_MASK]: {
    title: "Mask object",
    icon: "object-mask",
    key: "M",
    keywords: ["smart object mask", "segment", "track", "cutout", "sam", "rotoscope"],
  },
  [ToolType.SCENE]: { title: "Create frame", icon: "scene-frame-small", key: "F", keywords: ["scene", "artboard"] },
  [ToolType.RECT]: { title: "Draw rectangle", icon: "tool.rectangle", key: "R", keywords: ["shape", "square", "box"] },
  [ToolType.ELLIPSE]: { title: "Draw ellipse", icon: "tool.ellipse", key: "O", keywords: ["shape", "circle", "oval"] },
  [ToolType.POLYGON]: { title: "Draw polygon", icon: "tool.polygon", keywords: ["shape", "triangle", "star"] },
  [ToolType.PEN]: { title: "Draw path", icon: "tool.pen", key: "P", keywords: ["pen", "vector", "bezier", "curve"] },
  [ToolType.TEXT]: { title: "Add text", icon: "tool.text", key: "T", keywords: ["type", "title", "label"] },
};

/** Picks `tool`, as its toolbar button does. */
export function ToolCommand(props: { tool: ToolType }) {
  const world = useWorld();
  const entry = TOOLS[props.tool]!;

  useCommand({
    id: `tool:${props.tool}`,
    title: entry.title,
    group: "Tools",
    icon: entry.icon,
    keywords: ["tool", ...entry.keywords],
    shortcut: entry.key ? [entry.key] : undefined,
    run: () => world.set(Tool, { value: props.tool }),
  });

  return null;
}
