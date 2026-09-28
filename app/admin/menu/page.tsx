"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { 
  getPOSMenuItems, 
  getPOSCategories, 
  getPOSInventory, 
  getPOSMenuItemIngredients, 
  addPOSMenuItemIngredient, 
  deletePOSMenuItemIngredient, 
  POSMenuItem, 
  POSCategory, 
  POSInventoryItem, 
  POSMenuItemIngredient 
} from "@/lib/pos-data";
import { Search, Plus, Edit2, CheckCircle, XCircle, Tag, Layers, Trash2 } from "lucide-react";

export default function AdminMenuPage() {
  const [items, setItems] = useState<POSMenuItem[]>([]);
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [inventoryList, setInventoryList] = useState<POSInventoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Item State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("c1");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Recipe Modal State
  const [recipeMenuItem, setRecipeMenuItem] = useState<POSMenuItem | null>(null);
  const [ingredients, setIngredients] = useState<POSMenuItemIngredient[]>([]);
  const [selectedInvId, setSelectedInvId] = useState("");
  const [qtyRequired, setQtyRequired] = useState("");

  const refreshData = async () => {
    const [fetchedItems, fetchedCats, fetchedInv] = await Promise.all([
      getPOSMenuItems(),
      getPOSCategories(),
      getPOSInventory(),
    ]);
    setItems(fetchedItems);
    setCategories(fetchedCats);
    setInventoryList(fetchedInv);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleToggleAvailability = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, available: !i.available } : i)));
  };

  const handleAddItem = () => {
    if (!newName || !newPrice) return;
    const priceNum = parseInt(newPrice, 10);
    const categoryObj = categories.find(c => c.id === newCategory) || categories[0];
    
    const newItem: POSMenuItem = {
      id: `m_${Date.now()}`,
      category_id: newCategory,
      category_name: categoryObj?.name || "General",
      name: newName,
      description: newDesc || null,
      price: priceNum,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
      available: true,
      featured: false,
    };

    setItems([newItem, ...items]);
    setIsAddModalOpen(false);
    setNewName("");
    setNewPrice("");
    setNewDesc("");
  };

  const openRecipeModal = async (item: POSMenuItem) => {
    setRecipeMenuItem(item);
    const fetchedIngs = await getPOSMenuItemIngredients(item.id);
    setIngredients(fetchedIngs);
  };

  const handleAddIngredient = async () => {
    if (!recipeMenuItem || !selectedInvId || !qtyRequired) return;
    const qtyNum = parseFloat(qtyRequired);
    if (isNaN(qtyNum) || qtyNum <= 0) return;

    await addPOSMenuItemIngredient(recipeMenuItem.id, selectedInvId, qtyNum);
    const updated = await getPOSMenuItemIngredients(recipeMenuItem.id);
    setIngredients(updated);
    setSelectedInvId("");
    setQtyRequired("");
  };

  const handleDeleteIngredient = async (ingId: string) => {
    if (!recipeMenuItem) return;
    await deletePOSMenuItemIngredient(ingId);
    const updated = await getPOSMenuItemIngredients(recipeMenuItem.id);
    setIngredients(updated);
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === "All" || item.category_name === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Menu Management & Recipe Ingredients</h1>
          <p className="text-xs text-zinc-400">Configure menu categories, dish pricing, availability & auto-deduction recipes</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 font-bold text-xs flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Menu Item</span>
        </Button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div className="flex space-x-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === "All"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.name
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Menu Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="bg-zinc-900 border-zinc-800 overflow-hidden flex flex-col justify-between p-0">
            {item.image && (
              <div className="h-32 w-full relative overflow-hidden bg-zinc-950">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950/80 backdrop-blur-md text-orange-400 border border-zinc-800">
                  {item.category_name}
                </span>
              </div>
            )}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                  <span className="font-extrabold text-orange-400 text-sm">Rs. {item.price}</span>
                </div>
                {item.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{item.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`text-[11px] font-bold flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
                    item.available
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {item.available ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  <span>{item.available ? "Available" : "Unavailable"}</span>
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openRecipeModal(item)}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-[11px] font-bold flex items-center space-x-1"
                >
                  <Layers className="h-3 w-3 text-orange-400" />
                  <span>Recipe</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Menu Item Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Menu Item">
        <div className="space-y-4">
          <Input
            label="Item Name"
            placeholder="e.g. Chicken Karahi"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Price (Rs.)"
            type="number"
            placeholder="850"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Brief item description..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddItem} className="bg-orange-600 hover:bg-orange-500 font-bold">
              Save Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recipe / Ingredients Mapping Modal */}
      <Modal isOpen={!!recipeMenuItem} onClose={() => setRecipeMenuItem(null)} title={`Recipe Mapping - ${recipeMenuItem?.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Link raw inventory stock required for 1 serving of <span className="font-bold text-white">{recipeMenuItem?.name}</span>. Stock is automatically deducted when orders complete.
          </p>

          {/* Current Recipe List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {ingredients.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 text-xs">
                No inventory ingredients mapped to this dish yet.
              </div>
            ) : (
              ingredients.map((ing) => (
                <div key={ing.id} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{ing.inventory_name}</span>
                    <span className="text-zinc-500 ml-2">({ing.quantity_required} {ing.unit} per serving)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteIngredient(ing.id)}
                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Recipe Ingredient Form */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <p className="text-xs font-bold text-orange-400 uppercase">Add Ingredient to Recipe</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">Raw Stock Item</label>
                <select
                  value={selectedInvId}
                  onChange={(e) => setSelectedInvId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100"
                >
                  <option value="">-- Select Inventory --</option>
                  {inventoryList.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-bold">Qty per Serving</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.25"
                  value={qtyRequired}
                  onChange={(e) => setQtyRequired(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <Button
              size="sm"
              disabled={!selectedInvId || !qtyRequired}
              onClick={handleAddIngredient}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
            >
              Add Recipe Ingredient
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="ghost" onClick={() => setRecipeMenuItem(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
