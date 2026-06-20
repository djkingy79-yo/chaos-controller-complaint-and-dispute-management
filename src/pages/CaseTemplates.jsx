import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, Trash2, Copy, Loader2, Search, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CATEGORIES = ["banking", "insurance", "tenancy", "telco", "utilities", "government", "other"];

export default function CaseTemplates() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    description: "",
    template_data: "{}",
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["case-templates"],
    queryFn: () => base44.entities.CaseTemplate.filter({}),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CaseTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-templates"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Template created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CaseTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-templates"] });
      setDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast.success("Template updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CaseTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-templates"] });
      toast.success("Template deleted");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", category: "other", description: "", template_data: "{}" });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      description: template.description || "",
      template_data: JSON.stringify(template.template_data, null, 2),
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, template_data: JSON.parse(formData.template_data) };
      if (editingTemplate) {
        updateMutation.mutate({ id: editingTemplate.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      toast.error("Invalid JSON in template data: " + error.message);
    }
  };

  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Case Templates</h1>
            <p className="text-xs text-muted-foreground">Reusable templates for common dispute types</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Banking - Unauthorized Transaction"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="When to use this template..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template_data">Template Data (JSON)</Label>
                <Textarea
                  id="template_data"
                  value={formData.template_data}
                  onChange={(e) => setFormData({ ...formData, template_data: e.target.value })}
                  placeholder='{"organisation_name": "", "issue_summary": "", "desired_outcome": ""}'
                  rows={8}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  JSON object with case fields: title, organisation_name, issue_summary, issue_details, desired_outcome, etc.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="gap-2">
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="bg-muted/20 border border-dashed border-border rounded-xl p-10 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No templates found</p>
          <p className="text-xs text-muted-foreground">Create your first template to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <div key={template.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {template.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(template.id)}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}