import * as React from "react";
import * as EmbaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    />
  )
);
Carousel.displayName = "Carousel";

export { Carousel };