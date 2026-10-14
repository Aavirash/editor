/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Show, createEffect } from "solid-js";
import { useTrait, useWorld } from "@diffusionstudio/koota-solid";
import { Name } from "@diffusionstudio/runtime";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDerived } from "@/engine/hooks";
import { ActionBar } from "./action-bar";
import { applyClipPaths, cancelClipPath, getClipPathPicks, getClipPathTarget } from "@/engine/clip-path";

import type { Entity } from "koota";

/**
 * The clip path tool's action bar, over the canvas while the tool is up: how
 * many of the selected shapes would clip the target, and the way out —
 * Cancel leaves the document as it was, Confirm makes them clip paths of the
 * target.
 */
export function ClipPathBar() {
  const world = useWorld();

  const target = useDerived(getClipPathTarget);
  const picks = useDerived(() => getClipPathPicks(world), sameEntities);

  // Nothing to aim at (the target was deleted, or undone away): the tool has no work left.
  createEffect(() => {
    if (!target()) cancelClipPath(world);
  });

  return (
    <Show when={target()}>
      {(node) => (
        <ActionBar>
          <span class="px-2 text-xs text-muted-foreground whitespace-nowrap">
            {picks().length === 0
              ? "Pick a shape to use as the clipping source"
              : `${picks().length} ${picks().length === 1 ? "shape" : "shapes"} selected`}
          </span>
          <Separator orientation="vertical" class="min-h-5" />
          <Tooltip>
            <TooltipTrigger as={Button} variant="ghost" class="text-muted-foreground" onClick={() => cancelClipPath(world)}>
              Cancel
            </TooltipTrigger>
            <TooltipContent shortcut="Esc">Cancel</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as={Button} disabled={picks().length === 0} onClick={() => applyClipPaths(world)}>
              Confirm
            </TooltipTrigger>
            <TooltipContent shortcut="⌘↵">Clip <TargetName target={node()} /></TooltipContent>
          </Tooltip>
        </ActionBar>
      )}
    </Show>
  );
}

function TargetName(props: { target: Entity }) {
  const name = useTrait(() => props.target, Name);
  return <span class="text-foreground">{name()?.value || "this layer"}</span>;
}

function sameEntities(a: Entity[], b: Entity[]): boolean {
  return a.length === b.length && a.every((entity, i) => entity === b[i]);
}
