"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Boxes,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  POSInventoryItem,
  addDailyInventoryBatch,
  getInventoryCostPerUnit,
} from "@/lib/pos-data";

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: POSInventoryItem[];
  onImportComplete: () => void;
}

interface ParsedStockRow {
  id: string;
  matchedInventoryId?: string;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  isMatched: boolean;
}

export function InventoryImportModal({
  isOpen,
  onClose,
  inventory,
  onImportComplete,
}: InventoryImportModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [parsedRows, setParsedRows] = useState<ParsedStockRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Match raw item name to existing inventory
  const matchItem = (
    rawName: string,
    rawUnit?: string,
    rawCost?: number
  ): ParsedStockRow => {
    const cleanName = rawName.trim();
    const cleanNorm = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const matched = inventory.find((i) => {
      const itemNorm = i.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        itemNorm === cleanNorm ||
        itemNorm.includes(cleanNorm) ||
        cleanNorm.includes(itemNorm)
      );
    });

    const unit = rawUnit?.trim() || matched?.unit || "pcs";
    const cost =
      rawCost !== undefined && !isNaN(rawCost) && rawCost > 0
        ? rawCost
        : getInventoryCostPerUnit(matched);

    return {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchedInventoryId: matched?.id,
      name: matched?.name || cleanName,
      quantity: 1,
      unit,
      cost_per_unit: cost,
      isMatched: !!matched,
    };
  };

  // Handle Excel / CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage({ type: "info", text: `Reading ${file.name}...` });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse sheet to JSON array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawJson || rawJson.length < 2) {
          setStatusMessage({
            type: "error",
            text: "The uploaded file is empty or does not contain data rows.",
          });
          return;
        }

        // Detect column indices from header row
        const headers: string[] = (rawJson[0] || []).map((h: any) =>
          String(h).trim().toLowerCase()
        );

        let nameIdx = headers.findIndex(
          (h) => h.includes("item") || h.includes("name") || h.includes("ingredient")
        );
        let qtyIdx = headers.findIndex(
          (h) => h.includes("qty") || h.includes("quantity") || h.includes("add")
        );
        let unitIdx = headers.findIndex(
          (h) => h.includes("unit") || h.includes("measure")
        );
        let costIdx = headers.findIndex(
          (h) => h.includes("cost") || h.includes("price") || h.includes("rate")
        );

        // Fallbacks if headers are generic
        if (nameIdx === -1) nameIdx = 0;
        if (qtyIdx === -1) qtyIdx = 1;
        if (unitIdx === -1) unitIdx = 2;
        if (costIdx === -1) costIdx = 3;

        const rows: ParsedStockRow[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || !row[nameIdx]) continue;

          const rawItemName = String(row[nameIdx]).trim();
          const parsedQty = parseFloat(String(row[qtyIdx] || "0").replace(/[^0-9.]/g, ""));
          const rawItemUnit = row[unitIdx] ? String(row[unitIdx]).trim() : undefined;
          const rawItemCost = row[costIdx]
            ? parseFloat(String(row[costIdx]).replace(/[^0-9.]/g, ""))
            : undefined;

          if (rawItemName && !isNaN(parsedQty) && parsedQty > 0) {
            const parsed = matchItem(rawItemName, rawItemUnit, rawItemCost);
            parsed.quantity = parsedQty;
            rows.push(parsed);
          }
        }

        if (rows.length === 0) {
          setStatusMessage({
            type: "error",
            text: "No valid inventory rows found. Please check columns format.",
          });
          return;
        }

        setParsedRows(rows);
        setStatusMessage({
          type: "success",
          text: `Successfully parsed ${rows.length} items from ${file.name}. Review below.`,
        });
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: `Error reading spreadsheet: ${err.message || "Invalid file format"}`,
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle Quick Text / Paste Parsing
  const handleParseText = () => {
    if (!rawText.trim()) {
      setStatusMessage({ type: "error", text: "Please enter text to parse." });
      return;
    }

    const lines = rawText.split(/\r?\n/);
    const rows: ParsedStockRow[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let name = "";
      let qty = 0;
      let unit = "pcs";
      let cost: number | undefined = undefined;

      // Format 1: Tab-separated or Comma-separated (e.g. "Burger Bun, 100, pcs, 25")
      if (line.includes("\t") || line.includes(",")) {
        const parts = line.split(line.includes("\t") ? "\t" : ",");
        name = parts[0]?.trim();
        qty = parseFloat((parts[1] || "").replace(/[^0-9.]/g, "")) || 0;
        unit = parts[2]?.trim() || "pcs";
        cost = parts[3] ? parseFloat(parts[3].replace(/[^0-9.]/g, "")) : undefined;
      }
      // Format 2: Colon separated (e.g. "Burger Buns: 100" or "Chicken: 25kg")
      else if (line.includes(":")) {
        const parts = line.split(":");
        name = parts[0]?.trim();
        const remainder = parts[1]?.trim() || "";
        const numMatch = remainder.match(/([0-9.]+)\s*([a-zA-Z]*)/);
        if (numMatch) {
          qty = parseFloat(numMatch[1]) || 0;
          if (numMatch[2]) unit = numMatch[2];
        }
      }
      // Format 3: Simple trailing number (e.g. "Burger Buns 100")
      else {
        const match = line.match(/^(.*?)\s+([0-9.]+)\s*([a-zA-Z]*)$/);
        if (match) {
          name = match[1]?.trim();
          qty = parseFloat(match[2]) || 0;
          if (match[3]) unit = match[3];
        } else {
          name = line;
          qty = 1;
        }
      }

      if (name && qty > 0) {
        const item = matchItem(name, unit, cost);
        item.quantity = qty;
        rows.push(item);
      }
    }

    if (rows.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Could not parse any valid items. Use format: Item: Quantity (e.g. 'Burger Buns: 100').",
      });
      return;
    }

    setParsedRows(rows);
    setStatusMessage({
      type: "success",
      text: `Parsed ${rows.length} items from text. Review below and confirm.`,
    });
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    // Generate sample data using current inventory
    const sampleData = [
      ["Item Name", "Quantity Added", "Unit", "Cost Per Unit (Rs.)"],
      ["Burger bun (BUN)", 100, "pcs", 25],
      ["Ready-made chicken patty (CHK_PATTY)", 60, "pcs", 85],
      ["Chicken boneless raw (CHK_RAW)", 5000, "g", 0.75],
      ["Cheddar cheese slice (CHEDDAR)", 80, "pcs", 30],
      ["French fries frozen (FRIES_FROZ)", 6000, "g", 0.35],
      ["Pizza dough (DOUGH)", 40, "pcs", 50],
      ["Mayonnaise (MAYO)", 2000, "g", 0.35],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

    // Set nice column widths
    worksheet["!cols"] = [
      { wch: 40 }, // Item Name
      { wch: 18 }, // Quantity Added
      { wch: 12 }, // Unit
      { wch: 22 }, // Cost Per Unit
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DailyStockTemplate");

    XLSX.writeFile(workbook, "swiftbite-daily-inventory-template.xlsx");
  };

  // Remove a row from parsed table
  const handleRemoveRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update a row in parsed table
  const handleUpdateRow = (id: string, field: keyof ParsedStockRow, value: any) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Add an empty manual row to preview table
  const handleAddManualRow = () => {
    setParsedRows((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}`,
        name: "",
        quantity: 1,
        unit: "pcs",
        cost_per_unit: 25,
        isMatched: false,
      },
    ]);
  };

  // Confirm and commit batch addition
  const handleCommit = async () => {
    const validRows = parsedRows.filter((r) => r.name.trim() && r.quantity > 0);
    if (validRows.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Please add at least one valid item with positive quantity.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sourceNote = fileName
        ? `Daily File Import: ${fileName}`
        : "Daily Manual/Text Import";

      const entries = validRows.map((r) => ({
        inventory_id: r.matchedInventoryId,
        name: r.name,
        quantity: r.quantity,
        unit: r.unit,
        cost_per_unit: r.cost_per_unit,
      }));

      const res = await addDailyInventoryBatch(entries, sourceNote);

      setStatusMessage({
        type: "success",
        text: `Success! Added ${res.addedCount} inventory items totaling Rs. ${res.totalValue.toLocaleString()}. Stock updated.`,
      });

      // Clear table after 1 second and trigger parent refresh
      setTimeout(() => {
        setIsSubmitting(false);
        setParsedRows([]);
        setFileName("");
        setRawText("");
        onImportComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setStatusMessage({
        type: "error",
        text: `Error committing stock: ${err.message || "Failed to save stock"}`,
      });
    }
  };

  const totalValue = parsedRows.reduce(
    (sum, r) => sum + (r.quantity || 0) * (r.cost_per_unit || 0),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Inventory Stock Ingestion"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <p className="text-sm text-zinc-400">
            Upload vendor invoices or paste daily received inventory. Stock additions will be automatically tracked in daily/monthly Profit & Loss.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 shrink-0 font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Excel Template
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === "file"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload File (Excel / CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === "text"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quick Text / WhatsApp Paste</span>
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-sm flex items-start space-x-2 border ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : statusMessage.type === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-blue-500/10 border-blue-500/30 text-blue-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
            )}
            <span className="flex-1 font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: File Upload */}
        {activeTab === "file" && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-orange-500/70 rounded-2xl p-8 text-center bg-zinc-950/60 hover:bg-zinc-950 cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="h-14 w-14 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-white font-bold text-base">
                Click to browse or drag & drop Excel / CSV file
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports .xlsx, .xls, and .csv with columns: Item Name, Quantity Added, Unit, Cost/Unit
              </p>
              {fileName && (
                <div className="mt-3 inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Quick Text Paste */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Paste items line by line from notes or message:</span>
              <span className="text-zinc-500">
                Examples: <code>Burger Buns: 100</code> or <code>Chicken, 25, kg, 750</code>
              </span>
            </div>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Burger Buns: 100\nReady-made chicken patty: 50\nChicken boneless raw: 5000\nCheddar cheese: 80`}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-hidden focus:border-orange-500 font-mono"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleParseText}
                className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Parse Items
              </Button>
            </div>
          </div>
        )}

        {/* Verification Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  Items to Ingest ({parsedRows.length})
                </span>
                <span className="text-xs text-zinc-400">
                  &bull; Total Batch Value:{" "}
                  <strong className="text-orange-400 font-mono">
                    Rs. {Math.round(totalValue).toLocaleString()}
                  </strong>
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddManualRow}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 sticky top-0 text-zinc-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 w-28">Quantity</th>
                    <th className="py-2.5 px-3 w-20">Unit</th>
                    <th className="py-2.5 px-3 w-28">Cost / Unit</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {parsedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-900/40">
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) =>
                              handleUpdateRow(row.id, "name", e.target.value)
                            }
                            className="bg-transparent border-0 text-white font-medium focus:ring-0 p-0 w-full"
                          />
                          {row.isMatched ? (
                            <span className="shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Matched
                            </span>
                          ) : (
                            <span className="shrink-0 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              New Item
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.quantity}
                          onChange={(e) =>
                            handleUpdateRow(
                              row.id,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white font-mono text-xs focus:border-orange-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) =>
                            handleUpdateRow(row.id, "unit", e.target.value)
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs focus:border-orange-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.cost_per_unit}
                          onChange={(e) =>
                            handleUpdateRow(
                              row.id,
                              "cost_per_unit",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-orange-400 font-mono text-xs focus:border-orange-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white">
                        Rs.{" "}
                        {Math.round(
                          (row.quantity || 0) * (row.cost_per_unit || 0)
                        ).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            {parsedRows.length > 0 && (
              <span>
                Ready to add{" "}
                <strong className="text-white">{parsedRows.length} items</strong>{" "}
                totaling{" "}
                <strong className="text-emerald-400">
                  Rs. {Math.round(totalValue).toLocaleString()}
                </strong>
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommit}
              disabled={isSubmitting || parsedRows.length === 0}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black rounded-xl px-5 shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-all"
            >
              {isSubmitting ? (
                <span>Adding to Stock...</span>
              ) : (
                <span>Confirm & Add to Stock</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
