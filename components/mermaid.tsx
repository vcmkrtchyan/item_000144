"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"

interface MermaidProps {
  chart: string
}

export default function Mermaid({ chart }: MermaidProps) {
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "neutral",
      securityLevel: "loose",
      themeVariables: {
        primaryColor: "#7c3aed",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#7c3aed",
        lineColor: "#7c3aed",
        secondaryColor: "#f3e8ff",
        tertiaryColor: "#f9fafb",
      },
    })

    const renderChart = async () => {
      if (chart) {
        try {
          setError(null)
          const { svg } = await mermaid.render("mermaid-svg", chart)
          setSvg(svg)
        } catch (err) {
          console.error("Mermaid rendering error:", err)
          setError("Failed to render chart")
        }
      }
    }

    renderChart()
  }, [chart])

  if (error) {
    return <div className="text-destructive p-4 text-center">{error}</div>
  }

  return (
    <div
      ref={mermaidRef}
      className="mermaid-chart w-full h-full flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

