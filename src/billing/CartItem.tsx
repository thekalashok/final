import { Minus, Plus, Trash2 } from "lucide-react";
import { LineItem } from "../types";
import { Button } from "../components/ui/button";

interface CartItemProps {
  item: LineItem;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
      <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 font-bold text-xs uppercase">
        {item.product_name.substring(0, 2)}
      </div>
      <div className="flex-grow">
        <h4 className="font-bold text-sm">{item.product_name}</h4>
        <p className="text-xs text-slate-500">₹{item.unit_price} each</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onUpdateQuantity(item.product_id, -1)}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
        <button 
          onClick={() => onUpdateQuantity(item.product_id, 1)}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="w-20 text-right font-bold font-display">
        ₹{item.total}
      </div>
      <button 
        onClick={() => onRemove(item.product_id)}
        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
