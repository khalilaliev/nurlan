"use client";

import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Shared variants reused everywhere a card needs staggered entrance + hover
// lift + tap press. Exported so other components can compose without
// duplicating timing values.
export const cardGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AnimatedCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={cardGridVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({
  children,
  className,
  interactive = true,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  // Hover/tap micro-interactions only apply when the card is meant to be
  // interactive; static cards just animate in.
  const interactionProps = interactive
    ? {
        whileHover: { y: -4, scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { type: "spring" as const, stiffness: 300, damping: 22 },
      }
    : {};

  return (
    <motion.div variants={cardItemVariants} {...interactionProps}>
      <Card
        className={cn(
          // Don't apply CSS transitions here — framer-motion drives the
          // transform. CSS transforms competing with the spring is what
          // was making the previous /account animations stutter.
          "h-full",
          className,
        )}
      >
        {children}
      </Card>
    </motion.div>
  );
}
