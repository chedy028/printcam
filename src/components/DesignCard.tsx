"use client";

import { useState } from "react";

interface Design {
  id: number;
  name: string;
  slug: string;
  preview_url: string;
  category: string;
  print_times: { S: number; M: number; L: number };
  available_colors: { name: string; hex: string }[];
}

interface Props {
  design: Design;
  onSelect: (color: { name: string; hex: string }, size: "S" | "M" | "L") => void;
}

export default function DesignCard({ design, onSelect }: Props) {
  const [selectedColor, setSelectedColor] = useState(design.available_colors[0]);
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M");
  const [expanded, setExpanded] = useState(false);

  const printTime = design.print_times[selectedSize];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
      {/* Preview */}
      <div
        className="h-48 bg-gray-100 flex items-center justify-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-6xl">
          {design.category === "Animals" ? "🦕" : "🚀"}
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{design.name}</h3>
            <p className="text-sm text-gray-500">{design.category}</p>
          </div>
          <span className="font-bold text-indigo-600">$10</span>
        </div>

        {/* Color Picker */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Color</label>
          <div className="flex gap-2">
            {design.available_colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor.name === color.name
                    ? "border-indigo-600 scale-110"
                    : "border-gray-200"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Size Toggle */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 block mb-1">Size</label>
          <div className="flex gap-1">
            {(["S", "M", "L"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            ~{printTime} min print time
          </span>
          <button
            onClick={() => onSelect(selectedColor, selectedSize)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Print This!
          </button>
        </div>
      </div>
    </div>
  );
}
