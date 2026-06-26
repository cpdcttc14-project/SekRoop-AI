/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Move, Maximize2, RotateCw, Sparkles, Sliders, ShieldAlert } from "lucide-react";
import { FrameMaskType } from "../types";

interface AIPositionControllerProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  xOffset: number;
  onXOffsetChange: (x: number) => void;
  yOffset: number;
  onYOffsetChange: (y: number) => void;
  rotation: number;
  onRotationChange: (rot: number) => void;
  frameMask: FrameMaskType;
  onFrameMaskChange: (mask: FrameMaskType) => void;
}

interface MaskOption {
  id: FrameMaskType;
  label: string;
  desc: string;
}

const MASK_OPTIONS: MaskOption[] = [
  { id: "none", label: "ภาพเดิมเต็มใบ", desc: "แสดงผลตรงตัวตามไฟล์ภาพดิบ" },
  { id: "circle", label: "วงกลมโมเดิร์น", desc: "ครอบรูปทรงกลมเน้นสินค้าเด่นชัดเจน" },
  { id: "rounded", label: "สี่เหลี่ยมมุมโค้ง", desc: "สี่เหลี่ยมมนหรูหรา ขอบกลมละมุน" },
  { id: "oval", label: "ไข่เรียบอินทรีย์", desc: "ทรงวงรีออแกนิก เข้ากับผลไม้เดี่ยว" },
  { id: "gold-frame", label: "ตราเหรียญทอง", desc: "วงกลมขอบคู่สีทองพรีเมียมหรูยกระดับ" },
];

export default function AIPositionController({
  scale,
  onScaleChange,
  xOffset,
  onXOffsetChange,
  yOffset,
  onYOffsetChange,
  rotation,
  onRotationChange,
  frameMask,
  onFrameMaskChange,
}: AIPositionControllerProps) {
  return (
    <div className="w-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
        <Sliders className="w-4 h-4 text-[#4DA1A9]" />
        ปรับแต่งและจัดตำแหน่งรูปสินค้า
      </h3>

      {/* Frame style mask */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-500 block mb-2">
          สไตล์รูปทรงของรูปสินค้า (กรอบกรองภาพ)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5" id="mask-selection-grid">
          {MASK_OPTIONS.map((mask) => (
            <button
              key={mask.id}
              type="button"
              onClick={() => onFrameMaskChange(mask.id)}
              className={`p-2 rounded-xl text-center border text-[11px] font-medium transition-all cursor-pointer ${
                frameMask === mask.id
                  ? "bg-[#2E5077] border-[#2E5077] text-white shadow-sm"
                  : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200"
              }`}
              id={`mask-btn-${mask.id}`}
              title={mask.desc}
            >
              <div className="truncate font-semibold">{mask.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Silder details */}
      <div className="space-y-3.5 mt-2">
        {/* Scale Size */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-[#4DA1A9]" />
              ปรับขนาดรูป (%)
            </span>
            <span className="font-mono text-gray-700">{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.01"
            value={scale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
            id="slider-scale"
          />
        </div>

        {/* position X */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3 text-[#4DA1A9]" />
              เลื่อนตำแหน่ง ซ้าย - ขวา
            </span>
            <span className="font-mono text-gray-700">{xOffset}px</span>
          </div>
          <input
            type="range"
            min="-400"
            max="400"
            step="1"
            value={xOffset}
            onChange={(e) => onXOffsetChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
            id="slider-x"
          />
        </div>

        {/* position Y */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3 text-[#4DA1A9]" />
              เลื่อนตำแหน่ง บน - ล่าง
            </span>
            <span className="font-mono text-gray-700">{yOffset}px</span>
          </div>
          <input
            type="range"
            min="-400"
            max="400"
            step="1"
            value={yOffset}
            onChange={(e) => onYOffsetChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
            id="slider-y"
          />
        </div>

        {/* rotate */}
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-[#4DA1A9]" />
              หมุนองศาภาพ
            </span>
            <span className="font-mono text-gray-700">{rotation}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotation}
            onChange={(e) => onRotationChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
            id="slider-rotation"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400 bg-white p-2 rounded-xl border border-gray-100">
        <ShieldAlert className="w-3.5 h-3.5 text-[#4DA1A9] shrink-0" />
        <span>เกษตรกรสามารถใช้นิ้วลากวัตถุในจอพรีเมียร์ (ด้านขวา) เพื่อย้ายตำแหน่งของภาพแบบสากลได้โดยอิสระเช่นกัน!</span>
      </div>
    </div>
  );
}
