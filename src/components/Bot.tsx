import { Bot as BotIcon } from "lucide-react";
import { ReactNode } from "react";

export function Bot({ className, size = 24 }: { className?: string; size?: number }): ReactNode {
  return <BotIcon className={className} size={size} />;
}
