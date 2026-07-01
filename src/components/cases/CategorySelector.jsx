import React from "react";
import { Landmark, Shield, Home, Phone, Zap, HelpCircle, Building2, Scale } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { value: "banking", label: "Banking", description: "Transactions, chargebacks, fraud, hardship", icon: Landmark },
  { value: "insurance", label: "Insurance", description: "Claims, denials, delays, assessments", icon: Shield },
  { value: "tenancy", label: "Tenancy", description: "Repairs, bonds, notices — routed to your state tribunal", icon: Home },
  { value: "telco", label: "Telecommunications", description: "Optus, Telstra, billing, contracts", icon: Phone },
  { value: "utilities", label: "Utilities", description: "Electricity, gas, billing, disconnection", icon: Zap },
  { value: "government", label: "Government Departments", description: "Centrelink, ATO, Services Australia", icon: Building2 },
  { value: "legal_profession", label: "Legal Profession Complaint", description: "Solicitor conduct, costs disputes, law firm complaints", icon: Scale },
  { value: "other", label: "Other", description: "General consumer dispute", icon: HelpCircle },
];

export default function CategorySelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat, i) => {
        const isSelected = selected === cat.value;
        return (
          <motion.button
            key={cat.value}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(cat.value)}
            className={`relative overflow-hidden text-left p-6 rounded-2xl border-2 transition-all hover:-translate-y-1 ${
              isSelected
                ? "border-primary bg-primary/10 shadow-xl shadow-primary/20"
                : "border-border hover:border-primary/50 bg-card hover:shadow-lg"
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
              isSelected ? "bg-gradient-to-br from-primary to-secondary text-white shadow-lg" : "bg-secondary/50 text-foreground"
            }`}>
              <cat.icon className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-black text-lg text-foreground">{cat.label}</h3>
            <p className="text-sm text-muted-foreground font-bold mt-2 leading-relaxed">{cat.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}