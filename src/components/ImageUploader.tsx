/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Upload, Camera, Image as ImageIcon, RefreshCw, AlertCircle, Sparkles, Undo, Sliders, Droplet, Check, Eye } from "lucide-react";

interface ImageUploaderProps {
  onImageSelected: (base64Data: string) => void;
  selectedImageSrc: string | null;
}

export default function ImageUploader({ onImageSelected, selectedImageSrc }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Background removal states
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [showBgRemover, setShowBgRemover] = useState(false);
  const [sensitivity, setSensitivity] = useState(45);
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์ประเภทรูปภาพเท่านั้น (เช่น JPG, PNG)");
      return;
    }

    // Limit to 15MB for base64 uploading to ensure Gemini prompt limits are respected
    if (file.size > 15 * 1024 * 1024) {
      setError("รูปภาพมีขนาดใหญ่เกิน 15MB กรุณาใช้รูปภาพขนาดเล็กลงเพื่อให้ระบบ AI ประมวลผลได้อย่างรวดเร็ว");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setOriginalImageSrc(result);
        onImageSelected(result);
        // Reset remover states for a fresh image
        setKeyColor(null);
        setShowBgRemover(false);
      }
    };
    reader.onerror = () => {
      setError("เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraSelect = () => {
    cameraInputRef.current?.click();
  };

  // --- BACKGROUND REMOVAL LOGIC ---
  const handleRemoveBackground = (targetColorOverride?: { r: number; g: number; b: number } | null) => {
    const srcToUse = originalImageSrc || selectedImageSrc;
    if (!srcToUse) return;

    setIsProcessing(true);
    setError(null);

    // Dynamic processing timeout for interactive feedback
    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError("ไม่สามารถสร้างอ็อบเจกต์ประมวลผลรูปภาพได้");
            setIsProcessing(false);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const w = canvas.width;
          const h = canvas.height;

          // Resolve key color
          let finalKeyColor = targetColorOverride !== undefined ? targetColorOverride : keyColor;

          if (!finalKeyColor) {
            // Auto sampling: Sample 8 boundary and corner pixels to model the ambient background
            const samples = [
              getPixelColor(data, 0, 0, w),
              getPixelColor(data, w - 1, 0, w),
              getPixelColor(data, 0, h - 1, w),
              getPixelColor(data, w - 1, h - 1, w),
              getPixelColor(data, Math.floor(w / 2), 0, w),
              getPixelColor(data, 0, Math.floor(h / 2), w),
              getPixelColor(data, w - 1, Math.floor(h / 2), w),
              getPixelColor(data, Math.floor(w / 2), h - 1, w),
            ];

            let sumR = 0, sumG = 0, sumB = 0;
            samples.forEach((s) => {
              sumR += s.r;
              sumG += s.g;
              sumB += s.b;
            });
            const avgR = Math.round(sumR / samples.length);
            const avgG = Math.round(sumG / samples.length);
            const avgB = Math.round(sumB / samples.length);

            finalKeyColor = { r: avgR, g: avgG, b: avgB };
            setKeyColor(finalKeyColor);
          }

          const tolerance = sensitivity;
          const kr = finalKeyColor.r;
          const kg = finalKeyColor.g;
          const kb = finalKeyColor.b;

          // Process pixels for chroma removal with soft alpha edges
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);

            if (dist < tolerance) {
              const transitionZone = Math.max(1, tolerance * 0.25);
              const lowerBound = tolerance - transitionZone;
              if (dist < lowerBound) {
                data[i + 3] = 0; // completely transparent
              } else {
                const ratio = (dist - lowerBound) / transitionZone;
                data[i + 3] = Math.round(ratio * 255);
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
          onImageSelected(canvas.toDataURL("image/png"));
          setIsProcessing(false);
        } catch (err) {
          console.error(err);
          setError("เกิดข้อผิดพลาดในการคำนวณถอดรหัสพิกเซล");
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setError("ไม่สามารถโหลดไฟล์เพื่อประมวลผลพื้นหลังได้");
        setIsProcessing(false);
      };
      img.src = srcToUse;
    }, 600);
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const idx = (y * width + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
    };
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperActive) return;

    const imgEl = e.currentTarget;
    const canvas = document.createElement("canvas");
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      const rect = imgEl.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const scaleX = imgEl.naturalWidth / rect.width;
      const scaleY = imgEl.naturalHeight / rect.height;
      const exactX = Math.floor(clickX * scaleX);
      const exactY = Math.floor(clickY * scaleY);

      try {
        const pixelData = ctx.getImageData(exactX, exactY, 1, 1).data;
        const picked = {
          r: pixelData[0],
          g: pixelData[1],
          b: pixelData[2],
        };
        setKeyColor(picked);
        setIsEyedropperActive(false);
        handleRemoveBackground(picked);
      } catch (err) {
        console.error(err);
      }
    };
    img.src = originalImageSrc || selectedImageSrc || "";
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4 text-[#4DA1A9]" />
        รูปสินค้าเกษตรของคุณ <span className="text-red-500">*</span>
      </h3>

      {/* Hidden input files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {!selectedImageSrc ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] transition-all duration-300 ${
            isDragging
              ? "border-[#4DA1A9] bg-[#79D7BE]/10 scale-[0.99]"
              : "border-gray-200 hover:border-[#4DA1A9] hover:bg-white bg-gray-50/50"
          }`}
          id="upload-dropzone"
        >
          <div className="w-12 h-12 rounded-full bg-[#4DA1A9]/10 flex items-center justify-center text-[#4DA1A9] mb-3">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>

          <p className="font-semibold text-gray-700 text-sm mb-1">
            กดที่นี่เพื่ออัปโหลด หรือ ลากรูปภาพมาวาง
          </p>
          <p className="text-xs text-gray-400 max-w-[280px]">
            รองรับ JPG, PNG และ WebP (แนะนำรูปหน้าตรงหรือเห็นสินค้าเกษตรชัดเจน)
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerCameraSelect();
              }}
              className="py-1.5 px-3 rounded-full bg-white border border-gray-200 hover:border-[#4DA1A9] text-xs text-gray-600 flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              id="btn-camera"
            >
              <Camera className="w-3.5 h-3.5 text-gray-500" />
              ถ่ายรูปจากกล้อง
            </button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white p-3 group">
          <div className="w-full h-44 rounded-xl overflow-hidden bg-slate-50 relative flex items-center justify-center border border-gray-100/50">
            {/* Transparent checkerboard background style for removed backgrounds */}
            <div 
              className="absolute inset-0 opacity-20" 
              style={{
                backgroundImage: "radial-gradient(#4da1a9 1px, transparent 1px), radial-gradient(#4da1a9 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px"
              }}
            ></div>

            <img
              src={selectedImageSrc}
              alt="รูปอัปโหลดสินค้า"
              className={`max-w-full max-h-full object-contain relative z-10 transition-all duration-300 ${
                isEyedropperActive 
                  ? "cursor-crosshair ring-4 ring-amber-400 scale-[1.02]" 
                  : ""
              }`}
              onClick={isEyedropperActive ? handleImageClick : undefined}
              referrerPolicy="no-referrer"
            />

            {/* Glowing Laser Scanner effect during Background Removal Processing */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/10 z-20 flex flex-col items-center justify-center">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#79D7BE] to-transparent animate-bounce shadow-[0_0_12px_#79D7BE] absolute top-10"></div>
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#4DA1A9] to-transparent animate-bounce shadow-[0_0_12px_#4DA1A9] absolute bottom-10"></div>
                <div className="bg-slate-900/85 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 tracking-wide shadow-xl">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#79D7BE]" />
                  <span>AI กำลังลบพื้นหลัง...</span>
                </div>
              </div>
            )}

            {isEyedropperActive && (
              <div className="absolute inset-0 bg-amber-500/10 z-20 pointer-events-none border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-center">
                <div className="bg-amber-500/95 text-white px-3 py-1 rounded-full text-[9px] font-bold tracking-wide shadow-lg">
                  🎯 คลิกตรงที่พิกเซลสีพื้นหลังที่ต้องการดูดลบ
                </div>
              </div>
            )}
            
            {!showBgRemover && (
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="p-2 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#4DA1A9] flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all duration-150 active:scale-95 shadow-lg"
                  id="btn-change-image"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>เปลี่ยนรูป</span>
                </button>
                <button
                  type="button"
                  onClick={triggerCameraSelect}
                  className="p-2 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#4DA1A9] flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all duration-150 active:scale-95 shadow-lg"
                  id="btn-recamera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ถ่ายใหม่</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1 bg-white">
            <span className="text-[11px] font-bold text-[#4DA1A9] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#79D7BE] animate-pulse"></span>
              อัปโหลดรูปสำเร็จ
            </span>
            <button
              type="button"
              onClick={triggerFileSelect}
              className="text-xs text-gray-400 hover:text-[#4DA1A9] underline font-medium cursor-pointer"
              id="btn-replace-text"
            >
              เปลี่ยนรูปใหม่
            </button>
          </div>

          {/* Collapsible Action Panel for AI-Assisted Background Remover */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowBgRemover(!showBgRemover);
                if (!originalImageSrc && selectedImageSrc) {
                  setOriginalImageSrc(selectedImageSrc);
                }
              }}
              className={`w-full py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer ${
                showBgRemover 
                  ? "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200"
                  : "bg-gradient-to-r from-[#4DA1A9] to-[#79D7BE] hover:from-[#3D8F97] hover:to-[#68C5AB] text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showBgRemover ? "ซ่อนกล่องเครื่องมือลบพื้นหลัง" : "🔮 ลบพื้นหลังรูปให้โปร่งใสด้วย AI"}</span>
            </button>
          </div>

          {showBgRemover && (
            <div className="mt-3 p-3 bg-slate-50/85 rounded-xl border border-gray-250 flex flex-col space-y-3 animation-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#4DA1A9]" />
                  ลบพื้นหลัง (Remove Background)
                </span>
                {originalImageSrc && originalImageSrc !== selectedImageSrc && (
                  <button
                    type="button"
                    onClick={() => {
                      if (originalImageSrc) {
                        onImageSelected(originalImageSrc);
                        setKeyColor(null);
                        setError(null);
                      }
                    }}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    <span>รูปภาพเดิม</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRemoveBackground(null)}
                  disabled={isProcessing}
                  className="py-1.5 px-2.5 bg-gradient-to-br from-[#2E5077] to-[#4DA1A9] hover:from-[#213a58] text-white text-[10px] font-bold rounded-lg shadow-sm cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  ลบพื้นหลังอัตโนมัติ
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                  disabled={isProcessing}
                  className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 ${
                    isEyedropperActive 
                      ? "bg-amber-500 border-amber-500 text-white shadow-xs" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Droplet className="w-3 h-3" />
                  <span>{isEyedropperActive ? "โปรดคลิกจิ้มสี..." : "ดูดสีพื้นหลังด้วยมือ"}</span>
                </button>
              </div>

              {/* Dynamic instruction for Eyedropper Color Picker */}
              {isEyedropperActive && (
                <div className="text-[9.5px] text-amber-700 font-bold text-center bg-amber-50 p-2 rounded-lg border border-amber-150 animate-pulse">
                  💡 แตะจิ้มเมาส์บนกล่องภาพด้านบนตรงสีพื้นหลังกระดาษ เพื่อละลายออกทันที!
                </div>
              )}

              {/* Sensitivity range sliders */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                  <span>ระดับความทนทานสี (Sensitivity Tolerance):</span>
                  <span className="font-mono text-[#2E5077]">{sensitivity}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="140"
                  step="2"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseInt(e.target.value))}
                  onMouseUp={() => handleRemoveBackground()}
                  onTouchEnd={() => handleRemoveBackground()}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4DA1A9]"
                />
              </div>

              {/* Display sampled key color if exists */}
              {keyColor && (
                <div className="bg-white p-2 rounded-lg border border-gray-150 flex items-center justify-between text-[10px]">
                  <span className="text-gray-500 font-bold">พื้นหลังคัดแยกสี:</span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-gray-300 block shadow-xs" 
                      style={{ backgroundColor: `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` }}
                    ></span>
                    <span className="font-mono text-gray-600 text-[9px]">RGB({keyColor.r}, {keyColor.g}, {keyColor.b})</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (originalImageSrc) {
                      onImageSelected(originalImageSrc);
                      setKeyColor(null);
                    }
                    setShowBgRemover(false);
                  }}
                  className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-600 font-bold text-[10px] rounded-lg hover:bg-gray-100 transition-all cursor-pointer text-center"
                >
                  คืนค่ารูปเต็ม
                </button>
                <button
                  type="button"
                  onClick={() => setShowBgRemover(false)}
                  className="flex-1 py-1.5 px-3 bg-[#2E5077] border border-[#2E5077] text-white font-bold text-[10px] rounded-lg hover:bg-[#203a58] transition-all cursor-pointer text-center"
                >
                  <span className="flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    เสร็จสิ้น
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 mt-2 p-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium" id="upload-error">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
