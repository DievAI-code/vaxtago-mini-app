import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;
const AccordionItem = AccordionPrimitive.Item;
const AccordionTrigger = AccordionPrimitive.Header;
const AccordionContent = AccordionPrimitive.Content;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
