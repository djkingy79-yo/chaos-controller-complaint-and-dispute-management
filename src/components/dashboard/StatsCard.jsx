import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden bg-card rounded-2xl border-2 border-border p-6 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-1"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-bl-full" />
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className={`p-3 rounded-xl shadow-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <p className="text-5xl font-display font-black text-foreground leading-none">{value}</p>
        {subtitle && (
          <p className="text-sm font-bold text-foreground mt-2 opacity-70">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}