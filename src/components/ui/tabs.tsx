
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base flex layout with wrap - grid classes in className will override this
      "flex flex-wrap items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full gap-1",
      // Ensure proper vertical centering - use consistent padding and alignment
      "h-auto min-h-10 py-0.5",
      // Smooth horizontal scroll with custom scrollbar (only when content overflows)
      "overflow-x-auto overflow-y-hidden scroll-smooth",
      // Custom scrollbar styling for better UX
      "[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1",
      "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
      "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50",
      "[&::-webkit-scrollbar-track]:bg-transparent",
      // Tailwind merge will handle grid override automatically
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Perfect vertical and horizontal centering
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium",
      // Ensure consistent height and alignment
      "h-8 min-h-8 self-center",
      // Styling
      "ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "flex-shrink-0",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
