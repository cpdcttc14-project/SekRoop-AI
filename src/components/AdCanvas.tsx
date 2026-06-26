/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, MouseEvent, TouchEvent } from "react";
import { Download, Sparkles, RefreshCw, Smartphone, Eye, CheckCircle, X, Info } from "lucide-react";
import { AdData, AspectRatioType, ThemeStyleType, FrameMaskType } from "../types";

interface AdCanvasProps {
  data: AdData;
  selectedImageSrc: string | null;
  onPositionChange: (x: number, y: number) => void;
  onPricePositionChange?: (x: number, y: number) => void;
  onFarmPositionChange?: (x: number, y: number) => void;
  onHeadlinePositionChange?: (x: number, y: number) => void;
  onSubtitlePositionChange?: (x: number, y: number) => void;
  onContactPositionChange?: (x: number, y: number) => void;
  onResetPosition: () => void;
  activeLayer?: "product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null;
  onSelectLayer?: (layer: "product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null) => void;
  onSizeChange?: (layer: "product" | "price" | "farm" | "headline" | "subtitle" | "contact", sizeOrScale: number) => void;
}

export default function AdCanvas({
  data,
  selectedImageSrc,
  onPositionChange,
  onPricePositionChange,
  onFarmPositionChange,
  onHeadlinePositionChange,
  onSubtitlePositionChange,
  onContactPositionChange,
  onResetPosition,
  activeLayer = null,
  onSelectLayer,
  onSizeChange,
}: AdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRectRef = useRef<DOMRect | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<"product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasStartPos, setCanvasStartPos] = useState({ x: 0, y: 0 });
  const [isSuccessDownloading, setIsSuccessDownloading] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileImgData, setMobileImgData] = useState("");

  // States for interactive corner resizing of layers
  const [isResizing, setIsResizing] = useState(false);
  const [resizingTarget, setResizingTarget] = useState<"product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null>(null);
  const [resizingStartVal, setResizingStartVal] = useState(1.0);
  const [resizingCenter, setResizingCenter] = useState({ x: 0, y: 0 });
  const [resizingStartDist, setResizingStartDist] = useState(1.0);

  // Helper to build standardized single-spaced canvas font strings
  const getFontString = (bold: boolean, italic: boolean, size: number, family: string = "'Kanit', sans-serif") => {
    const styleStr = italic ? "italic" : "";
    const weightStr = bold ? "bold" : "";
    const sizeStr = `${Math.round(size)}px`;
    return [styleStr, weightStr, sizeStr, family].filter(Boolean).join(" ");
  };

  // Load product image when source changes
  useEffect(() => {
    if (!selectedImageSrc) {
      setImageObj(null);
      setIsImageLoaded(false);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedImageSrc;
    img.onload = () => {
      setImageObj(img);
      setIsImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load user uploaded image in canvas.");
    };
  }, [selectedImageSrc]);

  // Redraw canvas whenever parameters, image or active selection changes
  useEffect(() => {
    drawAd();
  }, [data, imageObj, isImageLoaded, activeLayer]);

  // Create a stable ref to drawAd to avoid stale closures in setTimeout, setInterval, or fonts.ready Promises
  const drawAdRef = useRef<() => void>(() => {});
  useEffect(() => {
    drawAdRef.current = drawAd;
  }, [data, imageObj, isImageLoaded, activeLayer]);

  // Force redraws specifically for font rendering once the custom Kanit webfont is loaded
  useEffect(() => {
    if (document.fonts && typeof document.fonts.load === "function") {
      const fontsToLoad = [
        "16px Kanit",
        "bold 16px Kanit",
        "italic 16px Kanit",
        "italic bold 16px Kanit",
        "500 16px Kanit",
        "700 16px Kanit",
        "italic 500 16px Kanit",
        "italic 700 16px Kanit"
      ];
      
      Promise.all(fontsToLoad.map(f => document.fonts.load(f)))
        .then(() => {
          drawAdRef.current();
        })
        .catch(err => {
          console.warn("Could not preload Kanit fonts, using fallback redraw timers", err);
        });

      if (document.fonts.ready && typeof document.fonts.ready.then === "function") {
        document.fonts.ready.then(() => {
          drawAdRef.current();
        });
      }
    }

    const intervalId = setInterval(() => {
      if (document.fonts && typeof document.fonts.check === "function" && document.fonts.check("1em Kanit")) {
        drawAdRef.current();
        clearInterval(intervalId);
      }
    }, 250);

    const timers = [100, 300, 600, 1200, 2000, 4000].map(delay =>
      setTimeout(() => {
        drawAdRef.current();
      }, delay)
    );

    return () => {
      clearInterval(intervalId);
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  // Dimension helpers depending on Aspect Ratio
  const getCanvasDimensions = (ratio: AspectRatioType) => {
    switch (ratio) {
      case "9:16":
        return { width: 1080, height: 1920 };
      case "16:9":
        return { width: 1920, height: 1080 };
      case "1:1":
      default:
        return { width: 1080, height: 1080 };
    }
  };

  const drawAd = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = getCanvasDimensions(data.aspectRatio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // --- 1. Draw Background Gradient ---
    let bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    
    // Resolve theme-specific defaults if custom colors aren't loaded or active
    let bgStart = data.bgColorStart;
    let bgEnd = data.bgColorEnd;
    let primeColor = data.primaryColor;
    let secColor = data.secondaryColor;

    if (!bgStart || !bgEnd) {
      switch (data.themeStyle) {
        case "natural":
          bgStart = "#F3FAF7";
          bgEnd = "#D5EFE3";
          primeColor = primeColor || "#1B4332";
          secColor = secColor || "#40916C";
          break;
        case "premium":
          bgStart = "#1C2E46";
          bgEnd = "#0B131C";
          primeColor = primeColor || "#FFD700";
          secColor = secColor || "#E6C15C";
          break;
        case "rustic":
          bgStart = "#FAF5EF";
          bgEnd = "#E3D1BE";
          primeColor = primeColor || "#5C4033";
          secColor = secColor || "#8B5A2B";
          break;
        case "market":
          bgStart = "#FFF8EA";
          bgEnd = "#FFE6C7";
          primeColor = primeColor || "#D11A2A";
          secColor = secColor || "#E4A115";
          break;
        case "minimal":
          bgStart = "#FAFAFA";
          bgEnd = "#E4E4E7";
          primeColor = primeColor || "#09090B";
          secColor = secColor || "#71717A";
          break;
        case "retro-neon":
          bgStart = "#18052B";
          bgEnd = "#07010C";
          primeColor = primeColor || "#FF037C";
          secColor = secColor || "#00F5FF";
          break;
        case "pastel-sweet":
          bgStart = "#FFF5F8";
          bgEnd = "#EBE6FA";
          primeColor = primeColor || "#FF1493";
          secColor = secColor || "#4B0082";
          break;
        case "bold-future":
          bgStart = "#121214";
          bgEnd = "#202026";
          primeColor = primeColor || "#FF5722";
          secColor = secColor || "#FFEB3B";
          break;
      }
    }

    bgGradient.addColorStop(0, bgStart);
    bgGradient.addColorStop(1, bgEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // --- 2. Draw Decorative Template Elements ---
    drawDecorations(ctx, width, height, data.themeStyle, primeColor, secColor);

    // --- 3. Draw Product Image (with masks & translations) ---
    const centerX = width / 2 + data.productX;
    const centerY = height * 0.52 + data.productY; // Anchored slightly center-lower to leave room for text header

    if (imageObj && isImageLoaded) {
      ctx.save();

      // Applying Mask Clip Path
      const r = Math.min(width, height) * 0.28;
      
      if (data.frameMask === "circle" || data.frameMask === "gold-frame") {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.clip();
      } else if (data.frameMask === "rounded") {
        const sideW = r * 1.9;
        ctx.beginPath();
        ctx.roundRect(centerX - sideW / 2, centerY - sideW / 2, sideW, sideW, r * 0.18);
        ctx.clip();
      } else if (data.frameMask === "oval") {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * 1.25, 0, 0, Math.PI * 2);
        ctx.clip();
      }

      // Draw translated / rotated product image
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((data.productRotation * Math.PI) / 180);

      // Fit product beautifully
      const scaleFactor = data.productScale;
      const imgAspect = imageObj.width / imageObj.height;
      let drawW, drawH;
      if (imgAspect > 1) {
        drawW = width * 0.7 * scaleFactor;
        drawH = drawW / imgAspect;
      } else {
        drawH = height * 0.45 * scaleFactor;
        drawW = drawH * imgAspect;
      }

      ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore(); // restore image transform
      ctx.restore(); // restore mask clip

      // Draw Outer Frame Overlay depending on style
      if (data.frameMask === "gold-frame") {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#ECC15C"; // Gold
        ctx.lineWidth = 14;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, r - 12, 0, Math.PI * 2);
        ctx.strokeStyle = "#FCF3CF"; // Light Gold Inner Ring
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      } else if (data.frameMask === "circle") {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = primeColor || "#4DA1A9";
        ctx.lineWidth = 8;
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      } else if (data.frameMask === "rounded") {
        const sideW = r * 1.9;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(centerX - sideW / 2, centerY - sideW / 2, sideW, sideW, r * 0.18);
        ctx.strokeStyle = primeColor || "#4DA1A9";
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      } else if (data.frameMask === "oval") {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * 1.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = secColor || "#79D7BE";
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      } else if (data.frameMask === "none") {
        // Subtle drop shadow for raw un-masked photo to separate from background
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
        ctx.restore();
      }
    } else {
      // Draw Placeholder if no image uploaded
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.setLineDash([12, 8]);
      ctx.stroke();

      ctx.fillStyle = "#A1A1AA";
      ctx.font = getFontString(true, false, 22);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("กรุณาเพิ่มรูปสินค้า", centerX, centerY - 15);
      ctx.fillText("ของคุณด้านซ้าย", centerX, centerY + 15);
      ctx.restore();
    }

    // --- 4. Draw Badges (Removed as requested) ---
    // drawBadgesOnCanvas(ctx, centerX, centerY, width, height, data);

    // --- 5. Draw Brand Name (ชื่อสวนเกษตร) ---
    const farmNameText = data.farmName || "สวนออร์แกนิกรุ่นใหม่";
    ctx.save();
    
    const fSize = data.farmFontSize || 32;
    const farmAlign = data.farmAlign || "center";

    ctx.font = getFontString(data.farmBold !== false, !!data.farmItalic, fSize);
    ctx.textAlign = farmAlign;
    ctx.textBaseline = "alphabetic";
    
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0,0,0,0.15)";

    if (data.themeStyle === "premium") {
      ctx.fillStyle = "#FFD700";
    } else {
      ctx.fillStyle = primeColor || "#2E5077";
    }

    let farmX = width / 2;
    if (farmAlign === "left") {
      farmX = width * 0.1;
    } else if (farmAlign === "right") {
      farmX = width * 0.9;
    }
    farmX += (data.farmXOffset || 0);
    const farmY = height * 0.08 + (data.farmYOffset || 0);

    const farmLines = farmNameText.split("\n");
    const farmLineSpacing = fSize * 1.35;

    farmLines.forEach((lineText, index) => {
      // Keep "✦" decorations for standard single-line or on the first line
      const displayText = (farmLines.length === 1 && !lineText.startsWith("✦")) 
        ? `✦ ${lineText} ✦` 
        : lineText;
      const currentY = farmY + index * farmLineSpacing;
      ctx.fillText(displayText, farmX, currentY);

      if (data.farmUnderline) {
        const textWidth = ctx.measureText(displayText).width;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = Math.max(1.5, fSize / 16);
        ctx.beginPath();
        if (farmAlign === "left") {
          ctx.moveTo(farmX, currentY + 8);
          ctx.lineTo(farmX + textWidth, currentY + 8);
        } else if (farmAlign === "right") {
          ctx.moveTo(farmX - textWidth, currentY + 8);
          ctx.lineTo(farmX, currentY + 8);
        } else {
          ctx.moveTo(farmX - textWidth / 2, currentY + 8);
          ctx.lineTo(farmX + textWidth / 2, currentY + 8);
        }
        ctx.stroke();
      }
    });

    ctx.restore();

    // --- 6. Draw Main Headline (ชื่อสินค้าผลผลิต / พาดหัวทอง) ---
    const titleText = data.productName || "ผลผลิตไทย สดใหม่คัดเกรดพิเศษ";
    const subTitleText = data.secondaryText || "ส่งตรงสุขภาพจากฟาร์มสุขใจถึงมือคุณ ปลอดภัยไร้สารเคมี 100%";
    
    ctx.save();
    
    let headlineSize = data.headlineFontSize || 48;
    if (!data.headlineFontSize) {
      if (titleText.length > 24) {
        headlineSize = 34;
      } else if (titleText.length > 14) {
        headlineSize = 40;
      }
    }

    const headlineAlign = data.headlineAlign || "center";

    ctx.font = getFontString(data.headlineBold !== false, !!data.headlineItalic, headlineSize);
    ctx.textAlign = headlineAlign;
    ctx.textBaseline = "alphabetic";

    let titleX = width / 2;
    if (headlineAlign === "left") {
      titleX = width * 0.1;
    } else if (headlineAlign === "right") {
      titleX = width * 0.9;
    }
    titleX += (data.headlineXOffset || 0);
    const titleY = height * 0.17 + (data.headlineYOffset || 0);

    if (data.themeStyle === "premium") {
      // Elegant gold gradient font
      let textGradient = ctx.createLinearGradient(0, titleY - 40, 0, titleY + 60);
      textGradient.addColorStop(0, "#FFF9E6");
      textGradient.addColorStop(0.5, "#ECC15C");
      textGradient.addColorStop(1, "#A07810");
      ctx.fillStyle = textGradient;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
    } else if (data.themeStyle === "natural") {
      ctx.fillStyle = primeColor || "#1B4332";
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 4;
    } else if (data.themeStyle === "market") {
      // Bold red title with high shadow contrast
      ctx.fillStyle = primeColor || "#D11A2A";
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 4;
    } else if (data.themeStyle === "retro-neon") {
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FF037C";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 0;
    } else if (data.themeStyle === "pastel-sweet") {
      ctx.fillStyle = primeColor || "#FF1493";
      ctx.shadowColor = "#FFFFFF";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 1;
    } else if (data.themeStyle === "bold-future") {
      ctx.fillStyle = primeColor || "#FF5722";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.fillStyle = primeColor || "#2E5077";
    }

    const titleLines = titleText.split("\n");
    const titleLineSpacing = headlineSize * 1.35;

    titleLines.forEach((line, index) => {
      const currentY = titleY + index * titleLineSpacing;

      if (data.themeStyle === "market") {
        ctx.save();
        ctx.font = getFontString(data.headlineBold !== false, !!data.headlineItalic, headlineSize);
        ctx.textAlign = headlineAlign;
        ctx.textBaseline = "alphabetic";
        const textWidth = ctx.measureText(line).width;

        ctx.fillStyle = "#F9E79F";
        const bannerX = headlineAlign === "left" ? titleX - 30 : headlineAlign === "right" ? titleX - textWidth - 30 : titleX - textWidth / 2 - 30;
        ctx.fillRect(bannerX, currentY - headlineSize + 10, textWidth + 60, headlineSize + 15);
        ctx.fillStyle = "#333333";
        ctx.lineWidth = 3;
        ctx.strokeRect(bannerX, currentY - headlineSize + 10, textWidth + 60, headlineSize + 15);
        ctx.restore();
      }

      ctx.font = getFontString(data.headlineBold !== false, !!data.headlineItalic, headlineSize);
      ctx.textAlign = headlineAlign;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(line, titleX, currentY);

      // Draw Underline if enabled
      if (data.headlineUnderline) {
        const textWidth = ctx.measureText(line).width;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = Math.max(2, headlineSize / 16);
        ctx.beginPath();
        if (headlineAlign === "left") {
          ctx.moveTo(titleX, currentY + 12);
          ctx.lineTo(titleX + textWidth, currentY + 12);
        } else if (headlineAlign === "right") {
          ctx.moveTo(titleX - textWidth, currentY + 12);
          ctx.lineTo(titleX, currentY + 12);
        } else {
          ctx.moveTo(titleX - textWidth / 2, currentY + 12);
          ctx.lineTo(titleX + textWidth / 2, currentY + 12);
        }
        ctx.stroke();
      }
    });

    ctx.restore();

    // --- 7. Draw Subtitle / Secondary Slogan (คำอธิบายขยายความ) ---
    ctx.save();
    
    const sSize = data.subtitleFontSize || 26;
    const subtitleAlign = data.subtitleAlign || "center";

    ctx.font = getFontString(!!data.subtitleBold, !!data.subtitleItalic, sSize);
    ctx.textAlign = subtitleAlign;
    ctx.textBaseline = "alphabetic";
    
    if (data.themeStyle === "premium") {
      ctx.fillStyle = "#E5E7EB"; // Silver grey
    } else if (data.themeStyle === "retro-neon") {
      ctx.fillStyle = "#DFEAF2"; // Neon glowing aura content text
    } else if (data.themeStyle === "pastel-sweet") {
      ctx.fillStyle = "#330066"; // Cozy sweet dark violet text for cozy contrast
    } else if (data.themeStyle === "bold-future") {
      ctx.fillStyle = "#DDE2E5"; // Light metallic grey
    } else {
      ctx.fillStyle = "#4B5563"; // slate grey
    }

    let subtitleX = width / 2;
    if (subtitleAlign === "left") {
      subtitleX = width * 0.1;
    } else if (subtitleAlign === "right") {
      subtitleX = width * 0.9;
    }
    subtitleX += (data.subtitleXOffset || 0);
    const subtitleY = height * 0.23 + (data.subtitleYOffset || 0);
    
    // Setup the lines to draw
    const subLines: string[] = [];
    subTitleText.split("\n").forEach((manualLine) => {
      if (!subTitleText.includes("\n") && manualLine.length > 55) {
        const mid = Math.floor(manualLine.length / 2);
        subLines.push(manualLine.substring(0, mid));
        subLines.push(manualLine.substring(mid));
      } else {
        subLines.push(manualLine);
      }
    });

    const sLineSpacing = sSize * 1.35;

    subLines.forEach((lineText, index) => {
      const currentY = subtitleY + index * sLineSpacing;

      ctx.font = getFontString(!!data.subtitleBold, !!data.subtitleItalic, sSize);
      ctx.textAlign = subtitleAlign;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(lineText, subtitleX, currentY);

      if (data.subtitleUnderline) {
        ctx.font = getFontString(!!data.subtitleBold, !!data.subtitleItalic, sSize);
        ctx.textAlign = subtitleAlign;
        ctx.textBaseline = "alphabetic";
        const textWidth = ctx.measureText(lineText).width;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = Math.max(1.5, sSize / 16);
        ctx.beginPath();
        if (subtitleAlign === "left") {
          ctx.moveTo(subtitleX, currentY + 8);
          ctx.lineTo(subtitleX + textWidth, currentY + 8);
        } else if (subtitleAlign === "right") {
          ctx.moveTo(subtitleX - textWidth, currentY + 8);
          ctx.lineTo(subtitleX, currentY + 8);
        } else {
          ctx.moveTo(subtitleX - textWidth / 2, currentY + 8);
          ctx.lineTo(subtitleX + textWidth / 2, currentY + 8);
        }
        ctx.stroke();
      }
    });

    ctx.restore();

    // --- 8. Draw Price Tag Floating Badge ---
    if (data.priceTag) {
      drawPriceTag(ctx, width, height, data);
    }

    // --- 9. Draw Footer Ribbon with Contact details ---
    drawFooterRibbon(ctx, width, height, data, primeColor, secColor);

    // --- 10. Draw Visual Active Selection Frame overlay ---
    if (activeLayer) {
      let x = 0, y = 0, wRect = 0, hRect = 0;
      let hasOutline = false;

      if (activeLayer === "price" && data.priceTag) {
        const pScale = data.priceScale || 1.0;
        const pX = width * 0.82 + (data.priceXOffset || 0);
        const pY = height * 0.70 + (data.priceYOffset || 0);
        const allowedRadius = Math.max(70, 140 * pScale);
        x = pX - allowedRadius;
        y = pY - allowedRadius;
        wRect = allowedRadius * 2;
        hRect = allowedRadius * 2;
        hasOutline = true;
      } else if (activeLayer === "farm") {
        const farmNameText = data.farmName || "สวนออร์แกนิกรุ่นใหม่";
        const fSize = data.farmFontSize || 32;
        const farmAlign = data.farmAlign || "center";
        ctx.font = getFontString(data.farmBold !== false, !!data.farmItalic, fSize);
        
        const farmLines = farmNameText.split("\n");
        const farmLineSpacing = fSize * 1.35;
        let maxFarmWidth = 0;
        farmLines.forEach((lineText) => {
          const displayText = (farmLines.length === 1 && !lineText.startsWith("✦")) 
            ? `✦ ${lineText} ✦` 
            : lineText;
          const wLine = ctx.measureText(displayText).width;
          if (wLine > maxFarmWidth) {
            maxFarmWidth = wLine;
          }
        });

        let farmX = width / 2;
        if (farmAlign === "left") farmX = width * 0.1;
        if (farmAlign === "right") farmX = width * 0.9;
        farmX += (data.farmXOffset || 0);
        const farmY = height * 0.08 + (data.farmYOffset || 0);

        let farmMinX = farmX - maxFarmWidth / 2;
        let farmMaxX = farmX + maxFarmWidth / 2;
        if (farmAlign === "left") {
          farmMinX = farmX;
          farmMaxX = farmX + maxFarmWidth;
        } else if (farmAlign === "right") {
          farmMinX = farmX - maxFarmWidth;
          farmMaxX = farmX;
        }
        const farmMinY = farmY - fSize;
        const farmMaxY = farmY + (farmLines.length - 1) * farmLineSpacing + fSize * 0.3;

        x = farmMinX;
        y = farmMinY;
        wRect = farmMaxX - farmMinX;
        hRect = farmMaxY - farmMinY;
        hasOutline = true;
      } else if (activeLayer === "headline") {
        const titleText = data.productName || "ผลผลิตไทย สดใหม่คัดเกรดพิเศษ";
        let headlineSize = data.headlineFontSize || 48;
        if (!data.headlineFontSize) {
          if (titleText.length > 24) {
            headlineSize = 34;
          } else if (titleText.length > 14) {
            headlineSize = 40;
          }
        }
        const headlineAlign = data.headlineAlign || "center";
        ctx.font = getFontString(data.headlineBold !== false, !!data.headlineItalic, headlineSize);
        
        const titleLines = titleText.split("\n");
        const titleLineSpacing = headlineSize * 1.35;
        let maxTitleWidth = 0;
        titleLines.forEach((line) => {
          const wLine = ctx.measureText(line).width;
          if (wLine > maxTitleWidth) {
            maxTitleWidth = wLine;
          }
        });

        let titleX = width / 2;
        if (headlineAlign === "left") titleX = width * 0.1;
        if (headlineAlign === "right") titleX = width * 0.9;
        titleX += (data.headlineXOffset || 0);
        const titleY = height * 0.17 + (data.headlineYOffset || 0);

        let hMinX = titleX - maxTitleWidth / 2;
        let hMaxX = titleX + maxTitleWidth / 2;
        if (headlineAlign === "left") {
          hMinX = titleX;
          hMaxX = titleX + maxTitleWidth;
        } else if (headlineAlign === "right") {
          hMinX = titleX - maxTitleWidth;
          hMaxX = titleX;
        }
        const hMinY = titleY - headlineSize;
        const hMaxY = titleY + (titleLines.length - 1) * titleLineSpacing + headlineSize * 0.3;

        x = hMinX;
        y = hMinY;
        wRect = hMaxX - hMinX;
        hRect = hMaxY - hMinY;
        hasOutline = true;
      } else if (activeLayer === "subtitle") {
        const subTitleText = data.secondaryText || "ส่งตรงสุขภาพจากฟาร์มสุขใจถึงมือคุณ ปลอดภัยไร้สารเคมี 100%";
        const sSize = data.subtitleFontSize || 26;
        const subtitleAlign = data.subtitleAlign || "center";
        ctx.font = getFontString(!!data.subtitleBold, !!data.subtitleItalic, sSize);

        const subLines: string[] = [];
        subTitleText.split("\n").forEach((manualLine) => {
          if (!subTitleText.includes("\n") && manualLine.length > 55) {
            const mid = Math.floor(manualLine.length / 2);
            subLines.push(manualLine.substring(0, mid));
            subLines.push(manualLine.substring(mid));
          } else {
            subLines.push(manualLine);
          }
        });

        const sLineSpacing = sSize * 1.35;
        let maxSubWidth = 0;
        subLines.forEach((lineText) => {
          const wLine = ctx.measureText(lineText).width;
          if (wLine > maxSubWidth) {
            maxSubWidth = wLine;
          }
        });

        let subtitleX = width / 2;
        if (subtitleAlign === "left") subtitleX = width * 0.1;
        if (subtitleAlign === "right") subtitleX = width * 0.9;
        subtitleX += (data.subtitleXOffset || 0);
        const subtitleY = height * 0.23 + (data.subtitleYOffset || 0);

        let sMinX = subtitleX - maxSubWidth / 2;
        let sMaxX = subtitleX + maxSubWidth / 2;
        if (subtitleAlign === "left") {
          sMinX = subtitleX;
          sMaxX = subtitleX + maxSubWidth;
        } else if (subtitleAlign === "right") {
          sMinX = subtitleX - maxSubWidth;
          sMaxX = subtitleX;
        }
        const sMinY = subtitleY - sSize;
        const sMaxY = subtitleY + (subLines.length - 1) * sLineSpacing + sSize * 0.3;

        x = sMinX;
        y = sMinY;
        wRect = sMaxX - sMinX;
        hRect = sMaxY - sMinY;
        hasOutline = true;
      } else if (activeLayer === "contact") {
        const footerH = height * 0.11;
        const footerY = height - footerH;
        const cSize = data.contactFontSize || 26;
        const fontStr = getFontString(data.contactBold !== false, !!data.contactItalic, cSize);
        ctx.font = fontStr;

        const contactAlign = data.contactAlign || "center";
        let contactX = width / 2;
        if (contactAlign === "left") contactX = width * 0.1;
        if (contactAlign === "right") contactX = width * 0.9;
        contactX += (data.contactXOffset || 0);

        const textY = footerY + footerH / 2 + 4 + (data.contactYOffset || 0);
        let contactText = "";
        if (data.contact && data.lineId) {
          contactText = `📞 โทร: ${data.contact}   |   🟢 LINE: ${data.lineId}`;
        } else if (data.contact) {
          contactText = `📞 โทร: ${data.contact}`;
        } else if (data.lineId) {
          contactText = `🟢 LINE: ${data.lineId}`;
        } else {
          contactText = `📞 โทร: 081-234-5678   |   🟢 LINE: @SookJaiFarm`;
        }
        const contWidth = ctx.measureText(contactText).width;
        const cMinY = textY - cSize / 2;
        const cMaxY = textY + cSize / 2;
        let cMinX = contactX - contWidth / 2;
        let cMaxX = contactX + contWidth / 2;
        if (contactAlign === "left") {
          cMinX = contactX;
          cMaxX = contactX + contWidth;
        } else if (contactAlign === "right") {
          cMinX = contactX - contWidth;
          cMaxX = contactX;
        }

        x = cMinX;
        y = cMinY;
        wRect = cMaxX - cMinX;
        hRect = cMaxY - cMinY;
        hasOutline = true;
      } else if (activeLayer === "product") {
        const centerX = width / 2 + (data.productX || 0);
        const centerY = height * 0.52 + (data.productY || 0);
        const imgR = Math.min(width, height) * 0.28;
        const allowedImgRadius = Math.max(220, imgR);
        x = centerX - allowedImgRadius;
        y = centerY - allowedImgRadius;
        wRect = allowedImgRadius * 2;
        hRect = allowedImgRadius * 2;
        hasOutline = true;
      }

      if (hasOutline) {
        ctx.save();
        
        // Add visual padding around the bounding box
        const visualPadding = 12;
        const drawX = x - visualPadding;
        const drawY = y - visualPadding;
        const drawW = wRect + visualPadding * 2;
        const drawH = hRect + visualPadding * 2;

        // Draw soft glow/shadow under selection line to guarantee visibility
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        // Draw double dashed stroke (outer white, inner teal) for ultimate contrast
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = "#4DA1A9"; // App's signature brand teal color
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "transparent"; // Disable shadow for inner stroke
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        // Draw active drag corner handle nodes
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#2E5077"; // Accent blue
        ctx.lineWidth = 2.5;
        const handleSize = 14;

        const corners = [
          { cx: drawX, cy: drawY }, // Top-Left
          { cx: drawX + drawW, cy: drawY }, // Top-Right
          { cx: drawX, cy: drawY + drawH }, // Bottom-Left
          { cx: drawX + drawW, cy: drawY + drawH } // Bottom-Right
        ];

        corners.forEach((c) => {
          ctx.beginPath();
          ctx.rect(c.cx - handleSize / 2, c.cy - handleSize / 2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        });

        // Draw a neat label badge for what layer is active
        const layerLabels: Record<string, string> = {
          product: "รูปสินค้า (Product)",
          price: "ป้ายราคา (Price)",
          farm: "ชื่อร้านค้า/สวน (Brand)",
          headline: "พาดหัวหลัก (Headline)",
          subtitle: "คำอธิบาย (Subtitle)",
          contact: "ช่องทางติดต่อ (Contact)"
        };
        const labelText = layerLabels[activeLayer] || activeLayer;
        ctx.font = getFontString(true, false, 18);
        const labelWidth = ctx.measureText(labelText).width;
        const labelPaddingH = 14;
        const labelPaddingV = 8;
        const labelX = drawX;
        const labelY = drawY - 22 - labelPaddingV;

        // Draw label background
        ctx.fillStyle = "#2E5077";
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, labelWidth + labelPaddingH * 2, 22 + labelPaddingV * 2, 6);
        ctx.fill();

        // Draw label text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, labelX + labelPaddingH, labelY + 11 + labelPaddingV);

        ctx.restore();
      }
    }
  };

  const drawDecorations = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    style: ThemeStyleType,
    prime: string,
    sec: string
  ) => {
    ctx.save();

    if (style === "natural") {
      // Organic leaf outlines/vines drawn dynamically
      ctx.fillStyle = "rgba(46, 125, 50, 0.05)";
      
      // Corner green organic blobs
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w, h * 0.7, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === "premium") {
      // Golden outer double border
      ctx.strokeStyle = "rgba(212,175,55,0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, w - 60, h - 60);

      ctx.strokeStyle = "rgba(212,175,55,0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(42, 42, w - 84, h - 84);

      // Sparkly stars coordinates
      const stars = [
        { x: 120, y: 150, r: 8 },
        { x: w - 150, y: 300, r: 12 },
        { x: 180, y: h - 320, r: 10 },
        { x: w - 180, y: 700, r: 6 },
      ];
      ctx.fillStyle = "rgba(255, 215, 0, 0.75)";
      stars.forEach((star) => {
        drawFourPointStar(ctx, star.x, star.y, star.r, star.r * 2.5);
      });
    } else if (style === "rustic") {
      // Wooden background lines (simulated)
      ctx.strokeStyle = "rgba(139, 90, 43, 0.08)";
      ctx.lineWidth = 6;
      for (let i = 80; i < h - 80; i += 100) {
        ctx.beginPath();
        ctx.moveTo(80, i);
        ctx.lineTo(w - 80, i);
        ctx.stroke();
      }

      // Border frame mimics hand-cut cardboard craft
      ctx.strokeStyle = "rgba(110,68,30,0.18)";
      ctx.lineWidth = 5;
      ctx.setLineDash([20, 10]);
      ctx.strokeRect(40, 40, w - 80, h - 80);
    } else if (style === "market") {
      // Sunbeams bursting from Center
      ctx.fillStyle = "rgba(243,156,18,0.06)";
      const rays = 16;
      const step = (Math.PI * 2) / rays;
      const cX = w / 2;
      const cY = h / 2;
      ctx.beginPath();
      for (let i = 0; i < rays; i++) {
        ctx.moveTo(cX, cY);
        ctx.arc(cX, cY, Math.max(w, h), i * step, i * step + step * 0.4);
        ctx.lineTo(cX, cY);
      }
      ctx.fill();

      // Fun star bursts "SALE!" style on random background parts
      ctx.fillStyle = "rgba(231, 76, 60, 0.05)";
      ctx.font = "80px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🔥", w * 0.12, h * 0.35);
      ctx.fillText("✨", w * 0.88, h * 0.28);
      ctx.fillText("💯", w * 0.15, h * 0.72);
    } else if (style === "minimal") {
      // Sleek margins and border
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, w - 120, h - 120);
      
      ctx.fillStyle = "rgba(0,0,0,0.02)";
      ctx.fillRect(60, 60, w - 120, h - 120);
    } else if (style === "retro-neon") {
      // Cyber punk / Neon grid lines
      ctx.strokeStyle = "rgba(0, 245, 255, 0.08)";
      ctx.lineWidth = 2;
      for (let i = 0; i <= w; i += w / 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(w / 2 + (i - w / 2) * 1.5, h);
        ctx.stroke();
      }
      for (let i = 0; i <= h; i += h / 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255, 3, 124, 0.04)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === "pastel-sweet") {
      // Sweet cute pastel shapes
      ctx.fillStyle = "rgba(255, 182, 193, 0.2)";
      const bubbles = [
        { x: w * 0.15, y: h * 0.35, r: 90 },
        { x: w * 0.85, y: h * 0.45, r: 75 },
        { x: w * 0.22, y: h * 0.8, r: 110 },
        { x: w * 0.78, y: h * 0.15, r: 60 },
      ];
      bubbles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (style === "bold-future") {
      // Powerful futuristic diagonal stripes
      ctx.strokeStyle = "rgba(255, 87, 34, 0.04)";
      ctx.lineWidth = 25;
      for (let i = -h; i < w + h; i += 200) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      // Future tech corner lines
      ctx.strokeStyle = "rgba(255, 87, 34, 0.2)";
      ctx.lineWidth = 6;
      const len = 40;
      ctx.beginPath();
      ctx.moveTo(50 + len, 50); ctx.lineTo(50, 50); ctx.lineTo(50, 50 + len);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(w - 50 - len, 50); ctx.lineTo(w - 50, 50); ctx.lineTo(w - 50, 50 + len);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawFourPointStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let angle = (i * Math.PI) / 2;
      ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
      angle += Math.PI / 4;
      ctx.lineTo(cx + Math.cos(angle) * innerRadius, cy + Math.sin(angle) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawBadgesOnCanvas = (
    ctx: CanvasRenderingContext2D,
    pX: number,
    pY: number,
    w: number,
    h: number,
    data: AdData
  ) => {
    // Collect active badges based on user settings
    const activeBadgeTexts: string[] = [];
    
    // Pick from presets based on selectedIndex or custom input
    const badgePresets = ["สดส่งตรงจากสวน", "ปลอดสารเคมี 100%", "อร่อยรับประกัน", "สายพันธุ์แท้ดั้งเดิม", "พรีเมียมคัดเกรด"];
    
    let text1 = data.customBadge1 || badgePresets[data.selectedBadgeIndex1 % badgePresets.length];
    let text2 = data.customBadge2 || badgePresets[data.selectedBadgeIndex2 % badgePresets.length];

    if (text1 && text1 !== "ไม่มีป้าย") activeBadgeTexts.push(text1);
    if (text2 && text2 !== "ไม่มีป้าย") activeBadgeTexts.push(text2);

    if (activeBadgeTexts.length === 0) return;

    ctx.save();
    ctx.font = getFontString(true, false, 24);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Setup visual themes for badge designs based on ad styling
    let badgeBgColor = "#79D7BE";
    let badgeTxtColor = "#ffffff";
    let shadowColor = "rgba(0,0,0,0.15)";
    
    switch (data.themeStyle) {
      case "premium":
        badgeBgColor = "#D4AF37"; // beautiful shiny gold
        badgeTxtColor = "#0A1118";
        break;
      case "natural":
        badgeBgColor = "#2D6A4F"; // rich botanical forest green
        badgeTxtColor = "#E8F5E9";
        break;
      case "rustic":
        badgeBgColor = "#A0522D"; // copper/sienna rustic
        badgeTxtColor = "#FFF8DC";
        break;
      case "market":
        badgeBgColor = "#FF8C00"; // dark orange blast
        badgeTxtColor = "#ffffff";
        break;
      case "minimal":
        badgeBgColor = "#18181B"; // clean slate black
        badgeTxtColor = "#ffffff";
        break;
    }

    // Positions relative to product boundaries
    // Badge 1 coordinates: Top Left of product
    // Badge 2 coordinates: Bottom Right of product
    const badgePos = [
      { x: pX - 220, y: pY - 200, rotate: -12 },
      { x: pX + 220, y: pY + 200, rotate: 8 },
    ];

    activeBadgeTexts.forEach((text, i) => {
      const pos = badgePos[i % badgePos.length];
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((pos.rotate * Math.PI) / 180);

      // Measure text length to fit capsule perfectly
      ctx.font = getFontString(true, false, 24);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const metrics = ctx.measureText(text);
      const paddingX = 22;
      const paddingY = 12;
      const bW = metrics.width + paddingX * 2;
      const bH = 24 + paddingY * 2;

      // Draw Badge container shadow/border
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = badgeBgColor;
      ctx.beginPath();
      ctx.roundRect(-bW / 2, -bH / 2, bW, bH, bH / 2); // rounded capsule
      ctx.fill();

      // Add a small inner border to give double-stamp craft effect
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.roundRect(-bW / 2 + 3, -bH / 2 + 3, bW - 6, bH - 6, (bH - 6) / 2);
      ctx.stroke();

      // Draw text
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = badgeTxtColor;
      ctx.fillText(text, 0, 1.5);
      
      ctx.restore();
    });

    ctx.restore();
  };

  const drawPriceTag = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    data: AdData
  ) => {
    ctx.save();

    // Floating position: Lower Right of the card with customization offsets
    const pX = w * 0.82 + (data.priceXOffset || 0);
    const pY = h * 0.70 + (data.priceYOffset || 0);

    // Shake rotation slightly for playful retail look
    ctx.translate(pX, pY);
    ctx.rotate((-8 * Math.PI) / 180);

    // Style setups based on theme style chosen
    let circleBg = "#E74C3C"; // vivid red for super price tag
    let circleBorder = "#ffffff";
    let textPrimeColor = "#ffffff";
    let textSecColor = "#F9E79F";

    switch (data.themeStyle) {
      case "premium":
        circleBg = "#0F1E2E";
        circleBorder = "#D4AF37";
        textPrimeColor = "#FFD700";
        textSecColor = "#F4F6F7";
        break;
      case "natural":
        circleBg = "#1B4332";
        circleBorder = "#79D7BE";
        textPrimeColor = "#ffffff";
        textSecColor = "#C7F9CC";
        break;
      case "rustic":
        circleBg = "#8B4513";
        circleBorder = "#E3D1BE";
        textPrimeColor = "#FFF8DC";
        textSecColor = "#FFE4B5";
        break;
      case "minimal":
        circleBg = "#000000";
        circleBorder = "#ffffff";
        textPrimeColor = "#ffffff";
        textSecColor = "#D4D4D8";
        break;
    }

    const pScale = data.priceScale || 1.0;
    const radius = 100 * pScale;
    const tagStyle = data.priceTagStyle || "circle";

    const drawStarburst = (numPoints: number, innerR: number, outerR: number) => {
      ctx.beginPath();
      let angle = Math.PI / numPoints;
      for (let i = 0; i < 2 * numPoints; i++) {
        const r = (i % 2 === 0) ? outerR : innerR;
        const x = Math.cos(i * angle) * r;
        const y = Math.sin(i * angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const drawShieldBadge = (r: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, -r * 0.5);
      ctx.lineTo(r, r * 0.7);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, r * 0.7);
      ctx.lineTo(-r, -r * 0.5);
      ctx.closePath();
    };

    // Circle Shadow
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 15 * pScale;
    ctx.shadowOffsetY = 6 * pScale;

    // Draw solid body
    ctx.fillStyle = circleBg;
    if (tagStyle === "starburst") {
      drawStarburst(24, radius * 0.82, radius * 1.05);
      ctx.fill();
    } else if (tagStyle === "badge") {
      ctx.beginPath();
      ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 24 * pScale);
      ctx.closePath();
      ctx.fill();
    } else if (tagStyle === "ribbon") {
      drawShieldBadge(radius);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw rich layered outer ring
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = circleBorder;
    ctx.lineWidth = 6 * pScale;
    
    if (tagStyle === "starburst") {
      drawStarburst(24, radius * 0.82, radius * 1.05);
      ctx.stroke();
    } else if (tagStyle === "badge") {
      ctx.beginPath();
      ctx.roundRect(-radius, -radius, radius * 2, radius * 2, 24 * pScale);
      ctx.closePath();
      ctx.stroke();
    } else if (tagStyle === "ribbon") {
      drawShieldBadge(radius);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw little inner dots ring for playful voucher design
    ctx.strokeStyle = circleBorder;
    ctx.lineWidth = 2.5 * pScale;
    ctx.setLineDash([4 * pScale, 6 * pScale]);
    
    if (tagStyle === "starburst") {
      drawStarburst(24, radius * 0.72, radius * 0.92);
      ctx.stroke();
    } else if (tagStyle === "badge") {
      ctx.beginPath();
      ctx.roundRect(-radius + 12 * pScale, -radius + 12 * pScale, (radius - 12 * pScale) * 2, (radius - 12 * pScale) * 2, 16 * pScale);
      ctx.closePath();
      ctx.stroke();
    } else if (tagStyle === "ribbon") {
      drawShieldBadge(radius - 12 * pScale);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, radius - 12 * pScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Price Text
    ctx.setLineDash([]);

    // Text "ราคา" or "HOT PRICE"
    ctx.font = getFontString(true, false, 18 * pScale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textSecColor;
    ctx.fillText("ราคา", 0, -42 * pScale);

    // Core Price Numbers (e.g. "120.-")
    const priceText = data.priceTag;
    let size = (data.priceFontSize || 38) * pScale;
    if (priceText.length > 6 && !data.priceFontSize) {
      size = 28 * pScale; // autoscale to prevent spill
    }
    
    ctx.font = getFontString(data.priceBold !== false, !!data.priceItalic, size);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textPrimeColor;
    ctx.fillText(priceText, 0, -2 * pScale);

    if (data.priceUnderline) {
      const textWidth = ctx.measureText(priceText).width;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = Math.max(1.5, size / 16);
      ctx.beginPath();
      ctx.moveTo(-textWidth / 2, size / 2 - 2 * pScale);
      ctx.lineTo(textWidth / 2, size / 2 - 2 * pScale);
      ctx.stroke();
    }

    // Unit info: e.g. "รีบสั่งเลย" or "ส่งตรงจากไร่"
    ctx.font = getFontString(true, false, 16 * pScale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textSecColor;
    ctx.fillText("คุ้มค่าที่สุด", 0, 36 * pScale);

    ctx.restore();
  };

  const drawFooterRibbon = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    data: AdData,
    prime: string,
    sec: string
  ) => {
    ctx.save();

    const footerH = h * 0.11;
    const footerY = h - footerH;

    // Footer background ribbon
    let footerBg = prime || "#2E5077";
    
    if (data.themeStyle === "premium") {
      footerBg = "#0A1118";
    }

    ctx.fillStyle = footerBg;
    ctx.fillRect(0, footerY, w, footerH);

    // Draw a divider top highlight line to make footer crisp
    let dividerColor = sec || "#79D7BE";
    if (data.themeStyle === "premium") {
      dividerColor = "#D4AF37";
    } else if (data.themeStyle === "minimal") {
      dividerColor = "#E4E4E7";
    }
    
    ctx.fillStyle = dividerColor;
    ctx.fillRect(0, footerY, w, 8);

    // Draw Contact Details
    ctx.fillStyle = "#ffffff";
    
    const cSize = data.contactFontSize || 26;
    const fontStr = getFontString(data.contactBold !== false, !!data.contactItalic, cSize);

    const contactAlign = data.contactAlign || "center";
    let contactX = w / 2;
    if (contactAlign === "left") {
      contactX = w * 0.1;
    } else if (contactAlign === "right") {
      contactX = w * 0.9;
    }
    contactX += (data.contactXOffset || 0);

    const textY = footerY + footerH / 2 + 4 + (data.contactYOffset || 0);
    
    let contactText = "";
    if (data.contact && data.lineId) {
      contactText = `📞 โทร: ${data.contact}   |   🟢 LINE: ${data.lineId}`;
    } else if (data.contact) {
      contactText = `📞 โทร: ${data.contact}`;
    } else if (data.lineId) {
      contactText = `🟢 LINE: ${data.lineId}`;
    } else {
      contactText = `📞 โทร: 081-234-5678   |   🟢 LINE: @SookJaiFarm`;
    }

    const fullContactStr = contactText;
    
    ctx.font = fontStr;
    ctx.textAlign = contactAlign;
    ctx.textBaseline = "middle";
    ctx.fillText(fullContactStr, contactX, textY);

    if (data.contactUnderline) {
      ctx.font = fontStr;
      ctx.textAlign = contactAlign;
      ctx.textBaseline = "middle";
      const textWidth = ctx.measureText(fullContactStr).width;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = Math.max(1.5, cSize / 16);
      ctx.beginPath();
      if (contactAlign === "left") {
        ctx.moveTo(contactX, textY + cSize / 2 + 2);
        ctx.lineTo(contactX + textWidth, textY + cSize / 2 + 2);
      } else if (contactAlign === "right") {
        ctx.moveTo(contactX - textWidth, textY + cSize / 2 + 2);
        ctx.lineTo(contactX, textY + cSize / 2 + 2);
      } else {
        ctx.moveTo(contactX - textWidth / 2, textY + cSize / 2 + 2);
        ctx.lineTo(contactX + textWidth / 2, textY + cSize / 2 + 2);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // --- MOUSE & TOUCH EVENT DRAGGING AND REPOSITIONING ---
  // Coordinates are dynamically scaled since preview image uses CSS resize container
  const getCanvasCoordinates = (e: any, useLockedRect = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = (useLockedRect && dragRectRef.current)
      ? dragRectRef.current
      : canvas.getBoundingClientRect();

    const rectWidth = rect.width || 1;
    const rectHeight = rect.height || 1;

    let clientX = 0;
    let clientY = 0;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Scale coordinates back to the high-definition internal resolution (e.g. 1080p base)
    const scaleX = canvas.width / rectWidth;
    const scaleY = canvas.height / rectHeight;

    return {
      x: x * scaleX,
      y: y * scaleY,
    };
  };

  const getActiveLayerRect = (
    layer: "product" | "price" | "farm" | "headline" | "subtitle" | "contact" | null,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): { x: number; y: number; w: number; h: number } | null => {
    if (!layer) return null;
    let x = 0, y = 0, wRect = 0, hRect = 0;

    if (layer === "price" && data.priceTag) {
      const pScale = data.priceScale || 1.0;
      const pX = width * 0.82 + (data.priceXOffset || 0);
      const pY = height * 0.70 + (data.priceYOffset || 0);
      const allowedRadius = Math.max(70, 140 * pScale);
      x = pX - allowedRadius;
      y = pY - allowedRadius;
      wRect = allowedRadius * 2;
      hRect = allowedRadius * 2;
    } else if (layer === "farm") {
      const farmNameText = data.farmName || "สวนออร์แกนิกรุ่นใหม่";
      const fSize = data.farmFontSize || 32;
      const farmAlign = data.farmAlign || "center";
      ctx.save();
      ctx.font = getFontString(data.farmBold !== false, !!data.farmItalic, fSize);
      
      const farmLines = farmNameText.split("\n");
      const farmLineSpacing = fSize * 1.35;
      let maxFarmWidth = 0;
      farmLines.forEach((lineText) => {
        const displayText = (farmLines.length === 1 && !lineText.startsWith("✦")) 
          ? `✦ ${lineText} ✦` 
          : lineText;
        const wLine = ctx.measureText(displayText).width;
        if (wLine > maxFarmWidth) {
          maxFarmWidth = wLine;
        }
      });
      ctx.restore();

      let farmX = width / 2;
      if (farmAlign === "left") farmX = width * 0.1;
      if (farmAlign === "right") farmX = width * 0.9;
      farmX += (data.farmXOffset || 0);
      const farmY = height * 0.08 + (data.farmYOffset || 0);

      let farmMinX = farmX - maxFarmWidth / 2;
      let farmMaxX = farmX + maxFarmWidth / 2;
      if (farmAlign === "left") {
        farmMinX = farmX;
        farmMaxX = farmX + maxFarmWidth;
      } else if (farmAlign === "right") {
        farmMinX = farmX - maxFarmWidth;
        farmMaxX = farmX;
      }
      const farmMinY = farmY - fSize;
      const farmMaxY = farmY + (farmLines.length - 1) * farmLineSpacing + fSize * 0.3;

      x = farmMinX;
      y = farmMinY;
      wRect = farmMaxX - farmMinX;
      hRect = farmMaxY - farmMinY;
    } else if (layer === "headline") {
      const titleText = data.productName || "ผลผลิตไทย สดใหม่คัดเกรดพิเศษ";
      let headlineSize = data.headlineFontSize || 48;
      if (!data.headlineFontSize) {
        if (titleText.length > 24) {
          headlineSize = 34;
        } else if (titleText.length > 14) {
          headlineSize = 40;
        }
      }
      const headlineAlign = data.headlineAlign || "center";
      ctx.save();
      ctx.font = getFontString(data.headlineBold !== false, !!data.headlineItalic, headlineSize);
      
      const titleLines = titleText.split("\n");
      const titleLineSpacing = headlineSize * 1.35;
      let maxTitleWidth = 0;
      titleLines.forEach((line) => {
        const wLine = ctx.measureText(line).width;
        if (wLine > maxTitleWidth) {
          maxTitleWidth = wLine;
        }
      });
      ctx.restore();

      let titleX = width / 2;
      if (headlineAlign === "left") titleX = width * 0.1;
      if (headlineAlign === "right") titleX = width * 0.9;
      titleX += (data.headlineXOffset || 0);
      const titleY = height * 0.17 + (data.headlineYOffset || 0);

      let hMinX = titleX - maxTitleWidth / 2;
      let hMaxX = titleX + maxTitleWidth / 2;
      if (headlineAlign === "left") {
        hMinX = titleX;
        hMaxX = titleX + maxTitleWidth;
      } else if (headlineAlign === "right") {
        hMinX = titleX - maxTitleWidth;
        hMaxX = titleX;
      }
      const hMinY = titleY - headlineSize;
      const hMaxY = titleY + (titleLines.length - 1) * titleLineSpacing + headlineSize * 0.3;

      x = hMinX;
      y = hMinY;
      wRect = hMaxX - hMinX;
      hRect = hMaxY - hMinY;
    } else if (layer === "subtitle") {
      const subTitleText = data.secondaryText || "ส่งตรงสุขภาพจากฟาร์มสุขใจถึงมือคุณ ปลอดภัยไร้สารเคมี 100%";
      const sSize = data.subtitleFontSize || 26;
      const subtitleAlign = data.subtitleAlign || "center";
      ctx.save();
      ctx.font = getFontString(!!data.subtitleBold, !!data.subtitleItalic, sSize);

      const subLines: string[] = [];
      subTitleText.split("\n").forEach((manualLine) => {
        if (!subTitleText.includes("\n") && manualLine.length > 55) {
          const mid = Math.floor(manualLine.length / 2);
          subLines.push(manualLine.substring(0, mid));
          subLines.push(manualLine.substring(mid));
        } else {
          subLines.push(manualLine);
        }
      });

      const sLineSpacing = sSize * 1.35;
      let maxSubWidth = 0;
      subLines.forEach((lineText) => {
        const wLine = ctx.measureText(lineText).width;
        if (wLine > maxSubWidth) {
          maxSubWidth = wLine;
        }
      });
      ctx.restore();

      let subtitleX = width / 2;
      if (subtitleAlign === "left") subtitleX = width * 0.1;
      if (subtitleAlign === "right") subtitleX = width * 0.9;
      subtitleX += (data.subtitleXOffset || 0);
      const subtitleY = height * 0.23 + (data.subtitleYOffset || 0);

      let sMinX = subtitleX - maxSubWidth / 2;
      let sMaxX = subtitleX + maxSubWidth / 2;
      if (subtitleAlign === "left") {
        sMinX = subtitleX;
        sMaxX = subtitleX + maxSubWidth;
      } else if (subtitleAlign === "right") {
        sMinX = subtitleX - maxSubWidth;
        sMaxX = subtitleX;
      }
      const sMinY = subtitleY - sSize;
      const sMaxY = subtitleY + (subLines.length - 1) * sLineSpacing + sSize * 0.3;

      x = sMinX;
      y = sMinY;
      wRect = sMaxX - sMinX;
      hRect = sMaxY - sMinY;
    } else if (layer === "contact") {
      const footerH = height * 0.11;
      const footerY = height - footerH;
      const cSize = data.contactFontSize || 26;
      ctx.save();
      const fontStr = getFontString(data.contactBold !== false, !!data.contactItalic, cSize);
      ctx.font = fontStr;

      const contactAlign = data.contactAlign || "center";
      let contactX = width / 2;
      if (contactAlign === "left") contactX = width * 0.1;
      if (contactAlign === "right") contactX = width * 0.9;
      contactX += (data.contactXOffset || 0);

      const textY = footerY + footerH / 2 + 4 + (data.contactYOffset || 0);
      let contactText = "";
      if (data.contact && data.lineId) {
        contactText = `📞 โทร: ${data.contact}   |   🟢 LINE: ${data.lineId}`;
      } else if (data.contact) {
        contactText = `📞 โทร: ${data.contact}`;
      } else if (data.lineId) {
        contactText = `🟢 LINE: ${data.lineId}`;
      } else {
        contactText = `📞 โทร: 081-234-5678   |   🟢 LINE: @SookJaiFarm`;
      }
      const contWidth = ctx.measureText(contactText).width;
      ctx.restore();
      const cMinY = textY - cSize / 2;
      const cMaxY = textY + cSize / 2;
      let cMinX = contactX - contWidth / 2;
      let cMaxX = contactX + contWidth / 2;
      if (contactAlign === "left") {
        cMinX = contactX;
        cMaxX = contactX + contWidth;
      } else if (contactAlign === "right") {
        cMinX = contactX - contWidth;
        cMaxX = contactX;
      }

      x = cMinX;
      y = cMinY;
      wRect = cMaxX - cMinX;
      hRect = cMaxY - cMinY;
    } else if (layer === "product") {
      const centerX = width / 2 + (data.productX || 0);
      const centerY = height * 0.52 + (data.productY || 0);
      const imgR = Math.min(width, height) * 0.28;
      const allowedImgRadius = Math.max(220, imgR);
      x = centerX - allowedImgRadius;
      y = centerY - allowedImgRadius;
      wRect = allowedImgRadius * 2;
      hRect = allowedImgRadius * 2;
    }

    return { x, y, w: wRect, h: hRect };
  };

  const findDragTarget = (
    coords: { x: number; y: number },
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): { target: "price" | "farm" | "headline" | "subtitle" | "contact" | "product"; startX: number; startY: number } | null => {
    const padding = 34; // Generous multi-padded touch area for label targets

    // 1. Price Tag
    if (data.priceTag) {
      const pScale = data.priceScale || 1.0;
      const pX = width * 0.82 + (data.priceXOffset || 0);
      const pY = height * 0.70 + (data.priceYOffset || 0);
      const distToPriceTag = Math.hypot(coords.x - pX, coords.y - pY);
      const allowedRadius = Math.max(70, 140 * pScale);
      if (distToPriceTag < allowedRadius) {
        return { target: "price", startX: data.priceXOffset || 0, startY: data.priceYOffset || 0 };
      }
    }

    // Resolve theme-specific colors
    let primeColor = data.primaryColor;
    if (!data.bgColorStart || !data.bgColorEnd) {
      switch (data.themeStyle) {
        case "natural": primeColor = "#1B4332"; break;
        case "premium": primeColor = "#FFD700"; break;
        case "rustic": primeColor = "#5C4033"; break;
        case "market": primeColor = "#D11A2A"; break;
        case "minimal": primeColor = "#09090B"; break;
        case "retro-neon": primeColor = "#FF037C"; break;
        case "pastel-sweet": primeColor = "#FF1493"; break;
        case "bold-future": primeColor = "#FF5722"; break;
      }
    }

    // 2. Farm Name
    const farmNameText = data.farmName || "สวนออร์แกนิกรุ่นใหม่";
    const fSize = data.farmFontSize || 32;
    const farmAlign = data.farmAlign || "center";
    ctx.font = getFontString(data.farmBold !== false, !!data.farmItalic, fSize);
    
    const farmLines = farmNameText.split("\n");
    const farmLineSpacing = fSize * 1.35;
    let maxFarmWidth = 0;
    farmLines.forEach((lineText) => {
      const displayText = (farmLines.length === 1 && !lineText.startsWith("✦")) 
        ? `✦ ${lineText} ✦` 
        : lineText;
      const wLine = ctx.measureText(displayText).width;
      if (wLine > maxFarmWidth) {
        maxFarmWidth = wLine;
      }
    });

    let farmX = width / 2;
    if (farmAlign === "left") farmX = width * 0.1;
    if (farmAlign === "right") farmX = width * 0.9;
    farmX += (data.farmXOffset || 0);
    const farmY = height * 0.08 + (data.farmYOffset || 0);

    let farmMinX = farmX - maxFarmWidth / 2;
    let farmMaxX = farmX + maxFarmWidth / 2;
    if (farmAlign === "left") {
      farmMinX = farmX;
      farmMaxX = farmX + maxFarmWidth;
    } else if (farmAlign === "right") {
      farmMinX = farmX - maxFarmWidth;
      farmMaxX = farmX;
    }
    const farmMinY = farmY - fSize;
    const farmMaxY = farmY + (farmLines.length - 1) * farmLineSpacing + fSize * 0.3;

    if (coords.x >= farmMinX - padding && coords.x <= farmMaxX + padding &&
        coords.y >= farmMinY - padding && coords.y <= farmMaxY + padding) {
      return { target: "farm", startX: data.farmXOffset || 0, startY: data.farmYOffset || 0 };
    }

    // 3. Headline/Title
    const titleText = data.productName || "ผลผลิตไทย สดใหม่คัดเกรดพิเศษ";
    let headlineSize = data.headlineFontSize || 48;
    if (!data.headlineFontSize) {
      if (titleText.length > 24) {
        headlineSize = 34;
      } else if (titleText.length > 14) {
        headlineSize = 40;
      }
    }
    const headlineAlign = data.headlineAlign || "center";
    ctx.font = getFontString(data.headlineBold !== false, !!data.headlineItalic, headlineSize);
    
    const titleLines = titleText.split("\n");
    const titleLineSpacing = headlineSize * 1.35;
    let maxTitleWidth = 0;
    titleLines.forEach((line) => {
      const wLine = ctx.measureText(line).width;
      if (wLine > maxTitleWidth) {
        maxTitleWidth = wLine;
      }
    });

    let titleX = width / 2;
    if (headlineAlign === "left") titleX = width * 0.1;
    if (headlineAlign === "right") titleX = width * 0.9;
    titleX += (data.headlineXOffset || 0);
    const titleY = height * 0.17 + (data.headlineYOffset || 0);

    let hMinX = titleX - maxTitleWidth / 2;
    let hMaxX = titleX + maxTitleWidth / 2;
    if (headlineAlign === "left") {
      hMinX = titleX;
      hMaxX = titleX + maxTitleWidth;
    } else if (headlineAlign === "right") {
      hMinX = titleX - maxTitleWidth;
      hMaxX = titleX;
    }
    const hMinY = titleY - headlineSize;
    const hMaxY = titleY + (titleLines.length - 1) * titleLineSpacing + headlineSize * 0.3;

    if (coords.x >= hMinX - padding && coords.x <= hMaxX + padding &&
        coords.y >= hMinY - padding && coords.y <= hMaxY + padding) {
      return { target: "headline", startX: data.headlineXOffset || 0, startY: data.headlineYOffset || 0 };
    }

    // 4. Subtitle
    const subTitleText = data.secondaryText || "ส่งตรงสุขภาพจากฟาร์มสุขใจถึงมือคุณ ปลอดภัยไร้สารเคมี 100%";
    const sSize = data.subtitleFontSize || 26;
    const subtitleAlign = data.subtitleAlign || "center";
    ctx.font = getFontString(!!data.subtitleBold, !!data.subtitleItalic, sSize);

    const subLines: string[] = [];
    subTitleText.split("\n").forEach((manualLine) => {
      if (!subTitleText.includes("\n") && manualLine.length > 55) {
        const mid = Math.floor(manualLine.length / 2);
        subLines.push(manualLine.substring(0, mid));
        subLines.push(manualLine.substring(mid));
      } else {
        subLines.push(manualLine);
      }
    });

    const sLineSpacing = sSize * 1.35;
    let maxSubWidth = 0;
    subLines.forEach((lineText) => {
      const wLine = ctx.measureText(lineText).width;
      if (wLine > maxSubWidth) {
        maxSubWidth = wLine;
      }
    });

    let subtitleX = width / 2;
    if (subtitleAlign === "left") subtitleX = width * 0.1;
    if (subtitleAlign === "right") subtitleX = width * 0.9;
    subtitleX += (data.subtitleXOffset || 0);
    const subtitleY = height * 0.23 + (data.subtitleYOffset || 0);

    let sMinX = subtitleX - maxSubWidth / 2;
    let sMaxX = subtitleX + maxSubWidth / 2;
    if (subtitleAlign === "left") {
      sMinX = subtitleX;
      sMaxX = subtitleX + maxSubWidth;
    } else if (subtitleAlign === "right") {
      sMinX = subtitleX - maxSubWidth;
      sMaxX = subtitleX;
    }
    const sMinY = subtitleY - sSize;
    const sMaxY = subtitleY + (subLines.length - 1) * sLineSpacing + sSize * 0.3;

    if (coords.x >= sMinX - padding && coords.x <= sMaxX + padding &&
        coords.y >= sMinY - padding && coords.y <= sMaxY + padding) {
      return { target: "subtitle", startX: data.subtitleXOffset || 0, startY: data.subtitleYOffset || 0 };
    }

    // 5. Contact Details
    const footerH = height * 0.11;
    const footerY = height - footerH;
    const cSize = data.contactFontSize || 26;
    const fontStr = getFontString(data.contactBold !== false, !!data.contactItalic, cSize);
    ctx.font = fontStr;

    const contactAlign = data.contactAlign || "center";
    let contactX = width / 2;
    if (contactAlign === "left") contactX = width * 0.1;
    if (contactAlign === "right") contactX = width * 0.9;
    contactX += (data.contactXOffset || 0);

    const textY = footerY + footerH / 2 + 4 + (data.contactYOffset || 0);
    let contactText = "";
    if (data.contact && data.lineId) {
      contactText = `📞 โทร: ${data.contact}   |   🟢 LINE: ${data.lineId}`;
    } else if (data.contact) {
      contactText = `📞 โทร: ${data.contact}`;
    } else if (data.lineId) {
      contactText = `🟢 LINE: ${data.lineId}`;
    } else {
      contactText = `📞 โทร: 081-234-5678   |   🟢 LINE: @SookJaiFarm`;
    }
    const contWidth = ctx.measureText(contactText).width;
    const cMinY = textY - cSize / 2;
    const cMaxY = textY + cSize / 2;
    let cMinX = contactX - contWidth / 2;
    let cMaxX = contactX + contWidth / 2;
    if (contactAlign === "left") {
      cMinX = contactX;
      cMaxX = contactX + contWidth;
    } else if (contactAlign === "right") {
      cMinX = contactX - contWidth;
      cMaxX = contactX;
    }

    if (coords.x >= cMinX - padding && coords.x <= cMaxX + padding &&
        coords.y >= cMinY - padding && coords.y <= cMaxY + padding) {
      return { target: "contact", startX: data.contactXOffset || 0, startY: data.contactYOffset || 0 };
    }

    // 6. Product Image Layer
    const centerX = width / 2 + (data.productX || 0);
    const centerY = height * 0.52 + (data.productY || 0);
    const imgR = Math.min(width, height) * 0.28;
    const distToImg = Math.hypot(coords.x - centerX, coords.y - centerY);
    
    // Check if clicked inside the boundaries of the product image layer or its placeholder circle
    const allowedImgRadius = Math.max(220, imgR);
    if (distToImg <= allowedImgRadius) {
      return { target: "product", startX: data.productX || 0, startY: data.productY || 0 };
    }

    // Return null if click empty area
    return null;
  };

  // Prevent scrolling on mobile during advertisement element drags with a native non-passive event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: any) => {
      dragRectRef.current = canvas.getBoundingClientRect();
      const coords = getCanvasCoordinates(e, true);
      if (!coords) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = getCanvasDimensions(data.aspectRatio);

      // Check if clicking a corner of the active layer for resizing
      let clickedCorner = false;
      if (activeLayer) {
        const rect = getActiveLayerRect(activeLayer, ctx, width, height);
        if (rect) {
          const visualPadding = 12;
          const drawX = rect.x - visualPadding;
          const drawY = rect.y - visualPadding;
          const drawW = rect.w + visualPadding * 2;
          const drawH = rect.h + visualPadding * 2;

          const corners = [
            { cx: drawX, cy: drawY }, // Top-Left
            { cx: drawX + drawW, cy: drawY }, // Top-Right
            { cx: drawX, cy: drawY + drawH }, // Bottom-Left
            { cx: drawX + drawW, cy: drawY + drawH } // Bottom-Right
          ];

          const handleHitRadius = 30;
          for (let i = 0; i < corners.length; i++) {
            const c = corners[i];
            const dist = Math.hypot(coords.x - c.cx, coords.y - c.cy);
            if (dist <= handleHitRadius) {
              clickedCorner = true;
              setIsResizing(true);
              setResizingTarget(activeLayer);
              
              let startVal = 1.0;
              if (activeLayer === "farm") startVal = data.farmFontSize || 32;
              else if (activeLayer === "headline") startVal = data.headlineFontSize || 64;
              else if (activeLayer === "subtitle") startVal = data.subtitleFontSize || 26;
              else if (activeLayer === "contact") startVal = data.contactFontSize || 26;
              else if (activeLayer === "price") startVal = data.priceScale || 1.0;
              else if (activeLayer === "product") startVal = data.productScale || 1.0;

              setResizingStartVal(startVal);
              
              const centerX = rect.x + rect.w / 2;
              const centerY = rect.y + rect.h / 2;
              setResizingCenter({ x: centerX, y: centerY });
              
              const startDist = Math.hypot(coords.x - centerX, coords.y - centerY);
              setResizingStartDist(startDist || 1);
              
              break;
            }
          }
        }
      }

      if (clickedCorner) {
        if (e.cancelable) {
          e.preventDefault();
        }
        return;
      }

      // Perform prioritized hit search across labels, badge, and background fallback
      const result = findDragTarget(coords, ctx, width, height);
      if (!result) {
        onSelectLayer?.(null);
        return;
      }

      const { target, startX, startY } = result;

      // On mobile touch, to prevent accidental dragging during scrolling:
      // If the touched target is not already selected, only select it and DO NOT drag!
      if (activeLayer !== target) {
        onSelectLayer?.(target);
        return;
      }

      setDragTarget(target);
      setIsDragging(true);
      setDragStart({ x: coords.x, y: coords.y });
      setCanvasStartPos({ x: startX, y: startY });

      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: any) => {
      if (!isDragging && !isResizing) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const coords = getCanvasCoordinates(e, true);
      if (!coords) return;

      if (isResizing && resizingTarget) {
        const centerX = resizingCenter.x;
        const centerY = resizingCenter.y;
        const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
        const ratio = currentDist / resizingStartDist;
        
        let newVal = resizingStartVal * ratio;
        
        if (onSizeChange) {
          if (resizingTarget === "farm") {
            newVal = Math.round(Math.max(14, Math.min(80, newVal)));
          } else if (resizingTarget === "headline") {
            newVal = Math.round(Math.max(20, Math.min(100, newVal)));
          } else if (resizingTarget === "subtitle") {
            newVal = Math.round(Math.max(14, Math.min(60, newVal)));
          } else if (resizingTarget === "contact") {
            newVal = Math.round(Math.max(16, Math.min(48, newVal)));
          } else if (resizingTarget === "price") {
            newVal = Math.max(0.4, Math.min(2.0, newVal));
          } else if (resizingTarget === "product") {
            newVal = Math.max(0.2, Math.min(2.5, newVal));
          }
          onSizeChange(resizingTarget, newVal);
        }
        return;
      }

      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      const newX = Math.round(canvasStartPos.x + deltaX);
      const newY = Math.round(canvasStartPos.y + deltaY);

      if (dragTarget === "price" && onPricePositionChange) {
        onPricePositionChange(newX, newY);
      } else if (dragTarget === "product") {
        onPositionChange(newX, newY);
      } else if (dragTarget === "farm" && onFarmPositionChange) {
        onFarmPositionChange(newX, newY);
      } else if (dragTarget === "headline" && onHeadlinePositionChange) {
        onHeadlinePositionChange(newX, newY);
      } else if (dragTarget === "subtitle" && onSubtitlePositionChange) {
        onSubtitlePositionChange(newX, newY);
      } else if (dragTarget === "contact" && onContactPositionChange) {
        onContactPositionChange(newX, newY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setDragTarget(null);
      setIsResizing(false);
      setResizingTarget(null);
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [
    isDragging,
    dragTarget,
    dragStart,
    canvasStartPos,
    data,
    onPositionChange,
    onPricePositionChange,
    onFarmPositionChange,
    onHeadlinePositionChange,
    onSubtitlePositionChange,
    onContactPositionChange,
    onSelectLayer,
    isResizing,
    resizingTarget,
    resizingStartVal,
    resizingCenter,
    resizingStartDist,
    activeLayer,
    onSizeChange
  ]);

  const handleStartDrag = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    dragRectRef.current = canvas.getBoundingClientRect();

    const coords = getCanvasCoordinates(e, true);
    if (!coords) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height = 1080 } = getCanvasDimensions(data.aspectRatio);

    // Check if clicking a corner of the active layer for resizing
    let clickedCorner = false;
    if (activeLayer) {
      const rect = getActiveLayerRect(activeLayer, ctx, width, height);
      if (rect) {
        const visualPadding = 12;
        const drawX = rect.x - visualPadding;
        const drawY = rect.y - visualPadding;
        const drawW = rect.w + visualPadding * 2;
        const drawH = rect.h + visualPadding * 2;

        const corners = [
          { cx: drawX, cy: drawY }, // Top-Left
          { cx: drawX + drawW, cy: drawY }, // Top-Right
          { cx: drawX, cy: drawY + drawH }, // Bottom-Left
          { cx: drawX + drawW, cy: drawY + drawH } // Bottom-Right
        ];

        const handleHitRadius = 30;
        for (let i = 0; i < corners.length; i++) {
          const c = corners[i];
          const dist = Math.hypot(coords.x - c.cx, coords.y - c.cy);
          if (dist <= handleHitRadius) {
            clickedCorner = true;
            setIsResizing(true);
            setResizingTarget(activeLayer);
            
            let startVal = 1.0;
            if (activeLayer === "farm") startVal = data.farmFontSize || 32;
            else if (activeLayer === "headline") startVal = data.headlineFontSize || 64;
            else if (activeLayer === "subtitle") startVal = data.subtitleFontSize || 26;
            else if (activeLayer === "contact") startVal = data.contactFontSize || 26;
            else if (activeLayer === "price") startVal = data.priceScale || 1.0;
            else if (activeLayer === "product") startVal = data.productScale || 1.0;

            setResizingStartVal(startVal);
            
            const centerX = rect.x + rect.w / 2;
            const centerY = rect.y + rect.h / 2;
            setResizingCenter({ x: centerX, y: centerY });
            
            const startDist = Math.hypot(coords.x - centerX, coords.y - centerY);
            setResizingStartDist(startDist || 1);
            
            break;
          }
        }
      }
    }

    if (clickedCorner) {
      return;
    }

    // Perform prioritized hit search across labels, badge, and background fallback
    const result = findDragTarget(coords, ctx, width, height);
    if (!result) {
      onSelectLayer?.(null);
      return;
    }

    const { target, startX, startY } = result;

    setDragTarget(target);
    setIsDragging(true);
    setDragStart({ x: coords.x, y: coords.y });
    setCanvasStartPos({ x: startX, y: startY });
    onSelectLayer?.(target);
  };

  const handleMoveDrag = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging && !isResizing) return;

    const coords = getCanvasCoordinates(e, true);
    if (!coords) return;

    if (isResizing && resizingTarget) {
      const centerX = resizingCenter.x;
      const centerY = resizingCenter.y;
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const ratio = currentDist / resizingStartDist;
      
      let newVal = resizingStartVal * ratio;
      
      if (onSizeChange) {
        if (resizingTarget === "farm") {
          newVal = Math.round(Math.max(14, Math.min(80, newVal)));
        } else if (resizingTarget === "headline") {
          newVal = Math.round(Math.max(20, Math.min(100, newVal)));
        } else if (resizingTarget === "subtitle") {
          newVal = Math.round(Math.max(14, Math.min(60, newVal)));
        } else if (resizingTarget === "contact") {
          newVal = Math.round(Math.max(16, Math.min(48, newVal)));
        } else if (resizingTarget === "price") {
          newVal = Math.max(0.4, Math.min(2.0, newVal));
        } else if (resizingTarget === "product") {
          newVal = Math.max(0.2, Math.min(2.5, newVal));
        }
        onSizeChange(resizingTarget, newVal);
      }
      return;
    }

    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;

    const newX = Math.round(canvasStartPos.x + deltaX);
    const newY = Math.round(canvasStartPos.y + deltaY);

    if (dragTarget === "price" && onPricePositionChange) {
      onPricePositionChange(newX, newY);
    } else if (dragTarget === "product") {
      onPositionChange(newX, newY);
    } else if (dragTarget === "farm" && onFarmPositionChange) {
      onFarmPositionChange(newX, newY);
    } else if (dragTarget === "headline" && onHeadlinePositionChange) {
      onHeadlinePositionChange(newX, newY);
    } else if (dragTarget === "subtitle" && onSubtitlePositionChange) {
      onSubtitlePositionChange(newX, newY);
    } else if (dragTarget === "contact" && onContactPositionChange) {
      onContactPositionChange(newX, newY);
    }
  };

  const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging || isResizing) {
      handleMoveDrag(e);
      return;
    }

    const coords = getCanvasCoordinates(e, false);
    if (!coords || !activeLayer) {
      canvas.style.cursor = "grab";
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = getCanvasDimensions(data.aspectRatio);
    const rect = getActiveLayerRect(activeLayer, ctx, width, height);
    if (rect) {
      const visualPadding = 12;
      const drawX = rect.x - visualPadding;
      const drawY = rect.y - visualPadding;
      const drawW = rect.w + visualPadding * 2;
      const drawH = rect.h + visualPadding * 2;

      const corners = [
        { cx: drawX, cy: drawY, cursor: "nwse-resize" }, // Top-Left
        { cx: drawX + drawW, cy: drawY, cursor: "nesw-resize" }, // Top-Right
        { cx: drawX, cy: drawY + drawH, cursor: "nesw-resize" }, // Bottom-Left
        { cx: drawX + drawW, cy: drawY + drawH, cursor: "nwse-resize" } // Bottom-Right
      ];

      const handleHitRadius = 30;
      let isHoveringHandle = false;
      for (let i = 0; i < corners.length; i++) {
        const c = corners[i];
        const dist = Math.hypot(coords.x - c.cx, coords.y - c.cy);
        if (dist <= handleHitRadius) {
          canvas.style.cursor = c.cursor;
          isHoveringHandle = true;
          break;
        }
      }

      if (!isHoveringHandle) {
        const hitTarget = findDragTarget(coords, ctx, width, height);
        if (hitTarget) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "default";
        }
      }
    }
  };

  const handleStopDrag = () => {
    setIsDragging(false);
    setDragTarget(null);
    setIsResizing(false);
    setResizingTarget(null);
  };

  // --- DOWNLOAD HIGH QUALITY BANNER ACTION ---
  const downloadAdBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSuccessDownloading(true);
    setTimeout(() => setIsSuccessDownloading(false), 3000);

    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const productCleanName = data.productName ? data.productName.replace(/[\s/\\?%*:|"<>]/g, "_") : "agricultural_ad";
    const filename = `SekRoopAI_${productCleanName}.png`;

    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        } else {
          const link = document.createElement("a");
          link.download = filename;
          link.href = dataUrl;
          link.click();
        }
      }, "image/png", 1.0);
    } catch (e) {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    }

    // Open helper modal for mobile and sandboxed browsers
    setMobileImgData(dataUrl);
    setShowMobileModal(true);
  };

  return (
    <div className="w-full flex flex-col items-center select-none" ref={containerRef}>
      {/* Top screen header showing size info */}
      <div className="w-full bg-white border border-gray-100 rounded-2xl p-3.5 mb-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2E5077]/10 text-[#2E5077] flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1">
              กรอบจำลองโฆษณาเรียลไทม์
              <span className="text-[10px] bg-[#4DA1A9]/10 text-[#4DA1A9] px-2 py-0.5 rounded-full font-bold">
                {data.aspectRatio}
              </span>
            </h4>
            <p className="text-[10px] text-gray-400">
              {data.aspectRatio === "1:1" ? "สี่เหลี่ยมจัตุรัส (1080x1080px)" : data.aspectRatio === "9:16" ? "รูปสตอรี่/ริลส์แนวตั้ง (1080x1920px)" : "แนวนอนหน้าจอกว้าง (1920x1080px)"}
            </p>
          </div>
        </div>

        <button
          onClick={onResetPosition}
          className="text-xs text-gray-500 hover:text-[#2E5077] hover:underline font-semibold flex items-center gap-1"
          title="จัดทิศทางภาพกลับมาอยู่ตรงกลางเฉลี่ยปกติ"
          id="btn-v-reset"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเซ็ตตำแหน่ง</span>
        </button>
      </div>

      {/* Main Interactive Canvas Wrapper */}
      <div className="relative w-full overflow-hidden flex justify-center items-center bg-gray-100/40 rounded-2xl p-4 border border-dashed border-gray-200 min-h-[300px] mb-4 shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDrag}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleStopDrag}
          onMouseLeave={handleStopDrag}
          className={`shadow-2xl rounded-xl border border-gray-200 object-contain mx-auto ${
            isDragging ? "cursor-grabbing ring-2 ring-[#4DA1A9]" : "cursor-grab"
          }`}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            maxHeight: "460px",
            aspectRatio: data.aspectRatio === "1:1" ? "1" : data.aspectRatio === "9:16" ? "9/16" : "16/9",
            maxWidth: data.aspectRatio === "9:16" ? "min(260px, 100%)" : data.aspectRatio === "1:1" ? "min(420px, 100%)" : "100%",
          }}
          id="marketing-poster-canvas"
        />
      </div>

      {/* Download button */}
      <div className="w-full flex flex-col gap-2">
        <button
          type="button"
          onClick={downloadAdBanner}
          disabled={!selectedImageSrc}
          className={`w-full py-4 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer ${
            !selectedImageSrc
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : isSuccessDownloading
              ? "bg-green-600 text-white"
              : "bg-[#2E5077] hover:bg-[#203956] text-white"
          }`}
          id="btn-download-banner"
        >
          {isSuccessDownloading ? (
            <>
              <CheckCircle className="w-6 h-6 animate-bounce text-white mb-0.5" />
              <span className="text-sm">เสกและเตรียมไฟล์ภาพดาวน์โหลดสำเร็จแล้ว! 🎉</span>
              <span className="text-[10px] font-medium opacity-80">(ความชัดสูงพิเศษ HD)</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6 mb-0.5 text-[#79D7BE]" />
              <span className="text-sm">ดาวน์โหลดรูปโฆษณา</span>
              <span className="text-[10px] font-medium opacity-80">(ความชัดสูงพิเศษ HD)</span>
            </>
          )}
        </button>
        
        {!selectedImageSrc && (
          <p className="text-center text-[10px] text-gray-400">
            * กรุณาเลือกอัปโหลดรูปภาพสินค้าเกษตรก่อนเพื่อเปิดปุ่มดาวน์โหลดไฟล์คุณภาพสูง
          </p>
        )}
      </div>

      {/* Mobile Download Helper Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 select-text">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#2E5077] to-[#4DA1A9] text-white">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#79D7BE]" />
                <div>
                  <h3 className="text-sm font-bold">บันทึกรูปโฆษณา</h3>
                  <p className="text-[10px] text-white/80 font-medium">สำหรับใช้งานบนมือถือ / LINE / Facebook</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                id="btn-close-mobile-modal"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="bg-yellow-50 border-b border-yellow-100 p-3 flex gap-2 items-start text-xs text-yellow-800">
              <Info className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">วิธีบันทึกรูปภาพง่ายๆ:</p>
                <p className="leading-relaxed">
                  แตะค้างที่รูปภาพด้านล่างนี้ 2-3 วินาที แล้วเลือก <strong className="text-red-700">"บันทึกรูปภาพ" (Save Image)</strong> หรือ <strong className="text-red-700">"แชร์" (Share)</strong> เพื่อเก็บภาพไปยังคลังภาพของคุณ
                </p>
              </div>
            </div>

            {/* Content with the render image */}
            <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center gap-4 bg-gray-50/50">
              <div className="relative shadow-lg border border-gray-200/60 rounded-xl overflow-hidden bg-white max-w-[80%]">
                <img
                  src={mobileImgData}
                  alt="Generated agricultural ad banner"
                  className="w-full h-auto object-contain pointer-events-auto"
                  style={{ maxHeight: "320px" }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[9px] font-bold px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-sm pointer-events-none animate-pulse">
                  👇 แตะค้างที่รูปภาพนี้เพื่อบันทึก 👇
                </div>
              </div>

              <div className="w-full text-center space-y-1 text-gray-500 text-[11px] px-2 leading-relaxed">
                <p>💡 รูปภาพถูกสร้างขึ้นด้วยความละเอียดสูงพิเศษ HD (คมชัดเต็มพิกัด)</p>
                <p>หากเครื่องของคุณดาวน์โหลดอัตโนมัติแล้ว สามารถปิดหน้านี้ได้ทันที</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const productCleanName = data.productName ? data.productName.replace(/[\s/\\?%*:|"<>]/g, "_") : "agricultural_ad";
                  const filename = `SekRoopAI_${productCleanName}.png`;
                  const link = document.createElement("a");
                  link.download = filename;
                  link.href = mobileImgData;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-gray-600" />
                ดาวน์โหลดซ้ำ
              </button>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2E5077] hover:bg-[#203956] text-white text-xs font-bold transition-all cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
