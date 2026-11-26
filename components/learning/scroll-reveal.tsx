import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import styles from "./scroll-reveal.module.css"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: "div" | "span"
  subtle?: boolean
  animate?: boolean
}

export function ScrollReveal({ children, className = "", delay = 0, as: Element = "div", subtle = false, animate = true }: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !animate || typeof IntersectionObserver === "undefined") return

    if (subtle) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      const content = element.firstElementChild
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        element.dataset.reveal = "visible"
        observer.disconnect()
      })
      const clear = () => { delete element.dataset.reveal }
      function finish(event: Event) {
        if (event.target === content) clear()
      }
      function showOnFocus(event: FocusEvent) {
        if (!(event.target instanceof HTMLElement) || !(event.target.tabIndex >= 0 || event.target.matches("summary"))) return
        observer.disconnect()
        clear()
      }
      content?.addEventListener("animationend", finish)
      content?.addEventListener("animationcancel", finish)
      element.addEventListener("focusin", showOnFocus)
      observer.observe(element)
      return () => {
        observer.disconnect()
        content?.removeEventListener("animationend", finish)
        content?.removeEventListener("animationcancel", finish)
        element.removeEventListener("focusin", showOnFocus)
        clear()
      }
    }

    let exitTimer = 0
    let lastExit: "above" | "below" | undefined
    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(exitTimer)
      if (entry.isIntersecting) {
        if (lastExit === "above") delete element.dataset.reveal
        else element.dataset.reveal = "visible"
        return
      }

      // The stationary wrapper tells us which way the learner must scroll to see it again.
      const viewportTop = entry.rootBounds?.top ?? 0
      lastExit = entry.boundingClientRect.bottom <= viewportTop ? "above" : "below"
      // Ignore brief exits at the viewport edge so a small scroll reversal doesn't flash.
      exitTimer = window.setTimeout(() => { delete element.dataset.reveal }, 140)
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
      window.clearTimeout(exitTimer)
      delete element.dataset.reveal
    }
  }, [animate, subtle])

  return <Element ref={element => { ref.current = element }} className={`${styles.reveal}${subtle ? ` ${styles.subtle}` : ""}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
    <Element className={`${styles.content} ${className}`}>{children}</Element>
  </Element>
}
