import React from 'react';
import { Category } from '../../types';

interface CategoryPillsProps {
  categories: Category[];
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <nav
      aria-label="Kategori Produk"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
    >
      {categories.map((category) => {
        const isActive = activeCategory.toLowerCase() === category.toLowerCase();
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer select-none shrink-0 ${
              isActive
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900 border border-stone-200/60'
            }`}
          >
            {category}
          </button>
        );
      })}
    </nav>
  );
};
