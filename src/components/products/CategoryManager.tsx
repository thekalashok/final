import { useState, useEffect } from "react";
import { Plus, X, Tag } from "lucide-react";
import { dataService } from "../../services/dataService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function CategoryManager({ open, onOpenChange, onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      if (open) {
        const cats = await dataService.getCategories();
        setCategories(cats);
      }
    };
    loadCategories();
  }, [open]);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    const cat = newCategory.trim().toLowerCase();
    if (categories.includes(cat)) {
      toast.error("Category already exists");
      return;
    }
    await dataService.saveCategory(cat);
    const updatedCats = await dataService.getCategories();
    setCategories(updatedCats);
    setNewCategory("");
    onUpdate();
    toast.success("Category added");
  };

  const handleDelete = async (cat: string) => {
    await dataService.deleteCategory(cat);
    const updatedCats = await dataService.getCategories();
    setCategories(updatedCats);
    onUpdate();
    toast.success("Category removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-[#3a322b] flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="New category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus-visible:ring-brand-500"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button 
              onClick={handleAdd}
              className="bg-[#3a322b] hover:bg-[#4a3f35] rounded-2xl h-12 px-5 text-white"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
            {categories.map((cat) => (
              <div 
                key={cat}
                className="flex items-center gap-2 bg-slate-100 text-[#3a322b] px-4 py-2 rounded-full text-sm font-medium group hover:bg-slate-200 transition-all"
              >
                <span className="capitalize">{cat}</span>
                <button 
                  onClick={() => handleDelete(cat)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-2xl h-12 px-8 text-slate-500"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
