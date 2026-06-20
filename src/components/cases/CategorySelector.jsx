import React from "react";
import { Landmark, Shield, Home, Phone, Zap, HelpCircle, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { value: "banking", label: "Banking", description: "Transactions, chargebacks, fraud, hardship", icon: Landmark },
  { value: "insurance", label: "Insurance", description: "Claims, denials, delays, assessments", icon: Shield },
  { value: "tenancy", label: "Tenancy / NCAT", description: "Repairs, bonds, notices, rent disputes", icon: Home },
  { value: "telco", label: "Telecommunications", description: "Optus, Telstra, billing, contracts", icon: Phone },
  { value: "utilities", label: "Utilities", description: "Electricity, gas, billing, disconnection", icon: Zap },
  { value: "government", label: "Government Departments", description: "Centrelink, ATO, Services Australia", icon: Building2 },
  { value: "other", label: "Other", description: "General consumer dispute", icon: HelpCircle },
];

export default function CategorySelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {categories.map((cat, i) => {
        const isSelected = selected === cat.value;
        return (
          <motion.button
            key={cat.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(cat.value)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 bg-card"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
              isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              <cat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-sm text-foreground">{cat.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}