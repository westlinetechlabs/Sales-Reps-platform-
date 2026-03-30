"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Briefcase, Trash2, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, getDealStageBadgeVariant } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  closeDate?: string | null;
  notes?: string | null;
  customer?: { id: string; name: string; company?: string | null } | null;
}

interface Customer {
  id: string;
  name: string;
  company?: string | null;
}

const STAGES = [
  { value: "PROSPECTING", label: "Prospecting", prob: 10 },
  { value: "QUALIFICATION", label: "Qualification", prob: 25 },
  { value: "PROPOSAL", label: "Proposal", prob: 50 },
  { value: "NEGOTIATION", label: "Negotiation", prob: 75 },
  { value: "CLOSED_WON", label: "Closed Won", prob: 100 },
  { value: "CLOSED_LOST", label: "Closed Lost", prob: 0 },
];

const emptyForm = {
  title: "",
  value: "",
  stage: "PROSPECTING",
  probability: "10",
  closeDate: "",
  notes: "",
  customerId: "",
};

export default function DealsPage() {
  const { data: session } = useSession();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stageFilter, setStageFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const user = session?.user as { role?: string } | undefined;

  const fetchDeals = useCallback(async () => {
    const res = await fetch("/api/deals");
    if (res.ok) setDeals(await res.json());
  }, []);

  useEffect(() => {
    fetchDeals();
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, [fetchDeals]);

  const filtered = stageFilter === "ALL" ? deals : deals.filter((d) => d.stage === stageFilter);

  const totalValue = filtered.reduce((s, d) => s + d.value, 0);
  const weightedValue = filtered.reduce((s, d) => s + d.value * (d.probability / 100), 0);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(d: Deal) {
    setForm({
      title: d.title,
      value: String(d.value),
      stage: d.stage,
      probability: String(d.probability),
      closeDate: d.closeDate ? d.closeDate.split("T")[0] : "",
      notes: d.notes || "",
      customerId: d.customer?.id || "",
    });
    setEditingId(d.id);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      value: parseFloat(form.value) || 0,
      probability: parseInt(form.probability) || 10,
      closeDate: form.closeDate || null,
      customerId: form.customerId || null,
    };

    const url = editingId ? `/api/deals/${editingId}` : "/api/deals";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      fetchDeals();
    }
    setLoading(false);
  }

  async function deleteDeal(id: string) {
    if (!confirm("Delete this deal?")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    fetchDeals();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} deals · ${totalValue.toLocaleString()} total</p>
        </div>
        {user?.role !== "OWNER" && (
          <Button onClick={openAdd}>
            <Plus size={16} /> Add Deal
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {STAGES.slice(0, 4).map((s) => {
          const count = deals.filter((d) => d.stage === s.value).length;
          const val = deals.filter((d) => d.stage === s.value).reduce((sum, d) => sum + d.value, 0);
          return (
            <div
              key={s.value}
              onClick={() => setStageFilter(stageFilter === s.value ? "ALL" : s.value)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                stageFilter === s.value ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
              <p className="text-xs text-gray-400">${val.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Weighted pipeline value */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-700">Weighted Pipeline Value</p>
          <p className="text-xs text-indigo-400">Probability-adjusted forecast</p>
        </div>
        <p className="text-2xl font-bold text-indigo-700">${weightedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No deals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Deal</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Stage</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Prob.</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Close Date</th>
                  {user?.role !== "OWNER" && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{d.title}</td>
                    <td className="px-6 py-4 text-gray-600">{d.customer?.company || d.customer?.name || "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getDealStageBadgeVariant(d.stage)}>
                        {d.stage.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ${d.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${d.probability >= 75 ? "text-green-600" : d.probability >= 50 ? "text-yellow-600" : "text-gray-500"}`}>
                        {d.probability}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {d.closeDate ? new Date(d.closeDate).toLocaleDateString() : "—"}
                    </td>
                    {user?.role !== "OWNER" && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteDeal(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Deal" : "Add Deal"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value ($) *</label>
              <input
                type="number"
                required
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => {
                  const stage = STAGES.find((s) => s.value === e.target.value);
                  setForm({ ...form, stage: e.target.value, probability: String(stage?.prob || 10) });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
              <input
                type="date"
                value={form.closeDate}
                onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>{editingId ? "Save Changes" : "Add Deal"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
