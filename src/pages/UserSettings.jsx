import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UserSettings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        // Email cannot be changed via updateMe - it's managed by auth system
      });
      toast.success("Profile updated successfully");
      updateUser();
    } catch (error) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Profile & Settings</h1>
          <p className="text-xs text-muted-foreground">Manage your account information</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-card rounded-xl border border-border p-6 max-w-2xl">
        <h2 className="font-heading font-semibold text-base text-foreground mb-4">Account Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={formData.email}
                  className="pl-9 bg-muted/50"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-9"
                  placeholder="+61 400 000 000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-9"
                  placeholder="Street, Suburb, State, Postcode"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Subscription Info */}
      <div className="bg-card rounded-xl border border-border p-6 max-w-2xl">
        <h2 className="font-heading font-semibold text-base text-foreground mb-4">Subscription</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Current Plan</p>
              <p className="text-xs text-muted-foreground">Manage your subscription and billing</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/payments"}>
              View Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card rounded-xl border border-border p-6 max-w-2xl">
        <h2 className="font-heading font-semibold text-base text-foreground mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive daily summaries and deadline reminders</p>
            </div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Calendar Sync</p>
              <p className="text-xs text-muted-foreground">Sync deadlines to Google Calendar</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/calendar-sync"}>
              Configure
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}