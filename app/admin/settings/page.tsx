"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [name, setName] = useState("SwiftBite Restaurant");
  const [taxRate, setTaxRate] = useState("18");
  const [currency, setCurrency] = useState("Rs.");
  const [serviceCharge, setServiceCharge] = useState("0");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Restaurant Settings</h1>
        <p className="text-xs text-zinc-400">Configure global POS parameters, tax calculations, and receipt formatting</p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Restaurant settings updated successfully!</span>
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-400" />
            <span>General & Tax Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Restaurant Brand Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Sales Tax Rate (%)"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <Input
                label="Currency Symbol"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <Input
              label="Service Charge (%)"
              type="number"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
            />

            <div className="pt-4 flex justify-end">
              <Button type="submit" className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1">
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
