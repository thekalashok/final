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
    // Subscribe to live updates
    const unsubscribe = dataService.subscribe("CATEGORIES", (newCategories) => {
      // The subscribe method returns objects if it maps doc.data(), 
      // but getCategories returns string[]. 
      // Let's check how subscribe handles it.
      // In dataService.ts, subscribe maps doc.data() which for categories is { name: string }
      // So we need to map it to string[] here if it's objects.
      const catNames = newCategories.map((c: any) => typeof c === 'string' ? c : c.name);
      setCategories(catNames);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    const cat = newCategory.trim().toLowerCase();
    if (categories.includes(cat)) {
      toast.error("Category already exists");
      return;
    }
    await dataService.saveCategory(cat);
    setNewCategory("");
    onUpdate();
    toast.success("Category added");
  };

  const handleDelete = async (cat: string) => {
    await dataService.deleteCategory(cat);
    onUpdate();
    toast.success("Category removed");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <DialogHeader className="p-8 pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold font-display text-[#3a322b] flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-6 scrollbar-hide">
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

          <div className="flex flex-wrap gap-3 p-1">
            {categories.map((cat) => (
              <div 
                key={cat}
                className="flex items-center gap-2 bg-slate-100 text-[#3a322b] px-5 py-2.5 rounded-full text-sm font-bold group hover:bg-slate-200 transition-all shadow-sm"
              >
                <span className="capitalize">{cat}</span>
                <button 
                  onClick={() => handleDelete(cat)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 pt-4 border-t border-slate-50 flex justify-end flex-shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-2xl h-12 px-8 text-slate-500 font-bold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
