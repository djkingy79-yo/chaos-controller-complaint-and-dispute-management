import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X, Check, Building2, Mail, Phone, MapPin, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["banking", "insurance", "tenancy", "telco", "utilities", "other"];

const CATEGORY_COLORS = {
  banking: "bg-red-500/10 text-red-600",
  insurance: "bg-purple-500/10 text-purple-600",
  tenancy: "bg-blue-500/10 text-blue-600",
  telco: "bg-orange-500/10 text-orange-600",
  utilities: "bg-yellow-500/10 text-yellow-700",
  other: "bg-gray-500/10 text-gray-600",
};

const emptyForm = { name: "", category: "", complaints_address: "", complaints_email: "", complaints_phone: "", complaint_handler_name: "", notes: "" };

function OrgForm({ initial = emptyForm, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1 block">Organisation Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Commonwealth Bank" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Complaints Phone</Label>
          <Input value={form.complaints_phone} onChange={(e) => set("complaints_phone", e.target.value)} placeholder="e.g. 1300 555 000" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1 block">Complaints Email</Label>
          <Input value={form.complaints_email} onChange={(e) => set("complaints_email", e.target.value)} placeholder="e.g. complaints@bank.com.au" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1 block">Complaints Postal Address</Label>
          <Input value={form.complaints_address} onChange={(e) => set("complaints_address", e.target.value)} placeholder="e.g. GPO Box 9916, Sydney NSW 2001" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1 block">Complaint Handler Name</Label>
          <Input value={form.complaint_handler_name} onChange={(e) => set("complaint_handler_name", e.target.value)} placeholder="e.g. John Smith — Customer Relations" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1 block">Notes</Label>
          <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any extra details..." />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
        <Button size="sm" disabled={!form.name.trim() || saving} onClick={() => onSave(form)} className="gap-1">
          <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function OrgCard({ org, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm text-foreground truncate">{org.name}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {org.category && (
            <Badge variant="outline" className={`text-xs capitalize ${CATEGORY_COLORS[org.category] || ""}`}>{org.category}</Badge>
          )}
          <button onClick={() => onEdit(org)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(org.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {org.complaints_phone && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <Phone className="w-3 h-3 text-primary shrink-0" /><span>{org.complaints_phone}</span>
          </div>
        )}
        {org.complaints_email && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <Mail className="w-3 h-3 text-primary shrink-0" />
            <a href={`mailto:${org.complaints_email}`} className="hover:text-primary truncate">{org.complaints_email}</a>
          </div>
        )}
        {org.complaints_address && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <MapPin className="w-3 h-3 text-primary shrink-0" /><span className="truncate">{org.complaints_address}</span>
          </div>
        )}
        {org.complaint_handler_name && (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <User className="w-3 h-3 text-primary shrink-0" /><span>{org.complaint_handler_name}</span>
          </div>
        )}
        {org.notes && <p className="text-xs text-muted-foreground italic mt-1">{org.notes}</p>}
      </div>
    </motion.div>
  );
}

export default function MyOrganisations({ search = "" }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["organisations"],
    queryFn: () => base44.entities.Organisation.list("-created_date"),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Organisation.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organisations"] }); setShowAdd(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organisation.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organisations"] }); setEditingOrg(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Organisation.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisations"] }),
  });

  const filtered = orgs.filter((o) =>
    !search ||
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.category?.toLowerCase().includes(search.toLowerCase()) ||
    o.complaints_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {!showAdd && !editingOrg && (
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Organisation
        </Button>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OrgForm onSave={(data) => createMut.mutate(data)} onCancel={() => setShowAdd(false)} saving={createMut.isPending} />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && filtered.length === 0 && !showAdd && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? `No organisations match "${search}"` : "No saved organisations yet. Add one to get started."}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {filtered.map((org) =>
            editingOrg?.id === org.id ? (
              <motion.div key={org.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sm:col-span-2">
                <OrgForm
                  initial={editingOrg}
                  onSave={(data) => updateMut.mutate({ id: org.id, data })}
                  onCancel={() => setEditingOrg(null)}
                  saving={updateMut.isPending}
                />
              </motion.div>
            ) : (
              <OrgCard key={org.id} org={org} onEdit={setEditingOrg} onDelete={(id) => deleteMut.mutate(id)} />
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}