/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Store,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Tag,
  Phone,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  Maximize,
  Grid,
  Info
} from "lucide-react";
import { AdData } from "../types";

interface UnifiedStyleToolbarProps {
  data: AdData;
  activeLayer: "product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null;
  onSelectLayer: (layer: "product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null) => void;
  onUpdateField: (field: keyof AdData, value: any) => void;
}

export default function UnifiedStyleToolbar({
  data,
  activeLayer,
  onSelectLayer,
  onUpdateField,
}: UnifiedStyleToolbarProps) {
  // Layer list configuration
  const layers = [
    { id: "farm" as const, label: "ชื่อสวน / แบรนด์", icon: Store, color: "text-[#2E5077]" },
    { id: "headline" as const, label: "พาดหัวหลัก", icon: Type, color: "text-emerald-600" },
    { id: "subtitle" as const, label: "คำอธิบายสินค้า", icon: Type, color: "text-purple-600" },
    { id: "price" as const, label: "ป้ายราคา", icon: Tag, color: "text-amber-600" },
    { id: "contact" as const, label: "ช่องทางติดต่อ", icon: Phone, color: "text-blue-600" },
    { id: "product" as const, label: "ปรับแต่งรูปสินค้า", icon: ImageIcon, color: "text-indigo-600" },
  ];

  // Helper to quickly render standard text formatting row
  const renderTextFormatting = (
    boldKey: keyof AdData,
    italicKey: keyof AdData,
    underlineKey: keyof AdData,
    alignKey: keyof AdData,
    fontSizeKey: keyof AdData,
    minSize: number,
    maxSize: number
  ) => {
    const isBold = !!data[boldKey];
    const isItalic = !!data[italicKey];
    const isUnderline = !!data[underlineKey];
    const alignment = data[alignKey] || "center";
    const fontSize = (data[fontSizeKey] as number) || minSize;

    return (
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
        {/* Style Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">รูปแบบอักษร:</span>
          <button
            type="button"
            onClick={() => onUpdateField(boldKey, !isBold)}
            className={`w-8 h-8 rounded-lg font-black flex items-center justify-center transition-all border ${
              isBold
                ? "bg-[#2E5077] text-white border-[#2E5077]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
            title="ตัวหนา"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateField(italicKey, !isItalic)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
              isItalic
                ? "bg-[#2E5077] text-white border-[#2E5077]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
            title="ตัวเอียง"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateField(underlineKey, !isUnderline)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
              isUnderline
                ? "bg-[#2E5077] text-white border-[#2E5077]"
                : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
            }`}
            title="ขีดเส้นใต้"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">จัดแนว:</span>
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdateField(alignKey, "left")}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                alignment === "left" ? "bg-[#4DA1A9] text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
              title="ชิดซ้าย"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateField(alignKey, "center")}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                alignment === "center" ? "bg-[#4DA1A9] text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
              title="กึ่งกลาง"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateField(alignKey, "right")}
              className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                alignment === "right" ? "bg-[#4DA1A9] text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
              title="ชิดขวา"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ขนาดตัวอักษร:</span>
          <input
            type="range"
            min={minSize}
            max={maxSize}
            value={fontSize}
            onChange={(e) => onUpdateField(fontSizeKey, parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
          />
          <span className="text-xs font-mono font-bold text-[#2E5077] w-10 text-center bg-slate-100 py-0.5 rounded border border-slate-200 shrink-0">
            {fontSize}px
          </span>
        </div>
      </div>
    );
  };

  // Helper to render Position offset tuning (X/Y)
  const renderPositionOffsets = (
    xKey: keyof AdData,
    yKey: keyof AdData,
    minVal = -200,
    maxVal = 200
  ) => {
    const xVal = (data[xKey] as number) || 0;
    const yVal = (data[yKey] as number) || 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 w-28 shrink-0">เลื่อน ซ้าย - ขวา (X):</span>
          <input
            type="range"
            min={minVal}
            max={maxVal}
            value={xVal}
            onChange={(e) => onUpdateField(xKey, parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-[#2E5077]"
          />
          <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 w-12 text-center shrink-0">
            {xVal > 0 ? `+${xVal}` : xVal}px
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 w-28 shrink-0">เลื่อน ขึ้น - ลง (Y):</span>
          <input
            type="range"
            min={minVal}
            max={maxVal}
            value={yVal}
            onChange={(e) => onUpdateField(yKey, parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-[#2E5077]"
          />
          <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 w-12 text-center shrink-0">
            {yVal > 0 ? `+${yVal}` : yVal}px
          </span>
        </div>
      </div>
    );
  };

  return (
    <div id="unified-style-toolbar" className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 mb-4 transition-all">
      {/* 1. Header & Quick Selector Row */}
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4DA1A9] animate-pulse"></div>
            <h3 className="text-sm font-bold text-[#2E5077]">เครื่องมือจัดการขนาด ฟอนต์ และตำแหน่งภาพตัวอย่าง</h3>
          </div>
          {activeLayer && (
            <button
              onClick={() => onSelectLayer(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 hover:bg-slate-100"
            >
              ยกเลิกการเลือกชั้น
            </button>
          )}
        </div>

        {/* Horizontal tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
          {layers.map((layer) => {
            const IconComponent = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white text-[#2E5077] shadow-sm scale-[1.02] border-b-2 border-[#4DA1A9]"
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-800"
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${layer.color}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Style & Offset Controls dependent on selected layer */}
      <div className="space-y-3 min-h-[90px] flex flex-col justify-center">
        {activeLayer === null ? (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Info className="w-5 h-5 text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              💡 คลิกเลือกหัวข้อด้านบน หรือกดที่ข้อความบนรูปภาพตัวอย่าง เพื่อเริ่มต้นปรับแต่ง ขนาด ฟอนต์ และตำแหน่งอย่างง่ายดาย!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Display title for active layer */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-xs font-bold text-[#2E5077] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#4DA1A9]" />
                กำลังแก้ไข: <span className="text-[#4DA1A9] underline decoration-wavy decoration-[#79D7BE]">{layers.find(l => l.id === activeLayer)?.label}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">สามารถใช้เมาส์ลากย้ายตำแหน่งข้อความบนรูปได้เช่นกัน</span>
            </div>

            {/* FARM/BRAND NAME CONTROLS */}
            {activeLayer === "farm" && (
              <>
                {renderTextFormatting("farmBold", "farmItalic", "farmUnderline", "farmAlign", "farmFontSize", 14, 80)}
                {renderPositionOffsets("farmXOffset", "farmYOffset", -150, 150)}
              </>
            )}

            {/* HEADLINE CONTROLS */}
            {activeLayer === "headline" && (
              <>
                {renderTextFormatting("headlineBold", "headlineItalic", "headlineUnderline", "headlineAlign", "headlineFontSize", 20, 100)}
                {renderPositionOffsets("headlineXOffset", "headlineYOffset", -300, 300)}
              </>
            )}

            {/* SUBTITLE CONTROLS */}
            {activeLayer === "subtitle" && (
              <>
                {renderTextFormatting("subtitleBold", "subtitleItalic", "subtitleUnderline", "subtitleAlign", "subtitleFontSize", 14, 60)}
                {renderPositionOffsets("subtitleXOffset", "subtitleYOffset", -300, 300)}
              </>
            )}

            {/* CONTACT CONTROLS */}
            {activeLayer === "contact" && (
              <>
                {renderTextFormatting("contactBold", "contactItalic", "contactUnderline", "contactAlign", "contactFontSize", 16, 48)}
                {renderPositionOffsets("contactXOffset", "contactYOffset", -200, 200)}
              </>
            )}

            {/* PRICE TAG CONTROLS */}
            {activeLayer === "price" && (
              <div className="space-y-3">
                {/* 1. Price tag style selector */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">รูปแบบป้ายราคา:</span>
                    <div className="flex flex-wrap gap-1">
                      {(["circle", "starburst", "badge", "ribbon"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => onUpdateField("priceTagStyle", style)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            (data.priceTagStyle || "circle") === style
                              ? "bg-[#4DA1A9] text-white border-[#4DA1A9] shadow-sm"
                              : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          {style === "circle" ? "🔴 วงกลม" : style === "starburst" ? "💥 ดาวแฉก" : style === "badge" ? "⬜ สี่เหลี่ยม" : "🎗️ ริบบิ้น"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Tag overall scale */}
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-slate-500 shrink-0">ปรับขนาดป้ายรวม:</span>
                    <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                      <input
                        type="range"
                        min="0.4"
                        max="2.0"
                        step="0.05"
                        value={data.priceScale || 1.0}
                        onChange={(e) => onUpdateField("priceScale", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
                      />
                      <span className="text-xs font-mono font-bold text-[#2E5077] w-12 text-center bg-slate-100 py-0.5 rounded border border-slate-200 shrink-0">
                        {Math.round((data.priceScale || 1.0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Font text styling inside price tag */}
                {renderTextFormatting("priceBold", "priceItalic", "priceUnderline", "priceAlign" as any, "priceFontSize", 20, 70)}

                {/* 3. Position offset sliders */}
                {renderPositionOffsets("priceXOffset", "priceYOffset", -300, 300)}
              </div>
            )}

            {/* PRODUCT IMAGE CONTROLS */}
            {activeLayer === "product" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {/* Product Scale */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-24 shrink-0 flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5 text-indigo-500" />
                      ย่อ-ขยายภาพ:
                    </span>
                    <input
                      type="range"
                      min="0.2"
                      max="2.5"
                      step="0.05"
                      value={data.productScale || 1.0}
                      onChange={(e) => onUpdateField("productScale", parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-[#4DA1A9]"
                    />
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 w-12 text-center shrink-0">
                      {Math.round((data.productScale || 1.0) * 100)}%
                    </span>
                  </div>

                  {/* Product Rotation */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-24 shrink-0 flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                      หมุนรูปภาพ:
                    </span>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={data.productRotation || 0}
                      onChange={(e) => onUpdateField("productRotation", parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-[#2E5077]"
                    />
                    <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 w-12 text-center shrink-0">
                      {data.productRotation || 0}°
                    </span>
                  </div>
                </div>

                {/* Frame mask selection inside toolbar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                    <Grid className="w-3.5 h-3.5 text-purple-500" />
                    กรอบรูปสินค้า:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { id: "none", label: "ปกติ (ไม่ครอบ)" },
                      { id: "circle", label: "วงกลม" },
                      { id: "rounded", label: "มุมมน" },
                      { id: "oval", label: "วงรีแนวนอน" },
                      { id: "gold-frame", label: "👑 กรอบทองคำพรีเมียม" },
                    ] as const).map((mask) => (
                      <button
                        key={mask.id}
                        type="button"
                        onClick={() => onUpdateField("frameMask", mask.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          data.frameMask === mask.id
                            ? "bg-[#2E5077] text-white border-[#2E5077] shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {mask.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* X/Y Positioning */}
                {renderPositionOffsets("productX", "productY", -400, 400)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
