/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { PromptInput } from "../genai/prompt-input";
import { CommandBar } from "../commands";
import { ObjectMaskBar } from "./object-mask-bar";
import { ClipPathBar } from "./clip-path-bar";
import { For, Match, Show, Switch, createEffect, createMemo, createSignal, on } from "solid-js";
import { Tool, ToolType } from "@diffusionstudio/runtime";
import { useWorld } from "@diffusionstudio/koota-solid";
import { cancelClipPath, cancelObjectMask, clearClipPathTarget, useTool } from "@/engine";
import { usePromptInput } from "@/context/prompt-input";
import { useCommands } from "@/context/commands";

const CURSOR_TOOLS = [
  { tool: ToolType.MOVE, label: 'Move', shortcut: 'V', icon: 'move', menuIcon: 'move-small' },
  { tool: ToolType.HAND, label: 'Hand', shortcut: 'H', icon: 'hand', menuIcon: 'hand' },
  { tool: ToolType.OBJECT_MASK, label: 'Object Mask', shortcut: 'M', icon: 'object-mask', menuIcon: 'object-mask' },
] as const;

const SHAPE_TOOLS = [
  { tool: ToolType.RECT, label: 'Rectangle', shortcut: 'R', icon: 'tool.rectangle', menuIcon: 'tool.rectangle-small' },
  { tool: ToolType.ELLIPSE, label: 'Ellipse', shortcut: 'O', icon: 'tool.ellipse', menuIcon: 'tool.ellipse-small' },
  { tool: ToolType.POLYGON, label: 'Polygon', shortcut: undefined, icon: 'tool.polygon', menuIcon: 'tool.polygon-small' },
] as const;

type ShapeTool = (typeof SHAPE_TOOLS)[number];

// The shape the toolbar offers: the one last picked, however it was picked.
// Outlives the toolbar, which unmounts with the canvas.
const [lastShapeTool, setLastShapeTool] = createSignal<ShapeTool>(SHAPE_TOOLS[0]);

export function Toolbar() {
  const world = useWorld();
  const { promptInputOpen, promptInputConfig, setPromptInputOpen } = usePromptInput();
  const commands = useCommands();
  const selectedTool = useTool();
  const cursorTool = createMemo(() => CURSOR_TOOLS.find((cursor) => cursor.tool === selectedTool()));
  const shapeTool = createMemo(() => SHAPE_TOOLS.find((shape) => shape.tool === selectedTool()));
  // Editing a path's vertices is the pen's other half, as in Figma.
  const penTool = () => selectedTool() === ToolType.PEN || selectedTool() === ToolType.PATH_EDIT;

  createEffect(() => {
    const shape = shapeTool();
    if (shape) setLastShapeTool(shape);
  });

  createEffect(() => {
    if (selectedTool() !== ToolType.CLIP_PATH) {
      clearClipPathTarget();
    }
  });

  // One bar over the canvas at a time, whichever came up last: a command's
  // bar puts down the prompt box and the tools that have bars of their own,
  // and either of those coming up takes the command's bar down.
  createEffect(on(commands.active, (command) => {
    if (!command) return;
    setPromptInputOpen(false);
    if (selectedTool() === ToolType.OBJECT_MASK) cancelObjectMask(world);
    if (selectedTool() === ToolType.CLIP_PATH) cancelClipPath(world);
  }));

  createEffect(on([promptInputOpen, selectedTool], ([open, tool]) => {
    if (open || tool === ToolType.OBJECT_MASK || tool === ToolType.CLIP_PATH) commands.close();
  }));

  const handleToolChange = (tool: ToolType) => {
    world.set(Tool, { value: tool });
  }

  return (
    <>
      <Show when={promptInputOpen()}>
        <PromptInput initialConfig={promptInputConfig()} />
      </Show>
      <Show when={!promptInputOpen()}>
        <Switch fallback={<CommandBar />}>
          <Match when={selectedTool() === ToolType.OBJECT_MASK}>
            <ObjectMaskBar />
          </Match>
          <Match when={selectedTool() === ToolType.CLIP_PATH}>
            <ClipPathBar />
          </Match>
        </Switch>
      </Show>
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl p-1.5 bg-background border border-border-strong flex gap-2 items-center z-10">
        <div class="flex gap-1">
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size="icon-square"
              class={cursorTool() ? 'text-foreground' : 'text-muted-foreground'}
              variant={cursorTool() ? 'default' : 'ghost'}
              onClick={() => handleToolChange(cursorTool()?.tool ?? ToolType.MOVE)}
            >
              <Icon name={(cursorTool() ?? CURSOR_TOOLS[0]!).icon} />
            </TooltipTrigger>
            <TooltipContent shortcut={(cursorTool() ?? CURSOR_TOOLS[0]!).shortcut}>
              {(cursorTool() ?? CURSOR_TOOLS[0]!).label}
            </TooltipContent>
          </Tooltip>
          <DropdownMenu placement="top-start">
            <Tooltip>
              <TooltipTrigger<typeof DropdownMenuTrigger>
                as={(triggerProps: object) => (
                  <DropdownMenuTrigger<typeof Button>
                    {...triggerProps}
                    as={(buttonProps) => (
                      <Button {...buttonProps} size="icon-select" variant="ghost" class="text-muted-foreground">
                        <Icon name="chevron-down" />
                      </Button>
                    )}
                  />
                )}
              />
              <TooltipContent>Select tool</TooltipContent>
            </Tooltip>
            <DropdownMenuPortal>
              <DropdownMenuContent>
                <For each={CURSOR_TOOLS}>
                  {(cursor) => (
                    <DropdownMenuItem class="px-0 pr-2 gap-0.5" onSelect={() => handleToolChange(cursor.tool)}>
                      <div classList={{ "visible": selectedTool() === cursor.tool }} class="invisible">
                        <Icon name="confirm-check" class="text-foreground" />
                      </div>
                      <Icon name={cursor.menuIcon} class="text-foreground" />
                      <span class="mx-1 flex-1 whitespace-nowrap">{cursor.label}</span>
                      <DropdownMenuShortcut class="pl-6">{cursor.shortcut}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  )}
                </For>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
        <Separator orientation="vertical" class="min-h-5" />
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon-square"
            variant={selectedTool() === ToolType.SCENE ? 'default' : 'ghost'}
            onClick={() => handleToolChange(ToolType.SCENE)}
            class={selectedTool() === ToolType.SCENE ? 'text-foreground' : 'text-muted-foreground'}
          >
            <Icon name="frame" class="size-5" />
          </TooltipTrigger>
          <TooltipContent shortcut="F">Frame</TooltipContent>
        </Tooltip>
        <div class="flex gap-1">
          <Tooltip>
            <TooltipTrigger
              as={Button}
              size="icon-square"
              variant={shapeTool() ? 'default' : 'ghost'}
              onClick={() => handleToolChange(lastShapeTool().tool)}
              class={shapeTool() ? 'text-foreground' : 'text-muted-foreground'}
            >
              <Icon name={lastShapeTool().icon} />
            </TooltipTrigger>
            <TooltipContent shortcut={lastShapeTool().shortcut}>{lastShapeTool().label}</TooltipContent>
          </Tooltip>
          <DropdownMenu placement="top-start">
            <Tooltip>
              <TooltipTrigger<typeof DropdownMenuTrigger>
                as={(triggerProps: object) => (
                  <DropdownMenuTrigger<typeof Button>
                    {...triggerProps}
                    as={(buttonProps) => (
                      <Button {...buttonProps} size="icon-select" variant="ghost" class="text-muted-foreground">
                        <Icon name="chevron-down" />
                      </Button>
                    )}
                  />
                )}
              />
              <TooltipContent>Shape tools</TooltipContent>
            </Tooltip>
            <DropdownMenuPortal>
              <DropdownMenuContent>
                <For each={SHAPE_TOOLS}>
                  {(shape) => (
                    <DropdownMenuItem class="px-0 pr-2 gap-0.5" onSelect={() => handleToolChange(shape.tool)}>
                      <div classList={{ "visible": selectedTool() === shape.tool }} class="invisible">
                        <Icon name="confirm-check" class="text-foreground" />
                      </div>
                      <Icon name={shape.menuIcon} class="text-foreground" />
                      <span class="mx-1 flex-1 whitespace-nowrap">{shape.label}</span>
                      <DropdownMenuShortcut class="pl-6">{shape.shortcut}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  )}
                </For>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon-square"
            variant={penTool() ? 'default' : 'ghost'}
            onClick={() => handleToolChange(ToolType.PEN)}
            class={penTool() ? 'text-foreground' : 'text-muted-foreground'}
          >
            <Icon name="tool.pen" />
          </TooltipTrigger>
          <TooltipContent shortcut="P">Pen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon-square"
            variant={selectedTool() === ToolType.TEXT ? 'default' : 'ghost'}
            onClick={() => handleToolChange(ToolType.TEXT)}
            class={selectedTool() === ToolType.TEXT ? 'text-foreground' : 'text-muted-foreground'}
          >
            <Icon name="tool.text" />
          </TooltipTrigger>
          <TooltipContent shortcut="T">Text</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon-square"
            class={promptInputOpen() ? 'text-foreground' : 'text-muted-foreground'}
            variant={promptInputOpen() ? 'default' : 'ghost'}
            onClick={() => setPromptInputOpen(!promptInputOpen())}
          >
            <Icon name="ai-generate" class="size-7" />
          </TooltipTrigger>
          <TooltipContent>AI generate</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" class="min-h-5" />
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size="icon-square"
            variant="ghost"
            class="text-muted-foreground"
            onClick={() => commands.setPaletteOpen(true)}
          >
            <Icon name="tool.actions-spotlight" />
          </TooltipTrigger>
          <TooltipContent shortcut="⌘K">Actions</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
