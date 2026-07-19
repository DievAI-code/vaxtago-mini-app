import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Pagination = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"nav">) => {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn(
        "mx-auto flex w-full justify-center",
        className
      )}
      {...props}
    >
      <ul className="flex items-center gap-1">
        <li>
          <Button
            variant="outline"
            size="sm"
            aria-label="Go to previous page"
            className="gap-1 pl-2.5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
        </li>
        <li>
          <Button
            variant="outline"
            size="sm"
            aria-label="Go to next page"
            className="gap-1 pr-2.5"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </nav>
  );
};

export { Pagination };
