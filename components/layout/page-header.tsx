"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between"
    >
      <div className="grid gap-2">
        <h1 className="text-4xl font-semibold leading-tight tablet:text-5xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground tablet:text-base">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </motion.div>
  );
}
