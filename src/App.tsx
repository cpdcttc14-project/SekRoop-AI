/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Leaf, ShoppingBag, HelpCircle, Phone, Tag, Store, Info, Check, MessageCircle, Circle, Zap, Square, Award, AlignLeft, AlignCenter, AlignRight, Image, FileText, Eye, Move } from "lucide-react";
import { AdData, AspectRatioType, ThemeStyleType, FrameMaskType, AIResult } from "./types";
import ImageUploader from "./components/ImageUploader";
import StyleSelector from "./components/StyleSelector";
import AIPositionController from "./components/AIPositionController";
import AdCanvas from "./components/AdCanvas";
import AIPromptPanel from "./components/AIPromptPanel";
import UnifiedStyleToolbar from "./components/UnifiedStyleToolbar";

export default function App() {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null>(null);
  const [mobileStep, setMobileStep] = useState<number>(1);

  // Core Advertisement State parameters with helpful defaults for Thai Farmers
  const [adData, setAdData] = useState<AdData>({
    farmName: "",
    productName: "",
    secondaryText: "",
    priceTag: "",
    contact: "",
    lineId: "",
    aspectRatio: "1:1",
    themeStyle: "natural",
    frameMask: "none",
    
    // Default product image placement values
    productScale: 1.0,
    productX: 0,
    productY: 0,
    productRotation: 0,
    
    // Badges details
    badges: [],
    selectedBadgeIndex1: 0,
    selectedBadgeIndex2: 1,
    customBadge1: "",
    customBadge2: "",
    
    primaryColor: "",
    secondaryColor: "",
    bgColorStart: "",
    bgColorEnd: "",

    // Font formatting defaults
    headlineFontSize: 64,
    headlineBold: true,
    headlineItalic: false,
    headlineUnderline: false,
    headlineXOffset: 0,
    headlineYOffset: 0,
    headlineAlign: "center",
    
    subtitleFontSize: 26,
    subtitleBold: false,
    subtitleItalic: false,
    subtitleUnderline: false,
    subtitleXOffset: 0,
    subtitleYOffset: 0,
    subtitleAlign: "center",

    // Farm name formatting & position defaults
    farmFontSize: 32,
    farmBold: true,
    farmItalic: false,
    farmUnderline: false,
    farmXOffset: 0,
    farmYOffset: 0,
    farmAlign: "center",

    // Contact formatting & position defaults
    contactFontSize: 26,
    contactBold: true,
    contactItalic: false,
    contactUnderline: false,
    contactXOffset: 0,
    contactYOffset: 0,
    contactAlign: "center",

    // Price tag formatting & position defaults
    priceFontSize: 38,
    priceBold: true,
    priceItalic: false,
    priceUnderline: false,
    priceXOffset: 0,
    priceYOffset: 0,
    priceTagStyle: "circle",
    priceScale: 1.0,
  });

  const [aiActive, setAiActive] = useState(false);
  const [aiResultCache, setAiResultCache] = useState<AIResult | null>(null);

  // Position callbacks
  const handlePositionChange = (x: number, y: number) => {
    setAdData((prev) => ({ ...prev, productX: x, productY: y }));
  };

  const resetPosition = () => {
    setAdData((prev) => ({
      ...prev,
      productScale: 1.0,
      productX: 0,
      productY: 0,
      productRotation: 0,
      frameMask: "none",
      farmXOffset: 0,
      farmYOffset: 0,
      headlineXOffset: 0,
      headlineYOffset: 0,
      subtitleXOffset: 0,
      subtitleYOffset: 0,
      contactXOffset: 0,
      contactYOffset: 0,
      priceXOffset: 0,
      priceYOffset: 0,
    }));
  };

  // State update handlers
  const updateField = (field: keyof AdData, value: any) => {
    setAdData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIHeadlineApply = (headline: string) => {
    updateField("productName", headline);
  };

  const handleAISubtitleApply = (subtitle: string) => {
    updateField("secondaryText", subtitle);
  };

  const handleAIColorsApply = (colors: { primary: string; secondary: string; bgStart: string; bgEnd: string }) => {
    setAdData((prev) => ({
      ...prev,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      bgColorStart: colors.bgStart,
      bgColorEnd: colors.bgEnd,
    }));
  };

  const handleAIBadgeApply = (badgeText: string, slotIndex: 1 | 2) => {
    if (slotIndex === 1) {
      updateField("customBadge1", badgeText);
    } else {
      updateField("customBadge2", badgeText);
    }
  };

  const handleAIResultLoaded = (result: AIResult) => {
    setAiResultCache(result);
    setAiActive(true);
    // Auto populate basic fields with AI suggestions if comfortable
    if (result.productType && !adData.productName) {
      updateField("productName", result.suggestedHeadlines[0]);
    }
    if (result.suggestedSubtitles && result.suggestedSubtitles.length > 0 && !adData.secondaryText) {
      updateField("secondaryText", result.suggestedSubtitles[0]);
    }
    if (result.badges && result.badges.length > 0) {
      updateField("customBadge1", result.badges[0]);
      updateField("customBadge2", result.badges[1]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4F0] text-gray-800 flex flex-col font-sans">
      {/* 1. Header Toolbar in Organic Agri-Fintech Colors */}
      <header className="sticky top-0 z-50 bg-[#2E5077] text-white border-b border-[#4DA1A9]/20 shadow-md px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#79D7BE] to-[#4DA1A9] flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-[#2E5077]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-[#79D7BE] to-[#F6F4F0] bg-clip-text text-transparent">
                  SekRoop AI
                </span>
                <span className="text-[9px] bg-[#79D7BE]/30 text-[#79D7BE] border border-[#79D7BE]/30 px-2 py-0.5 rounded-full font-bold">
                  CTTC 14 CHAINAT
                </span>
              </div>
              <p className="text-[10px] text-gray-300">
                เสกรูปสินค้าสู่โปสเตอร์โฆษณามืออาชีพ
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Container Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-28 lg:pb-8">
        
        {/* Mobile Step Header Tracker */}
        <div className="lg:hidden mb-4 bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#2E5077] text-white font-black text-sm flex items-center justify-center">
              {mobileStep}
            </span>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">ขั้นตอนปัจจุบัน</span>
              <span className="text-xs font-bold text-gray-800">
                {mobileStep === 1 && "📸 อัปโหลดรูปภาพสินค้าเกษตร"}
                {mobileStep === 2 && "🪄 ปรึกษาคู่หูอัจฉริยะด้วยระบบ AI"}
                {mobileStep === 3 && "✍ กรอกรายละเอียดข้อมูลโฆษณา"}
                {mobileStep === 4 && "📐 ปรับแต่งและจัดตำแหน่งรูปสินค้า"}
                {mobileStep === 5 && "🎨 ตรวจสอบตัวอย่างและดาวน์โหลด"}
              </span>
            </div>
          </div>
          
          {/* Simple percentage tracker */}
          <div className="text-right">
            <span className="text-xs font-black text-[#4DA1A9]">{mobileStep * 20}%</span>
            <div className="w-16 bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-[#4DA1A9] h-full transition-all duration-300" 
                style={{ width: `${mobileStep * 20}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: CREATOR PANEL & CONTROLS (col-span-1 lg:col-span-7) */}
          <div className={`lg:col-span-7 space-y-6 order-2 lg:order-1 ${(mobileStep === 4 || mobileStep === 5) ? "hidden lg:block" : "block"}`}>
            
            {/* STEP 1: UPLOAD & POSITIONING (MOBILE VIEW 1) */}
            <div className={mobileStep === 1 ? "space-y-6" : "hidden lg:space-y-6 lg:block"}>
              {/* Step A: Picture Upload */}
              <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5 mb-2">
                  <span className="w-6 h-6 rounded-full bg-[#4DA1A9]/20 text-[#4DA1A9] font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-[#2E5077] uppercase tracking-wide">
                    อัปโหลดรูปภาพสินค้าเกษตร
                  </h2>
                </div>
                
                <ImageUploader
                  onImageSelected={setSelectedImageSrc}
                  selectedImageSrc={selectedImageSrc}
                />
              </section>

              {/* Step E (Moved Up): Slider manual Position controllers (Desktop only, mobile handles this in step 4) */}
              <section className="hidden lg:block">
                <AIPositionController
                  scale={adData.productScale}
                  onScaleChange={(s) => updateField("productScale", s)}
                  xOffset={adData.productX}
                  onXOffsetChange={(x) => handlePositionChange(x, adData.productY)}
                  yOffset={adData.productY}
                  onYOffsetChange={(y) => handlePositionChange(adData.productX, y)}
                  rotation={adData.productRotation}
                  onRotationChange={(r) => updateField("productRotation", r)}
                  frameMask={adData.frameMask}
                  onFrameMaskChange={(m) => updateField("frameMask", m)}
                />
              </section>

              {/* Mobile next helper button */}
              <div className="lg:hidden mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="w-full bg-[#4DA1A9] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>ขั้นตอนถัดไป: เสกด้วย AI ✨</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STEP 2: AI COPILOT GENERATOR (MOBILE VIEW 2) */}
            <div className={mobileStep === 2 ? "space-y-6" : "hidden lg:space-y-6 lg:block"}>
              {/* Step B: AI Slogan Copilot Spark block */}
              <section>
                <AIPromptPanel
                  selectedImageSrc={selectedImageSrc}
                  farmName={adData.farmName}
                  productName={adData.productName}
                  secondaryText={adData.secondaryText}
                  onSelectionHeadline={handleAIHeadlineApply}
                  onSelectionSubtitle={handleAISubtitleApply}
                  onApplyAICachedColors={handleAIColorsApply}
                  onApplyAIBadge={handleAIBadgeApply}
                  onAIResultLoaded={handleAIResultLoaded}
                />
              </section>

              {/* Mobile navigation helper buttons */}
              <div className="lg:hidden mt-4 pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold text-xs px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-gray-200"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="flex-1 bg-[#2E5077] text-white font-bold text-xs px-4 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>ถัดไป: กรอกข้อมูลโฆษณา</span>
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* STEP 3: DETAILS & THEMING (MOBILE VIEW 3) */}
            <div className={mobileStep === 3 ? "space-y-6" : "hidden lg:space-y-6 lg:block"}>
              {/* Step C: Core Field Details Inputs */}
              <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#4DA1A9]/20 text-[#4DA1A9] font-bold text-xs flex items-center justify-center font-sans">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-[#2E5077] uppercase tracking-wide">
                    กรอกข้อมูลโฆษณา
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Farm name Input */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-gray-400" />
                      ชื่อสวน / ร้านค้าแบรนด์ของคุณ
                    </label>
                    <textarea
                      value={adData.farmName}
                      onChange={(e) => updateField("farmName", e.target.value)}
                      onFocus={() => setActiveLayer("farm")}
                      placeholder="เช่น สวนป้านิ่ม มะม่วงหวาน&#10;ไร่วัฒนาออแกนิก"
                      maxLength={64}
                      rows={2}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]"
                      id="input-farm-name"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">ตัวอักษรไม่เกิน 64 ตัว สามารถขึ้นบรรทัดใหม่ได้</span>
                  </div>

                  {/* Product Name Input */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                      ข้อความพาดหัว / ชื่อตัวสินค้าสินค้า <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={adData.productName}
                      onChange={(e) => updateField("productName", e.target.value)}
                      onFocus={() => setActiveLayer("headline")}
                      placeholder="เช่น ทุเรียนหมอนทอง&#10;คัดเกรดพรีเมียม"
                      maxLength={80}
                      rows={2}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]"
                      id="input-product-name"
                      required
                    />
                  </div>

                 {/* Slogan Input */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                    คำอธิบายเสริมโฆษณา / สรรพคุณ / โปรโมชั่น
                  </label>
                  <textarea
                    value={adData.secondaryText}
                    onChange={(e) => updateField("secondaryText", e.target.value)}
                    onFocus={() => setActiveLayer("subtitle")}
                    placeholder="เช่น หอมหวานรสชาติเป็นเอกลักษณ์ แปรรูปจากวิถีธรรมชาติ ปลอดภัยไร้สารเคมีตกค้าง 100%"
                    maxLength={100}
                    rows={2}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]"
                    id="input-secondary-text"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price tag input */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      ป้ายราคา (เช่น ฿150/กก., กล่องละ 350)
                    </label>
                    <input
                      type="text"
                      value={adData.priceTag}
                      onChange={(e) => updateField("priceTag", e.target.value)}
                      onFocus={() => setActiveLayer("price")}
                      placeholder="เช่น 150.-/กก., ลดเหลือ 99"
                      maxLength={10}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]"
                      id="input-price-tag"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">ปล่อยว่างหากไม่ต้องการแสดงราคาบนรูป</span>
                  </div>
                  </div>

                  {/* Contact channel */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          เบอร์โทรศัพท์ติดต่อกลับ
                        </label>
                        <input
                          type="text"
                          value={adData.contact}
                          onChange={(e) => updateField("contact", e.target.value)}
                          onFocus={() => setActiveLayer("contact")}
                          placeholder="เช่น 081-234-5678"
                          maxLength={45}
                          className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]"
                          id="input-contact"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                          ไอดีไลน์ (LINE ID)
                        </label>
                        <input
                          type="text"
                          value={adData.lineId}
                          onChange={(e) => updateField("lineId", e.target.value)}
                          onFocus={() => setActiveLayer("contact")}
                          placeholder="เช่น @SookJaiFarm"
                          maxLength={45}
                          className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DA1A9]"
                          id="input-line-id"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step D: Choose Dimension and Theme style */}
              <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
                
                {/* Aspect ratio */}
                <div>
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2.5 mb-3.5">
                    <span className="w-6 h-6 rounded-full bg-[#4DA1A9]/20 text-[#4DA1A9] font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h2 className="text-sm font-bold text-[#2E5077] uppercase tracking-wide">
                      ขนาดและสัดส่วนภาพโฆษณา
                    </h2>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5" id="aspect-ratio-selector">
                    {(["1:1", "9:16", "16:9"] as AspectRatioType[]).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => updateField("aspectRatio", ratio)}
                        className={`py-3 rounded-xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                          adData.aspectRatio === ratio
                            ? "border-[#4DA1A9] bg-[#4DA1A9]/5 text-[#2E5077] ring-1 ring-[#4DA1A9]"
                            : "border-gray-100 text-gray-500 hover:bg-gray-50"
                        }`}
                        id={`ratio-btn-${ratio.replace(":", "-")}`}
                      >
                        <span className="text-sm font-black">{ratio}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {ratio === "1:1"
                            ? "เฟสบุ๊ค/ไอจีทั่วไป"
                            : ratio === "9:16"
                            ? "ติ๊กต็อก/สตอรี่/ริลส์"
                            : "แบนเนอร์โพสต์หน้าเพจ"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Selector */}
                <StyleSelector
                  selectedStyle={adData.themeStyle}
                  onChange={(style) => {
                    updateField("themeStyle", style);
                    // Reset custom colors to let canvas draw native themes cleanly
                    setAdData((prev) => ({
                      ...prev,
                      themeStyle: style,
                      primaryColor: "",
                      secondaryColor: "",
                      bgColorStart: "",
                      bgColorEnd: "",
                    }));
                  }}
                />
              </section>

              {/* Mobile navigation helper buttons */}
              <div className="lg:hidden mt-4 pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold text-xs px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-gray-200"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(4)}
                  className="flex-1 bg-[#4DA1A9] text-white font-bold text-xs px-4 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>ถัดไป: ปรับตำแหน่งรูป</span>
                  <Move className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: LIVE PREMIUM PREVIEW & HELP TIPS (col-span-1 lg:col-span-5) */}
          <div className={`lg:col-span-5 lg:sticky lg:top-[85px] space-y-6 order-1 lg:order-2 ${(mobileStep === 4 || mobileStep === 5) ? "block" : "hidden lg:block"}`}>
            
            {/* ปรับแต่งและจัดตำแหน่งรูปสินค้า (แสดงเฉพาะบนมือถือในขั้นตอนที่ 4) */}
            <div className={`lg:hidden ${mobileStep === 4 ? "block" : "hidden"}`}>
              <AIPositionController
                scale={adData.productScale}
                onScaleChange={(s) => updateField("productScale", s)}
                xOffset={adData.productX}
                onXOffsetChange={(x) => handlePositionChange(x, adData.productY)}
                yOffset={adData.productY}
                onYOffsetChange={(y) => handlePositionChange(adData.productX, y)}
                rotation={adData.productRotation}
                onRotationChange={(r) => updateField("productRotation", r)}
                frameMask={adData.frameMask}
                onFrameMaskChange={(m) => updateField("frameMask", m)}
              />
            </div>

            {/* Unified Formatting & Offset Toolbar above Canvas (แสดงเฉพาะบนมือถือในขั้นตอนที่ 5) */}
            <div className={mobileStep === 5 ? "block" : "hidden lg:block"}>
              <UnifiedStyleToolbar
                data={adData}
                activeLayer={activeLayer}
                onSelectLayer={setActiveLayer}
                onUpdateField={updateField}
              />
            </div>

            {/* Live Canvas panel (แสดงเฉพาะขั้นตอนที่ 5 บนมือถือ) */}
            <div className={mobileStep === 5 ? "block" : "hidden lg:block"}>
              <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <AdCanvas
                  data={adData}
                  selectedImageSrc={selectedImageSrc}
                  activeLayer={activeLayer}
                  onSelectLayer={setActiveLayer}
                  onPositionChange={handlePositionChange}
                  onPricePositionChange={(x, y) => {
                    setAdData((prev) => ({ ...prev, priceXOffset: x, priceYOffset: y }));
                  }}
                  onFarmPositionChange={(x, y) => {
                    setAdData((prev) => ({ ...prev, farmXOffset: x, farmYOffset: y }));
                  }}
                  onHeadlinePositionChange={(x, y) => {
                    setAdData((prev) => ({ ...prev, headlineXOffset: x, headlineYOffset: y }));
                  }}
                  onSubtitlePositionChange={(x, y) => {
                    setAdData((prev) => ({ ...prev, subtitleXOffset: x, subtitleYOffset: y }));
                  }}
                  onContactPositionChange={(x, y) => {
                    setAdData((prev) => ({ ...prev, contactXOffset: x, contactYOffset: y }));
                  }}
                  onResetPosition={resetPosition}
                  onSizeChange={(layer, sizeOrScale) => {
                    setAdData((prev) => {
                      switch (layer) {
                        case "farm":
                          return { ...prev, farmFontSize: sizeOrScale };
                        case "headline":
                          return { ...prev, headlineFontSize: sizeOrScale };
                        case "subtitle":
                          return { ...prev, subtitleFontSize: sizeOrScale };
                        case "contact":
                          return { ...prev, contactFontSize: sizeOrScale };
                        case "price":
                          return { ...prev, priceScale: sizeOrScale };
                        case "product":
                          return { ...prev, productScale: sizeOrScale };
                        default:
                          return prev;
                      }
                    });
                  }}
                />
              </section>
            </div>

            {/* Help guidelines & tips for farmers (แสดงเฉพาะบนมือถือในขั้นตอนที่ 5) */}
            <div className={mobileStep === 5 ? "block" : "hidden lg:block"}>
              <section className="bg-gradient-to-br from-[#2E5077] to-[#1C2E46] text-white rounded-2xl p-5 shadow-md">
                <h3 className="text-xs font-bold text-[#79D7BE] mb-2 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>คำแนะนำสั้นๆ สำหรับคนทำเพจขายผลไม้ / อาหาร</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-200 font-medium pl-1 leading-relaxed">
                  <li className="flex items-start gap-1">
                    <span className="text-[#79D7BE] shrink-0 mt-0.5">✔</span>
                    <span>เลือกธีม <b>"พรีเมียมหรูหรา"</b> สำหรับสินค้าที่มีราคาหรือต้องการอัปเกรดเพื่อจัดส่งในรูปแบบกล่องของขวัญ</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-[#79D7BE] shrink-0 mt-0.5">✔</span>
                    <span>เลือกสัดส่วน <b>"9:16"</b> หากต้องการทำโฆษณาไปโพสต์ใส่หน้าวีดีโอ Reels ในเฟสบุ๊ค หรือ TikTok</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-[#79D7BE] shrink-0 mt-0.5">✔</span>
                    <span>หากภาพถ่ายของคุณมีโต๊ะหรือรอยมีดรอบๆ ให้เลือกหน้ากากรูปภาพเป็น <b>"วงกลม"</b> หรือ <b>"ทองคู่"</b> เพื่อให้ภาพดูสะอาดตาทันทีเหมือนติดฉลากหรู</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-[#79D7BE] shrink-0 mt-0.5">✔</span>
                    <span>อย่าลืมกดปุ่ม <b>"วิเคราะห์รูปถ่ายและเสกคำโฆษณาด้วย AI"</b> เพื่อให้ปัญญาประดิษฐ์ช่วยเสกแคปชั่นยอดฮิตและแต่งรูปให้ตัดสะกดอย่างประณีตไม่มีพิมพ์ผิด</span>
                  </li>
                </ul>
              </section>
            </div>

            {/* Mobile navigation helper buttons for Step 4 */}
            {mobileStep === 4 && (
              <div className="lg:hidden mt-4 pt-2 pb-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold text-xs px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  ย้อนกลับไปแก้ไขข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(5)}
                  className="flex-1 bg-[#2E5077] text-white font-bold text-xs px-4 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>ถัดไป: ดูตัวอย่างโฆษณา</span>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile navigation helper buttons for Step 5 */}
            {mobileStep === 5 && (
              <div className="lg:hidden mt-4 pt-2 pb-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMobileStep(4)}
                  className="w-full bg-white border border-gray-200 text-gray-600 font-bold text-xs px-4 py-3.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  ย้อนกลับไปปรับตำแหน่งรูปสินค้า
                </button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* 3. Footer Copyright Info carefully composed */}
      <footer className="hidden lg:block bg-gradient-to-b from-gray-50 to-gray-100/80 border-t border-gray-200 py-8 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-3">
          <p className="font-bold text-gray-700 text-sm leading-relaxed">
            ศูนย์ถ่ายทอดเทคโนโลยีการสหกรณ์ที่ 14 จังหวัดชัยนาท<br />
            กรมส่งเสริมสหกรณ์
          </p>
          <p className="text-gray-500">
            ระบบจัดสร้างเพื่อช่วยเหลือเกษตรกรรมไทยก้าวไกลดั่งใจปรารถนา &copy; {new Date().getFullYear()} สงวนลิขสิทธิ์
          </p>

        </div>
      </footer>

      {/* 4. Mobile Navigation Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 py-2.5 px-3 pb-safe">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {/* Step 1 button */}
          <button
            onClick={() => setMobileStep(1)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
              mobileStep === 1
                ? "text-[#2E5077] bg-[#4DA1A9]/10 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Image className={`w-5 h-5 ${mobileStep === 1 ? "text-[#4DA1A9]" : ""}`} />
            <span className="text-[10px]">1. รูปสินค้า</span>
          </button>

          {/* Step 2 button */}
          <button
            onClick={() => setMobileStep(2)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
              mobileStep === 2
                ? "text-[#2E5077] bg-[#4DA1A9]/10 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Sparkles className={`w-5 h-5 ${mobileStep === 2 ? "text-[#4DA1A9]" : ""}`} />
            <span className="text-[10px]">2. เสกด้วย AI</span>
          </button>

          {/* Step 3 button */}
          <button
            onClick={() => setMobileStep(3)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
              mobileStep === 3
                ? "text-[#2E5077] bg-[#4DA1A9]/10 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <FileText className={`w-5 h-5 ${mobileStep === 3 ? "text-[#4DA1A9]" : ""}`} />
            <span className="text-[10px]">3. ข้อความ</span>
          </button>

          {/* Step 4 button */}
          <button
            onClick={() => setMobileStep(4)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
              mobileStep === 4
                ? "text-[#2E5077] bg-[#4DA1A9]/10 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Move className={`w-5 h-5 ${mobileStep === 4 ? "text-[#4DA1A9]" : ""}`} />
            <span className="text-[10px]">4. จัดตำแหน่ง</span>
          </button>

          {/* Step 5 button */}
          <button
            onClick={() => setMobileStep(5)}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all ${
              mobileStep === 5
                ? "text-[#2E5077] bg-[#4DA1A9]/10 font-bold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Eye className={`w-5 h-5 ${mobileStep === 5 ? "text-[#4DA1A9]" : ""}`} />
            <span className="text-[10px]">5. ตัวอย่าง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
