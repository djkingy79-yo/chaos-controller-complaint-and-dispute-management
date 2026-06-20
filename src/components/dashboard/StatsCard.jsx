import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-foreground">{title}</p>
          <p className="text-3xl font-display font-black mt-1 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-foreground mt-1 font-black">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}