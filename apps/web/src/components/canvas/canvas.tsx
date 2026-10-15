/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createEffect, on, onCleanup, onMount } from "solid-js";
import { useWorld } from "@diffusionstudio/koota-solid";
import { findSceneAt, screenToWorld, worldToLocal, Library, Root } from "@diffusionstudio/runtime";
import { CameraController, EngineCanvas, nodesAt, panBy } from "@/engine";
import { useLayout } from "@/context/layout";
import { insertAsset } from "@/engine/insert-asset";
import { droppedFiles, importFiles } from "@/engine/asset-actions";
import { Toolbar } from "./toolbar";
import { CanvasCommands, NodeContextMenu } from "@/components/commands";
import { DesktopAppBanner } from "./desktop-app-banner";
import { toast } from "somoto"
import { SceneInitOverlay } from "./scene-init-overlay";
import { ASSET_DRAG_TYPE } from "@/components/sidebar-left/folder-item";

import type { Asset } from "@diffusionstudio/assets";

export function Canvas() {
  const world = useWorld();
  const { uiVisible } = useLayout();
  let container!: HTMLDivElement;

  /**
   * Where the canvas sits on screen, kept up as the panels around it change
   * size (the left one animates between the sidebar's tabs).
   */
  let origin: DOMRect | null = null;
  const observer = new ResizeObserver(() => (origin = container.getBoundingClientRect()));
  onMount(() => observer.observe(container));
  onCleanup(() => observer.disconnect());

  /**
   * Showing or hiding the panels moves the canvas's corner across the
   * screen; the camera moves back by as much, so what is drawn stays where it
   * was. The grid snaps rather than animates when the panels come and go, so
   * the new place can be read straight away, ahead of the observer.
   */
  createEffect(on(uiVisible, () => {
    const before = origin;
    origin = container.getBoundingClientRect();
    if (!before) return;

    const dx = origin.left - before.left;
    const dy = origin.top - before.top;
    if (dx || dy) panBy(world, dx, dy);
  }, { defer: true }));

  /**
   * Drops onto the canvas: library assets (dragged from the panel) land where
   * they were dropped, in the scene under the pointer; external files are
   * imported into the library first, then land the same way.
   *
   * With no scene under the pointer they land loose on the stage, like an
   * element drawn there (see `@/engine/draw-tool`): the drop says where, so the active
   * scene — which is somewhere else entirely — is not the answer.
   */
  const handleDropEvent = async (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const library = world.get(Library);
    if (!library) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const worldPt = screenToWorld(world, event.clientX - rect.left, event.clientY - rect.top);
    const scene = findSceneAt(world, worldPt.x, worldPt.y);
    const parent = scene ?? world.get(Root)!;
    const localPt = scene ? worldToLocal(world, scene, worldPt.x, worldPt.y) : worldPt;

    const place = (asset: Asset) => {
      const size = 'width' in asset && 'height' in asset ? { width: asset.width, height: asset.height } : { width: 500, height: 150 };
      const placed = insertAsset(world, asset, {
        parent,
        x: localPt.x - size.width / 2,
        y: localPt.y - size.height / 2,
      });
      if (!placed) toast("Nothing to insert into", { description: "Open a project first." });
    };

    const assetIds = event.dataTransfer?.getData(ASSET_DRAG_TYPE)?.split(',').filter(Boolean) ?? [];
    for (const id of assetIds) {
      const asset = library.get(id);
      if (asset) place(asset);
    }

    const files = droppedFiles(event);
    if (files.length) {
      for (const asset of await importFiles(library, files, '')) place(asset);
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div ref={container} class="relative size-full bg-background">
      <div
        class="absolute inset-0"
        on:drop={handleDropEvent}
        on:dragover={handleDragOver}
      >
        <Toolbar />
        <CanvasCommands />
        <DesktopAppBanner />
        <SceneInitOverlay />
        <NodeContextMenu class="size-full" pick={(event) => nodesAt(world, event)}>
          <EngineCanvas />
        </NodeContextMenu>
        <CameraController />
      </div>
    </div>
  );
}
