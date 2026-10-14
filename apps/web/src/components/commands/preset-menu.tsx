/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuItemDetail,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { keepMenuEscape } from "@/components/canvas/action-bar";

export type Preset = {
  id: string;
  name: string;
  /** What it comes out as, at the row's end: "1080p", "1920×1080". */
  detail?: string;
};

export type PresetGroup = { label: string; presets: Preset[] };

type PresetMenuProps = {
  groups: PresetGroup[];
  value: string;
  onChange(id: string): void;
  /** What the presets set, on hover. */
  tooltip: string;
};

/** A bar's preset picker: the pick on the button, the presets by group in its menu. */
export function PresetMenu(props: PresetMenuProps) {
  const selected = () =>
    props.groups.flatMap((group) => group.presets).find((preset) => preset.id === props.value);

  return (
    <DropdownMenu placement="top-start" gutter={8}>
      <Tooltip>
        <TooltipTrigger<typeof DropdownMenuTrigger>
          as={(triggerProps: object) => (
            <DropdownMenuTrigger<typeof Button>
              {...triggerProps}
              as={(buttonProps) => (
                <Button {...buttonProps} variant="ghost" class="gap-1 pr-0.5 text-muted-foreground">
                  <span class="text-foreground">{selected()?.name}</span>
                  {selected()?.detail}
                  <Icon name="chevron-down" />
                </Button>
              )}
            />
          )}
        />
        <TooltipContent>{props.tooltip}</TooltipContent>
      </Tooltip>
      <DropdownMenuPortal>
        <DropdownMenuContent class="min-w-60" onEscapeKeyDown={keepMenuEscape}>
          <For each={props.groups}>
            {(group, index) => (
              <>
                <Show when={index() > 0}>
                  <DropdownMenuSeparator />
                </Show>
                <DropdownMenuGroup>
                  <DropdownMenuGroupLabel>{group.label}</DropdownMenuGroupLabel>
                  <For each={group.presets}>
                    {(preset) => (
                      <DropdownMenuItem class="px-0 pr-2 gap-0.5" onSelect={() => props.onChange(preset.id)}>
                        <div classList={{ visible: preset.id === props.value }} class="invisible">
                          <Icon name="confirm-check" class="text-foreground" />
                        </div>
                        <span class="mx-1 min-w-0 flex-1 truncate">{preset.name}</span>
                        <Show when={preset.detail}>
                          <DropdownMenuItemDetail class="pl-6 whitespace-nowrap">{preset.detail}</DropdownMenuItemDetail>
                        </Show>
                      </DropdownMenuItem>
                    )}
                  </For>
                </DropdownMenuGroup>
              </>
            )}
          </For>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
