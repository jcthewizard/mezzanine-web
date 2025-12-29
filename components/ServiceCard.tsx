"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
}

export default function ServiceCard({
  title,
  description,
  icon: Icon,
  index,
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group p-8 lg:p-10 border border-border hover:border-red/30 transition-all duration-500 bg-white"
    >
      {/* Icon */}
      <div className="mb-8">
        <Icon
          size={28}
          strokeWidth={1.5}
          className="text-red"
        />
      </div>

      {/* Title */}
      <h3 className="font-serif text-2xl text-charcoal mb-4">
        {title}
      </h3>

      {/* Description */}
      <p className="text-slate leading-relaxed">
        {description}
      </p>

      {/* Subtle hover indicator */}
      <div className="mt-8 h-px w-0 bg-red group-hover:w-12 transition-all duration-500" />
    </motion.div>
  );
}
