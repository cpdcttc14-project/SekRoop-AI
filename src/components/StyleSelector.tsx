/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Leaf, Award, Compass, Flame, Sparkles, Tv, Heart, Zap, ChevronDown, Check } from "lucide-react";
import { ThemeStyleType } from "../types";

interface StyleOption {
  id: ThemeStyleType;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgPreview: string; // Tailwind gradient classes
  textColor: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "natural",
    title: "สวนธรรมชาติ (Organic Greenery)",
    description: "เน้นความสดชื่น สีเขียวมิ้นท์ ผ่อนคลาย เข้ากับพืชผักออร์แกนิก ผลไม้สดจากต้น",
    icon: <Leaf className="w-4 h-4" />,
    bgPreview: "from-emerald-400 to-teal-600",
    textColor: "text-emerald-700",
  },
  {
    id: "premium",
    title: "พรีเมียมหรูหรา (Premium Luxury)",
    description: "ลุคโมเดิร์นหรูหรา พื้นหลังสีกรมท่าตัดทอง มีประกายระยิบระยับ เพิ่มมูลค่าให้ผลผลิต",
    icon: <Sparkles className="w-4 h-4" />,
    bgPreview: "from-[#1C2E46] to-[#0B131C]",
    textColor: "text-[#2E5077]",
  },
  {
    id: "rustic",
    title: "แผ่นป้ายไม้คลาสสิก (Rustic Farm)",
    description: "เน้นกลิ่นอายธรรมชาติ อารมณ์ดินเผา ไม้คลาสสิกและกระดาษคราฟต์ที่ดูเป็นกันเอง",
    icon: <Compass className="w-4 h-4" />,
    bgPreview: "from-[#FAF5EF] to-[#E3D1BE]",
    textColor: "text-amber-800",
  },
  {
    id: "market",
    title: "ตลาดสดใสสไตล์ไทย (Vibrant Market)",
    description: "เน้นสีสันฉูดฉาด แดงเหลืองส้ม ดึงดูดสายตาฉับพลัน เหมาะสำหรับโปรโมชั่นเด็ดราคาโดนใจ",
    icon: <Flame className="w-4 h-4" />,
    bgPreview: "from-amber-400 to-red-500",
    textColor: "text-red-600",
  },
  {
    id: "minimal",
    title: "โมเดิร์นวิลเลจ (Modern Minimalist)",
    description: "สไตล์มินิมอลญี่ปุ่น สะอาดตา ขาวครีมเรียบหรู จัดเรียงเสมือนนิตยสารรุ่นใหม่",
    icon: <Award className="w-4 h-4" />,
    bgPreview: "from-gray-50 to-gray-200",
    textColor: "text-gray-700",
  },
  {
    id: "retro-neon",
    title: "เรโทรนีออน (Retro Neon Glow)",
    description: "สไตล์ย้อนยุค 80s แฟลชสีม่วง-ชมพูเรืองแสงสะดุดตาโดดเด่นกลางราตรี",
    icon: <Tv className="w-4 h-4" />,
    bgPreview: "from-fuchsia-500 to-indigo-600",
    textColor: "text-fuchsia-700",
  },
  {
    id: "pastel-sweet",
    title: "พาสเทลหวานละมุน (Sweet Pastel)",
    description: "โทนสีชมพูหวานละอ่อน ผ่อนคลาย เหมาะกับของฝาก เบเกอรี และชาผลไม้",
    icon: <Heart className="w-4 h-4" />,
    bgPreview: "from-rose-300 to-pink-200",
    textColor: "text-pink-600",
  },
  {
    id: "bold-future",
    title: "อนาคตสุดแกร่ง (Futuristic Bold)",
    description: "พาดหัวทรงพลัง ตัดด้วยสีส้มสะท้อนแสงบนพื้นคาร์บอนดำ คมชัดทุกรายละเอียด",
    icon: <Zap className="w-4 h-4" />,
    bgPreview: "from-gray-800 to-orange-600",
    textColor: "text-orange-600",
  },
];

interface StyleSelectorProps {
  selectedStyle: ThemeStyleType;
  onChange: (style: ThemeStyleType) => void;
}

export default function StyleSelector({ selectedStyle, onChange }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = STYLE_OPTIONS.find((opt) => opt.id === selectedStyle) || STYLE_OPTIONS[0];

  return (
    <div className="w-full relative" ref={containerRef}>
      <h3 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-[#4DA1A9]" />
        ธีมการออกแบบรูปโฆษณา <span className="text-red-500">*</span>
      </h3>

      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50/50 shadow-xs transition-all flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]/40"
        id="theme-dropdown-toggle"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-tr ${currentOption.bgPreview} flex items-center justify-center text-white shadow-xs`}
          >
            {currentOption.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800">
              {currentOption.title}
            </p>
            <p className="text-[11px] text-gray-500 truncate leading-relaxed mt-0.5 max-w-[280px] sm:max-w-[450px]">
              {currentOption.description}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "transform rotate-180 text-[#4DA1A9]" : ""
          }`}
        />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 max-h-80 overflow-y-auto"
          id="theme-dropdown-menu"
        >
          <div className="flex flex-col gap-1">
            {STYLE_OPTIONS.map((option) => {
              const isSelected = selectedStyle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#4DA1A9]/10 border border-[#4DA1A9]/25"
                      : "bg-transparent border border-transparent hover:bg-gray-50"
                  }`}
                  id={`style-btn-${option.id}`}
                >
                  <div
                    className={`w-8 h-8 shrink-0 rounded-md bg-gradient-to-tr ${option.bgPreview} flex items-center justify-center text-white shadow-xs`}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-bold ${isSelected ? "text-[#2E5077]" : "text-gray-800"}`}>
                        {option.title}
                      </p>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#4DA1A9] shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate leading-normal mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
