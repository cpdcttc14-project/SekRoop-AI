/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Check, Copy, AlertTriangle, RefreshCw, Star, ArrowRight, Share2 } from "lucide-react";
import { AIResult } from "../types";

interface AIPromptPanelProps {
  selectedImageSrc: string | null;
  farmName: string;
  productName: string;
  secondaryText: string;
  
  // Callbacks to update state
  onSelectionHeadline: (headline: string) => void;
  onSelectionSubtitle: (sub: string) => void;
  onApplyAICachedColors: (colors: { primary: string; secondary: string; bgStart: string; bgEnd: string }) => void;
  onApplyAIBadge: (badgeText: string, slotIndex: 1 | 2) => void;
  onAIResultLoaded: (result: AIResult) => void;
}

const LOADING_STATUS_MESSAGES = [
  "เสกปัญญาประดิษฐ์วิเคราะห์สไตล์ภาพถ่ายเกษตรกรรม...",
  "กำลังคำนวณเฉดสีที่เหมาะสมที่สุดเพื่อดึงจุดเด่นของผลผลิตออกมาระดับพรีเมียม...",
  "กำลังคัดสรรภาษาโฆษณาเด็ดๆ สะกดถูกต้อง 100% ตามพจนานุกรมราชบัณฑิตยสถาน...",
  "กำลังปรุงแต่งแคปชั่นสำหรับไปโพสต์ขายของดึงดูดใจลุกค้าทันที...",
];

export default function AIPromptPanel({
  selectedImageSrc,
  farmName,
  productName,
  secondaryText,
  onSelectionHeadline,
  onSelectionSubtitle,
  onApplyAICachedColors,
  onApplyAIBadge,
  onAIResultLoaded,
}: AIPromptPanelProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Interval timer for rotating reassuring loading messages
  const runLoadingAnimation = () => {
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= LOADING_STATUS_MESSAGES.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 2800);
    return interval;
  };

  const handleGenerateAIAd = async () => {
    if (!selectedImageSrc) {
      setError("กรุณาอัปโหลดรูปภาพสินค้าเกษตรของคุณก่อน จึงจะเรียกใช้ระบบนักเสกสรรค์ AI ได้");
      return;
    }

    setLoading(true);
    setError(null);
    const loadingInterval = runLoadingAnimation();

    try {
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImageSrc,
          farmName,
          productName,
          secondaryText,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ AI กรุณาลองอีกครั้ง");
      }

      setAiResult(resData);
      onAIResultLoaded(resData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการปรุงสำนวนโฆษณาผ่านระบบ AI");
    } finally {
      clearInterval(loadingInterval);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="w-full bg-[#EBF7F8] border border-[#79D7BE]/40 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[#79D7BE]/30 pb-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-6.5 h-6.5 rounded-lg bg-[#4DA1A9] text-white flex items-center justify-center animate-pulse">
            <Sparkles className="w-3.5 h-3.5 fill-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2E5077]">
              นักเสกโฆษณาด้วยระบบ SekRoop AI ✨
            </h3>
            <p className="text-[10px] text-gray-500 leading-tight">
              เสกคำเขียนพาดหัว ตราประทับ และโทนสีคู่สีกราฟิกจากรูปภาพโดยอัตโนมัติ
            </p>
          </div>
        </div>

        {aiResult && (
          <button
            type="button"
            onClick={handleGenerateAIAd}
            className="text-[10px] bg-[#4DA1A9] hover:bg-[#2E5077] text-white font-bold py-1 px-2.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
            id="btn-regenerate-ai"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>เสกสรรค์ใหม่</span>
          </button>
        )}
      </div>

      {/* Trigger Button if not generated or generating */}
      {!aiResult && !loading && (
        <div className="text-center py-2" id="ai-entry-panel">
          <p className="text-xs text-gray-600 mb-3.5 max-w-[320px] mx-auto leading-relaxed">
            เพียงอัปโหลดรูปภาพ แล้วกดปุ่มนี้ ระบบ AI จะวิเคราะห์สินค้าเกษตรเพื่อเสกคำพาดหัวเด็ดๆ และโทนสีสวยงาม ให้คุณเลือกดาวน์โหลดใช้งานฟรีสะกดถูกต้อง 100%
          </p>
          <button
            type="button"
            onClick={handleGenerateAIAd}
            className="py-3 px-6 h-12 w-full bg-gradient-to-r from-[#2E5077] via-[#4DA1A9] to-[#79D7BE] text-white hover:from-[#1E3A5F] hover:to-[#56BEA3] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01] active:scale-95 cursor-pointer leading-none text-sm group"
            id="btn-run-ai-generator"
          >
            <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>วิเคราะห์รูปถ่ายและเสกคำโฆษณาด้วย AI ✨</span>
          </button>
        </div>
      )}

      {/* Loading Block */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center" id="ai-loading-panel">
          <div className="relative w-14 h-14 mb-4">
            {/* Double spinning rings */}
            <div className="absolute inset-0 rounded-full border-4 border-[#79D7BE]/20 border-t-[#2E5077] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-[#4DA1A9]/20 border-b-[#79D7BE] animate-spin duration-1000"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center text-[#4DA1A9]">
              <Sparkles className="w-4 h-4 fill-[#4DA1A9]" />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-700 animate-pulse px-4 max-w-[280px]">
            {LOADING_STATUS_MESSAGES[loadingStep]}
          </p>
          <p className="text-[10px] text-gray-400 mt-2">
            * ยินดีต้อนรับเข้าสู่วิถีตลาดดิจิทัล การนี้ใช้เวลาเพียงครู่...
          </p>
        </div>
      )}

      {/* Error Block */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs mb-4" id="ai-error-panel">
          <div className="flex items-start gap-1.5 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-bold">ระบบรายงานข้อผิดพลาดกัญญาประดิษฐ์:</span>
          </div>
          <p className="leading-relaxed text-gray-700 pl-5">{error}</p>
          <div className="mt-3 bg-white/70 p-2 rounded-lg border border-amber-100 text-[10px] text-gray-400 pl-4">
            คำแนะนำ: ตรวจสอบความถูกต้องของรูปถ่าย หรือ ตรวจสอบสิทธิ์การใช้งานพินแผง Secrets ว่ามีการใส่ค่า GEMINI_API_KEY ไว้อย่างถูกต้องหรือไม่
          </div>
          <button
            type="button"
            onClick={handleGenerateAIAd}
            className="mt-3.5 w-full py-1.5 text-xs bg-white text-gray-700 font-semibold border hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
            id="btn-retry-ai"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      )}

      {/* AI Success Result panel layout */}
      {aiResult && !loading && (
        <div className="space-y-4 text-left transition-all duration-500" id="ai-result-panel">
          {/* Demo Mode Info Banner */}
          {aiResult.isDemoMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex flex-col gap-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>💡 ทำงานในโหมดทดลองสาธิต (Demo Mode)</span>
              </div>
              <p className="text-[11px] text-gray-700 leading-relaxed">
                เนื่องจากระบบไม่พบรหัส API Key ใน Secrets หรือเซิร์ฟเวอร์ยังไม่ได้รับสิทธิ์เข้าถึง <strong>ระบบ SekRoop AI จึงใช้แม่แบบสร้างโฆษณาจำลองอัจฉริยะแบบออฟไลน์คุณภาพสูง</strong> เพื่อให้คุณสามารถทดลองเล่นและดาวน์โหลดรูปไปใช้จริงได้ทันทีโดยไม่ถูกบล็อกข้อผิดพลาด!
              </p>
              <div className="text-[10px] bg-white/60 p-2 rounded-lg border border-amber-100 text-gray-500 font-medium">
                <strong>วิธีปลดล็อก AI จริงแบบเรียลไทม์:</strong> กรุณาเข้าที่เมนู <strong>Settings &gt; Secrets</strong> ในแถบควบคุม AI Studio แล้วกรอกชื่อคีย์ <code>GEMINI_API_KEY</code> ด้วยรหัสผ่านของคุณ เพื่อเสกคำเขียนโดยตรงวิเคราะห์ภาพของแท้!
              </div>
            </div>
          )}

          {/* Analysis Product card summary */}
          <div className="bg-white rounded-xl p-3 border border-[#79D7BE]/20">
            <span className="text-[9px] bg-[#2E5077] text-white px-2 py-0.5 rounded-full font-bold">
              AI วิเคราะห์ประเภทผลผลิต
            </span>
            <h4 className="text-sm font-bold text-gray-800 mt-1 flex items-center gap-1.5 text-ellipsis overflow-hidden">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{aiResult.productType}</span>
            </h4>
            <p className="text-[11px] text-gray-500 italic mt-0.5 leading-relaxed">
              &ldquo;{aiResult.analysis}&rdquo;
            </p>
          </div>

          {/* AI Color Palette recommendation integration */}
          <div className="bg-white rounded-xl p-3 border border-[#79D7BE]/20 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h5 className="text-[11px] font-bold text-gray-700">
                ชุดโทนสีที่ AI แนะนำ ✨
              </h5>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="w-4 h-4 rounded-full border shadow-sm"
                  style={{ backgroundColor: aiResult.recommendedThemeColors.bgStart }}
                  title="สีเริ่มต้น"
                />
                <div
                  className="w-4 h-4 rounded-full border shadow-sm" 
                  style={{ backgroundColor: aiResult.recommendedThemeColors.bgEnd }}
                  title="สีสิ้นสุด"
                />
                <div
                  className="w-4 h-4 rounded shadow-sm" 
                  style={{ backgroundColor: aiResult.recommendedThemeColors.primary }}
                  title="สีอักษรหลัก"
                />
                <span className="text-[9px] text-gray-400 truncate">แมตช์ตามธรรมชาติผลไม้</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onApplyAICachedColors(aiResult.recommendedThemeColors)}
              className="text-[10px] bg-[#2E5077] hover:bg-[#4DA1A9] text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
              id="apply-colors-btn"
            >
              <span>ประยุกต์ใช้สีทันที</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 1. SELECTION Headlines array options */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
              เสกคำพาดหัวโฆษณา (กดเเพื่อพิมพ์ใส่ในรูปใบปลิว):
            </label>
            <div className="space-y-1.5" id="ai-headlines-list">
              {aiResult.suggestedHeadlines.map((headline, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectionHeadline(headline)}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-[#4DA1A9] bg-white hover:bg-[#4DA1A9]/5 text-xs text-gray-700 font-semibold cursor-pointer transition-all flex items-center justify-between group"
                  id={`headline-suggest-${idx}`}
                >
                  <span className="pr-2 leading-snug">{headline}</span>
                  <span className="text-[9px] text-[#4DA1A9] shrink-0 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    กดใช้รูปภาพ
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. SELECTION Subtitles array options */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
              เสกคำอธิบาย / โปรโมชั่น (กดเพื่ออัปเดตลงใบปลิว):
            </label>
            <div className="space-y-1.5" id="ai-subtitles-list">
              {aiResult.suggestedSubtitles.map((subtitle, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectionSubtitle(subtitle)}
                  className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-[#4DA1A9] bg-white hover:bg-[#4DA1A9]/5 text-[11px] text-gray-600 leading-relaxed cursor-pointer transition-all flex items-center justify-between group"
                  id={`subtitle-suggest-${idx}`}
                >
                  <span className="pr-2">{subtitle}</span>
                  <span className="text-[9px] text-[#4DA1A9] shrink-0 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    กดใช้รูปภาพ
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 3. SELECTION Social Captain copy text */}
          <div className="border-t border-[#79D7BE]/30 pt-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-[#4DA1A9]" />
                แคปชั่นพิมพ์โพสต์เพจขายของ (Social Post):
              </label>
              
              <button
                type="button"
                onClick={() => copyToClipboard(aiResult.socialCaption)}
                className="text-[10px] bg-white border text-gray-600 hover:text-[#4DA1A9] hover:border-[#4DA1A9] p-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                id="btn-copy-caption"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-bold">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>คัดลอกแคปชั่น</span>
                  </>
                )}
              </button>
            </div>

            <div className="w-full max-h-32 overflow-y-auto bg-white p-3 rounded-xl border border-gray-100 text-xs text-gray-600 pr-3.5 leading-relaxed font-mono select-text" id="ai-caption-text">
              {aiResult.socialCaption.split("\n").map((para, i) => (
                <p key={i} className="mb-1">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
