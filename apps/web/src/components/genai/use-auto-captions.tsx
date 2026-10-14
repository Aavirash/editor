/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useWorld } from "@diffusionstudio/koota-solid";
import { useProject } from "@/context/project";
import { generateCaptions } from "@/engine/generate";
import { useActiveScene } from "@/engine/hooks";

/** Captions for the active scene, the one being edited: selecting a scene makes it active. */
export function useAutoCaptions() {
  const world = useWorld();
  const project = useProject();
  const scene = useActiveScene();

  const generate = () => {
    const active = scene();
    if (active) {
      generateCaptions(world, active, project.dir());
    }
  };

  return { scene, generate };
}
