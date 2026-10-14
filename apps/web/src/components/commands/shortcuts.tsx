/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The keyboard shortcuts worth finding by name, in the palette under the
// names the project menu gives them: each runs what its keys run, and shows
// the keys.

import { For } from "solid-js";
import { useWorld } from "@diffusionstudio/koota-solid";
import { getActiveEntity, isGroupLike, isSequence, togglePlayback } from "@diffusionstudio/runtime";
import { useCommand } from "@/context/commands";
import {
  getEditHistory,
  groupSelection,
  redoEdit,
  restackSelection,
  splitAtPlayhead,
  toggleSelectionHidden,
  undoEdit,
  ungroupSelection,
  unwrapSequenceSelection,
  useActiveScene,
  useSelection,
  wrapSelectionInScene,
  wrapSelectionInSequence,
} from "@/engine";

import type { Entity, World } from "koota";
import type { Section } from "@/context/commands";
import type { EditHistory } from "@/engine";

/** What a shortcut needs to have something to work on. */
type ShortcutState = {
  /** The selected nodes. */
  nodes: Entity[];
  history: EditHistory;
  scene: Entity | null;
};

type Shortcut = {
  id: string;
  title: string;
  group: Section;
  icon: string;
  /** Its keys, one cap each. */
  keys: string[];
  keywords?: string[];
  run(world: World): void;
  /** Whether it has something to work on; always, when left out. */
  available?(state: ShortcutState): boolean;
};

const selection = ({ nodes }: ShortcutState) => nodes.length > 0;
const activeScene = ({ scene }: ShortcutState) => scene !== null;

const SHORTCUTS: Shortcut[] = [
  {
    id: "group",
    title: "Group",
    group: "Object",
    icon: "group",
    keys: ["⌘", "G"],
    run: groupSelection,
    available: selection,
  },
  {
    id: "ungroup",
    title: "Ungroup",
    group: "Object",
    icon: "group",
    keys: ["⇧", "⌘", "G"],
    run: ungroupSelection,
    available: ({ nodes }) => nodes.some((node) => isGroupLike(node) || isSequence(node)),
  },
  {
    id: "wrap-in-scene",
    title: "Wrap in scene",
    group: "Object",
    icon: "scene-frame-small",
    keys: ["⌘", "↩︎"],
    keywords: ["frame"],
    run: wrapSelectionInScene,
    available: selection,
  },
  {
    id: "wrap-in-sequence",
    title: "Wrap in sequence",
    group: "Object",
    icon: "timeline-sequence-small",
    keys: ["⌥", "⌘", "↩︎"],
    run: wrapSelectionInSequence,
    available: selection,
  },
  {
    id: "unwrap-sequence",
    title: "Unwrap sequence",
    group: "Object",
    icon: "timeline-sequence-small",
    keys: ["⌥", "⇧", "⌘", "↩︎"],
    run: unwrapSequenceSelection,
    available: ({ nodes }) => nodes.some(isSequence),
  },
  {
    id: "bring-to-front",
    title: "Bring to front",
    group: "Object",
    icon: "arrow-top",
    keys: ["]"],
    keywords: ["arrange", "order"],
    run: (world) => restackSelection(world, "front"),
    available: selection,
  },
  {
    id: "send-to-back",
    title: "Send to back",
    group: "Object",
    icon: "arrow-bottom",
    keys: ["["],
    keywords: ["arrange", "order"],
    run: (world) => restackSelection(world, "back"),
    available: selection,
  },
  {
    id: "toggle-hidden",
    title: "Toggle visibility",
    group: "Object",
    icon: "eye-on",
    keys: ["⇧", "⌘", "H"],
    keywords: ["hide", "show"],
    run: toggleSelectionHidden,
    available: selection,
  },
  {
    id: "toggle-playback",
    title: "Play or pause",
    group: "Timeline",
    icon: "play",
    keys: ["Space"],
    keywords: ["playback", "stop"],
    run: (world) => {
      const scene = getActiveEntity(world);
      if (scene) togglePlayback(world, scene);
    },
    available: activeScene,
  },
  {
    id: "split",
    title: "Split at playhead",
    group: "Timeline",
    icon: "split",
    keys: ["⌘", "B"],
    keywords: ["cut", "razor", "blade"],
    run: splitAtPlayhead,
    available: activeScene,
  },
  {
    id: "undo",
    title: "Undo",
    group: "Edit",
    icon: "undo",
    keys: ["⌘", "Z"],
    run: undoEdit,
    available: ({ history }) => history.canUndo(),
  },
  {
    id: "redo",
    title: "Redo",
    group: "Edit",
    icon: "redo",
    keys: ["⇧", "⌘", "Z"],
    run: redoEdit,
    available: ({ history }) => history.canRedo(),
  },
];

/** Every shortcut as a command, sharing one read of what they work on. */
export function ShortcutCommands() {
  const world = useWorld();
  const { nodes } = useSelection();
  const scene = useActiveScene();
  const history = getEditHistory(world);

  const state = (): ShortcutState => ({ nodes: nodes(), history, scene: scene() });

  return <For each={SHORTCUTS}>{(shortcut) => <ShortcutCommand shortcut={shortcut} state={state} />}</For>;
}

function ShortcutCommand(props: { shortcut: Shortcut; state: () => ShortcutState }) {
  const world = useWorld();
  const { shortcut } = props;

  useCommand({
    id: `shortcut:${shortcut.id}`,
    title: shortcut.title,
    group: shortcut.group,
    icon: shortcut.icon,
    keywords: shortcut.keywords,
    shortcut: shortcut.keys,
    available: shortcut.available ? () => shortcut.available!(props.state()) : undefined,
    run: () => shortcut.run(world),
  });

  return null;
}
