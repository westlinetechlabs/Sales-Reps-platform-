"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Activity, Phone, Mail, Calendar, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  duration?: number | null;
  outcome?: string | null;
  customer?: { id: string; name: string; company?: string | null } | null;
  rep?: { id: string; name: string } | null;
}

interface Customer {
  id: string;
  name: string;
  company?: string | null;
}

const ACTIVITY_TYPES = ["CALL", "MEETING", "EMAIL", "DEMO", "VISIT"];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  CALL: { icon: <Phone size={15} />, color: "text-green-700", bg: "bg-green-100" },
  MEETING: { icon: <Calendar size={15} />, color: "text-purple-700", bg: "bg-purple-100" },
  EMAIL: { icon: <Mail size={15} />, color: "text-blue-700", bg: "bg-blue-100" },
  DEMO: { icon: <Activity size={15} />, color: "text-orange-700", bg: "bg-orange-100" },
  VISIT: { icon: <Users size={15} />, color: "text-pink-700", bg: "bg-pink-100" },
};

const emptyForm = {
  type: "CALL",
  title: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  duration: "",
  outcome: "",
  customerId: "",
};

export default function ActivitiesPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const user = session?.user as { role?: string } | undefined;

  const fetchActivities = useCallback(async () => {
    const res = await fetch("/api/activities");
    if (res.ok) setActivities(await res.json());
  }, []);

  useEffect(() => {
    fetchActivities();
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, [fetchActivities]);

  const filtered = typeFilter === "ALL" ? activities : activities.filter((a) => a.type === typeFilter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      duration: form.duration ? parseInt(form.duration) : null,
      customerId: form.customerId || null,
    };

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      setForm(emptyForm);
      fetchActivities();
    }
    setLoading(false);
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete this activity?")) return;
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    fetchActivities();
  }

  // Group activities by date
  const grouped = filtered.reduce((acc: Record<string, ActivityItem[]>, a) => {
    const date = new Date(a.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} activities logged</p>
        </div>
        {user?.role !== "OWNER" && (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Log Activity
          </Button>
        )}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["ALL", ...ACTIVITY_TYPES].map((t) => {
          const cfg = TYPE_CONFIG[t];
          const count = t === "ALL" ? activities.length : activities.filter((a) => a.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter === t
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cfg && <span className={typeFilter === t ? "text-white" : cfg.color}>{cfg.icon}</span>}
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
              <span className={`text-xs ml-0.5 ${typeFilter === t ? "text-blue-100" : "text-gray-400"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Activities timeline */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <div className="text-center py-16 text-gray-400">
            <Activity size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No activities yet</p>
            {user?.role !== "OWNER" && <p className="text-sm mt-1">Click "Log Activity" to record your first activity</p>}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-gray-50 py-1">{date}</h3>
              <Card>
                <div className="divide-y divide-gray-50">
                  {items.map((a) => {
                    const cfg = TYPE_CONFIG[a.type] || { icon: <Activity size={15} />, color: "text-gray-600", bg: "bg-gray-100" };
                    return (
                      <div key={a.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900">{a.title}</p>
                              {a.customer && (
                                <p className="text-sm text-gray-500">
                                  {a.customer.company || a.customer.name}
                                </p>
                              )}
                              {a.description && (
                                <p className="text-sm text-gray-400 mt-1">{a.description}</p>
                              )}
                              {a.outcome && (
                                <p className="text-sm text-green-600 mt-1 font-medium">✓ {a.outcome}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {a.rep && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                  {a.rep.name}
                                </span>
                              )}
                              {a.duration && (
                                <span className="text-xs text-gray-400">{a.duration}m</span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(a.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {user?.role !== "OWNER" && (
                                <button
                                  onClick={() => deleteActivity(a.id)}
                                  className="p-1 text-gray-300 hover:text-red-500 rounded"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Activity">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={`e.g. ${form.type === "CALL" ? "Discovery call with John" : form.type === "MEETING" ? "Product demo meeting" : "Follow-up email"}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— No customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <input
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                placeholder="e.g. Interested, follow up next week"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Log Activity</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
