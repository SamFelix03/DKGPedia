"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"

export type PromptSuggestionProps = {
  highlight?: string
  children: string
  className?: string
  onClick?: () => void
} & React.ComponentProps<typeof Button>

function PromptSuggestion({
  highlight,
  children,
  className,
  onClick,
  ...props
}: PromptSuggestionProps) {
  return (
    <Button
      className={cn(
        "bg-background hover:bg-accent border-input h-auto justify-start whitespace-normal rounded-2xl border px-4 py-3 text-left text-sm font-normal transition-colors w-full normal-case",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export { PromptSuggestion }

