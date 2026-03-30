"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Target, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TargetData {
  id?: string;
  month: number;
  year: number;
  revenue: number;
  deals: number;
  calls: number;
  meetings: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function TargetsPage() {
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [target, setTarget] = useState<TargetData>({
    month,
    year,
    revenue: 0,
    deals: 0,
    calls: 0,
    meetings: 0,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTarget = useCallback(async () => {
    const res = await fetch(`/api/targets`);
    if (res.ok) {
      const targets: TargetData[] = await res.json();
      const found = targets.find((t) => t.month === month && t.year === year);
      if (found) {
        setTarget(found);
      } else {
        setTarget({ month, year, revenue: 0, deals: 0, calls: 0, meetings: 0 });
      }
    }
  }, [month, year]);

  useEffect(() => {
    fetchTarget();
  }, [fetchTarget]);

  async function handleSave() {
    setLoading(true);
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...target, month, year }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      fetchTarget();
    }
    setLoading(false);
  }

  if (user?.role === "OWNER") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center py-16 text-gray-400">
          <Target size={40} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">Targets are set by individual sales reps</p>
          <p className="text-sm mt-1">View rep dashboards to see their targets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Targets</h1>
        <p className="text-gray-500 text-sm mt-0.5">Set your goals for each month</p>
      </div>

      {/* Month selector */}
      <div className="flex gap-3 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Targets for {MONTHS[month - 1]} {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { key: "revenue", label: "Revenue Target ($)", icon: "$", desc: "Total revenue goal for the month", placeholder: "e.g. 50000" },
              { key: "deals", label: "Deals to Close", icon: "#", desc: "Number of deals you aim to close", placeholder: "e.g. 5" },
              { key: "calls", label: "Calls to Make", icon: "☎", desc: "Number of customer calls to log", placeholder: "e.g. 40" },
              { key: "meetings", label: "Meetings to Hold", icon: "👥", desc: "Number of meetings/demos to run", placeholder: "e.g. 10" },
            ].map((field) => (
              <div key={field.key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{field.icon}</span>
                  <label className="font-medium text-gray-900 text-sm">{field.label}</label>
                </div>
                <p className="text-xs text-gray-400 mb-3">{field.desc}</p>
                <input
                  type="number"
                  min="0"
                  value={target[field.key as keyof TargetData] || ""}
                  onChange={(e) =>
                    setTarget((prev) => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={handleSave} loading={loading}>
              <Save size={15} /> Save Targets
            </Button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
