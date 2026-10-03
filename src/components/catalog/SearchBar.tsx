import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-stone-600 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari beras, minyak, telur, mie..."
          aria-label="Cari produk di Warung Amma Ika"
          className="w-full pl-10 pr-10 py-2.5 bg-stone-100 hover:bg-stone-100/80 focus:bg-white text-stone-900 placeholder:text-stone-600 text-sm font-medium rounded-2xl border border-transparent focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200/50 transition-all shadow-2xs"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="absolute right-3 p-1 text-stone-400 hover:text-stone-600 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
