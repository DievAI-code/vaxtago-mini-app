import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const Menubar = MenubarPrimitive.Root;
const MenubarTrigger = MenubarPrimitive.Trigger;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarPortal = MenubarPrimitive.Portal;
const MenubarSub = MenubarPrimitive.Sub;
const MenubarRadioGroup = MenubarPrimitive.RadioGroup;
const MenubarSubTrigger = MenubarPrimitive.SubTrigger;
const MenubarSubContent = MenubarPrimitive.SubContent;
const MenubarContent = MenubarPrimitive.Content;
const MenubarItem = MenubarPrimitive.Item;
const MenubarCheckboxItem = MenubarPrimitive.CheckboxItem;
const MenubarRadioItem = MenubarPrimitive.RadioItem;
const MenubarLabel = MenubarPrimitive.Label;
const MenubarSeparator = MenubarPrimitive.Separator;

export { Menubar, MenubarTrigger, MenubarGroup, MenubarPortal, MenubarSub, MenubarRadioGroup, MenubarSubTrigger, MenubarSubContent, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarLabel, MenubarSeparator };