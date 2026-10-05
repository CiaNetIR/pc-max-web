"use client";

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { springFluid, whileTapPress } from "@/components/pcmax/ui/motion";

/* ------------------------------ Section shell ----------------------- */

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative w-full scroll-mt-24 py-20 sm:py-28 lg:py-36", className)}>
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/* ------------------------------ Section heading --------------------- */

export function SectionHeading({
  eyebrow,
  title,
  desc,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-3xl sm:mb-14",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={springFluid}
        className={cn(
          "type-eyebrow mb-4 inline-flex items-center gap-2.5 text-xs font-semibold uppercase text-crimson",
          align === "center" && "justify-center"
        )}
      >
        <span className="inline-block h-px w-8 bg-crimson/70" aria-hidden="true" />
        {eyebrow}
        {align === "center" && <span className="inline-block h-px w-8 bg-crimson/70" aria-hidden="true" />}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={{ ...springFluid, delay: 0.05 }}
        className="type-display font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
      {desc && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
          transition={{ ...springFluid, delay: 0.1 }}
          className={cn("type-lead mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg", align === "center" && "mx-auto")}
        >
          {desc}
        </motion.p>
      )}
    </div>
  );
}

/* ------------------------------ Magnetic button --------------------- */

export function MagneticButton({
  children,
  variant = "default",
  size = "lg",
  className,
  strength = 14,
  ...props
}: React.ComponentProps<typeof Button> & { strength?: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 300, damping: 22, mass: 0.6 });
  const reduce = useReducedMotion();

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength * 0.7);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div style={{ x: sx, y: sy }} className="inline-flex" whileTap={reduce ? undefined : whileTapPress}>
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}

/* ------------------------------ Reveal ------------------------------- */

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -60px 0px" }}
      transition={{ ...springFluid, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ Counter ----------------------------- */

export { AnimatedCounter } from "./animated-counter";
