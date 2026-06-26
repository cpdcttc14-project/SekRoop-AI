import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

/**
 * Lazy initialize Gemini client to prevent crash on startup if key is missing.
 */
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("ระบบตรวจไม่พบ 'GEMINI_API_KEY' ในการตั้งค่า กรุณากรอกรหัสผ่านเพื่อเรียกใช้ระบบปัญญาประดิษฐ์ในแผงควบคุม Secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a larger limit to handle base64 images
app.use(express.json({ limit: "25mb" }));

// Helper to process incoming Data URLs
interface ParsedDataUrl {
  mimeType: string;
  base64Data: string;
}
function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches) {
    // If it's not a data URL, assume png/jpeg and try to clean it
    const cleanBase64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
    return {
      mimeType: "image/jpeg",
      base64Data: cleanBase64,
    };
  }
  return {
    mimeType: matches[1],
    base64Data: matches[2],
  };
}

/**
 * Creative fallback generator when Gemini API Key is missing or invalid.
 * Allows the farmer to experience the full app features instantly.
 */
function generateMockAdResult(
  farmName: string,
  productName: string,
  secondaryText: string,
  errorMsg?: string
) {
  const farm = farmName || "สวนเกษตรอินทรีย์";
  const product = productName || "ผลผลิตธรรมชาติ";
  const details = secondaryText || "คัดพิเศษเกรดพรีเมียม";

  let productType = "ผลผลิตทางการเกษตรเกรดพรีเมียม";
  let analysis = "ผลผลิตสดใหม่ สีสันธรรมชาติสวยงาม คัดเลือกมาอย่างใส่ใจ เหมาะกับการจัดเลย์เอาต์โฆษณาเพื่อให้ดึงดูดสายตาลูกค้าในโซเชียลมีเดีย";
  let themeColors = {
    primary: "#2E5077",
    secondary: "#4DA1A9",
    bgStart: "#F6FBF9",
    bgEnd: "#E8F5E9"
  };

  const textLower = (product + " " + details).toLowerCase();

  if (textLower.includes("ทุเรียน") || textLower.includes("durian")) {
    productType = "ทุเรียนหมอนทองคัดเกรดพรีเมียม";
    analysis = "ราชาผลไม้ไทย ทุเรียนพูโตสวยสีเหลืองทองน่าทาน เนื้อแห้งเนียนนุ่มกำลังดี เหมาะกับโทนสีอุ่นและเขียวธรรมชาติเพื่อความน่าเชื่อถือระดับส่งออก";
    themeColors = {
      primary: "#2E5077",
      secondary: "#FBC02D",
      bgStart: "#FFFDE7",
      bgEnd: "#F0F4C3"
    };
  } else if (textLower.includes("มะม่วง") || textLower.includes("mango")) {
    productType = "มะม่วงน้ำดอกไม้สีทองรสชาติหวานฉ่ำ";
    analysis = "มะม่วงผลสีทองพรีเมียม ผิวนวลสวยงามไร้จุดตำหนิ เหมาะกับคู่โทนสีเหลืองทองและขาวพาสเทลเพื่อดึงดูดความสดชื่นหอมหวาน";
    themeColors = {
      primary: "#D84315",
      secondary: "#FFB300",
      bgStart: "#FFFDE7",
      bgEnd: "#FFE082"
    };
  } else if (textLower.includes("กาแฟ") || textLower.includes("coffee") || textLower.includes("เมล็ดกาแฟ")) {
    productType = "เมล็ดกาแฟโรบัสต้าคั่วบดเกรดเอ";
    analysis = "เมล็ดกาแฟสีน้ำตาลเข้มมันเงา หอมเข้มเต็มรสชาติแบบธรรมชาติ ดึงดูดสายตาคอกาแฟได้ดี เหมาะกับคู่สีเอิร์ธโทน น้ำตาล-ครีมระดับหรูหรา";
    themeColors = {
      primary: "#4E342E",
      secondary: "#8D6E63",
      bgStart: "#EFEBE9",
      bgEnd: "#D7CCC8"
    };
  } else if (textLower.includes("ผัก") || textLower.includes("สลัด") || textLower.includes("salad") || textLower.includes("กะหล่ำ") || textLower.includes("มะเขือ")) {
    productType = "ผักสลัดออร์แกนิกกรอบสดใหม่";
    analysis = "ผักใบเขียวสดกรอบ ดูฉ่ำน้ำมีชีวิตชีวา ปราศจากสารเคมี เหมาะกับคู่สีเขียวขจีและขาวสะอาดเพื่อเน้นความเป็นออร์แกนิกและสุขภาพ";
    themeColors = {
      primary: "#1B5E20",
      secondary: "#4CAF50",
      bgStart: "#F1F8E9",
      bgEnd: "#DCEDC8"
    };
  } else if (textLower.includes("ข้าว") || textLower.includes("rice") || textLower.includes("หอมมะลิ")) {
    productType = "ข้าวหอมมะลิไทยแท้คัดเกรดพิเศษ";
    analysis = "เมล็ดข้าวเรียวยาว ขาวใส หอมกลิ่นมะลิธรรมชาติ เหมาะกับสีโทนครามน้ำเงินและสีทองพรีเมียมสลักชื่อแบรนด์อย่างงดงาม";
    themeColors = {
      primary: "#1565C0",
      secondary: "#FFB300",
      bgStart: "#F5F5F5",
      bgEnd: "#E3F2FD"
    };
  } else if (textLower.includes("เมล่อน") || textLower.includes("แตงโม") || textLower.includes("melon")) {
    productType = "เมล่อนญี่ปุ่นลายตาข่ายหวานฉ่ำ";
    analysis = "ผลกลมสวย ลายเน็ตสม่ำเสมอนูนชัด ขั้วสดใหม่สีเขียวสะดุดตา เหมาะกับโทนสีครีมเขียวพาสเทลน่าทานเป็นพิเศษ";
    themeColors = {
      primary: "#2E5077",
      secondary: "#4CAF50",
      bgStart: "#F1F8E9",
      bgEnd: "#E8F5E9"
    };
  }

  const suggestedHeadlines = [
    `✨ ${product} สดแท้ส่งตรงจากสวน ${farm}!`,
    `🌱 คัดสรรพรีเมียมทุกลูก อร่อยหวานฉ่ำการันตีคุณภาพ`,
    `💚 ${product} หวานธรรมชาติ ปลอดสารพิษ 100% เพื่อสุขภาพ`,
    `🏆 ผลผลิตระดับเกรดส่งออก จัดส่งตรงถึงหน้าบ้านคุณ`
  ];

  const suggestedSubtitles = [
    `${details}`,
    `โปรโมชั่นต้อนรับฤดูกาล สั่งวันนี้รับส่วนลดและของแถมพิเศษ!`,
    `สด สะอาด ปลอดภัย ใส่ใจในทุกกระบวนการปลูกจากไร่ ${farm}`,
    `ลิ้มลองรสชาติธรรมชาติแท้ๆ ที่ดีต่อใจและสุขภาพของคุณ`
  ];

  const badges = [
    "สดจากสวน 100%",
    "คัดพิเศษ",
    "ไร้สารเคมี",
    "อร่อยชวนลอง",
    "ส่งตรงถึงบ้าน",
    "เกษตรวิถีไทย"
  ];

  const socialCaption = `📢 แนะนำผลผลิตเกรดพรีเมียมจากสวน! 
🌱 ขอเสนอความอร่อยสดใหม่ของ "${product}" คัดพิเศษจากวิถีธรรมชาติของ "${farm}" 

✨ จุดเด่นที่ห้ามพลาด:
✅ สดใหม่ คัดมือทุกลูกจากสวนทุกเช้า
✅ รสชาติอร่อยถูกใจตามธรรมชาติ
✅ ปลอดภัย ปราศจากสารเคมีตกค้าง 100%
✅ ${details}

📦 สั่งซื้อวันนี้ บริการจัดส่งด่วนตรงถึงหน้าบ้านคุณทั่วไทย!
💬 สนใจสั่งซื้อ สอบถามรอบจัดส่ง หรือทักแชทอินบ็อกซ์เข้ามาได้ทันทีครับ/ค่ะ!

#${product.replace(/\s+/g, "")} #สดจากสวน #${farm.replace(/\s+/g, "")} #เกษตรอินทรีย์ #อาหารเพื่อสุขภาพ #ผลไม้เกรดพรีเมียม`;

  return {
    productType,
    analysis,
    suggestedHeadlines,
    suggestedSubtitles,
    badges,
    recommendedThemeColors: themeColors,
    socialCaption,
    isDemoMode: true,
    demoMessage: errorMsg || "เปิดใช้งานระบบจำลอง"
  };
}

// REST API for checking service status
app.get("/api/health", (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  const isPlaceholder = !key || key === "MY_GEMINI_API_KEY" || key.trim() === "";
  res.json({
    status: "ok",
    hasApiKey: !isPlaceholder,
    time: new Date().toISOString(),
  });
});

// AI Advertising Generation Endpoint
app.post("/api/generate-ad", async (req, res) => {
  try {
    const { image, farmName, productName, secondaryText } = req.body;

    if (!image) {
      res.status(400).json({ error: "กรุณาอัปโหลดรูปภาพสินค้าเกษตร" });
      return;
    }

    const key = process.env.GEMINI_API_KEY;
    const isPlaceholder = !key || key === "MY_GEMINI_API_KEY" || key.trim() === "";

    if (isPlaceholder) {
      console.warn("[SekRoop AI Server] Missing or placeholder GEMINI_API_KEY. Using creative fallback.");
      const demoResult = generateMockAdResult(
        farmName,
        productName,
        secondaryText,
        "ระบบตรวจไม่พบรหัสคีย์ API (GEMINI_API_KEY) ในการตั้งค่าแผงควบคุม Secrets ของ AI Studio"
      );
      res.json(demoResult);
      return;
    }

    const ai = getGeminiClient();
    const { mimeType, base64Data } = parseDataUrl(image);

    // Prepare prompt
    const promptInstructions = `
คุณคือผู้เชี่ยวชาญด้านการสร้างแบรนด์ การทำคอนเทนต์โฆษณา และการจัดรูปเลย์เอาต์ระดับพรีเมียมเพื่อช่วยเหลือเกษตรกรไทย
คุณได้รับรูปภาพต้นฉบับสินค้าเกษตรจากเกษตรกรไทย 
ข้อมูลเบื้องต้นที่เกษตรกรส่งมาให้:
- ชื่อสวน/ร้านค้า: "${farmName || "ไม่ระบุ"}"
- ชื่อสินค้าผลผลิต: "${productName || "ไม่ระบุ"}"
- รายละเอียดเสริม/โปรโมชั่นเบื้องต้น: "${secondaryText || "ไม่ระบุ"}"

หน้าที่ของคุณคือวิเคราะห์รูปภาพสินค้านี้อย่างละเอียด และเสกคำโฆษณาเป็นภาษาไทยที่เป๊ะ 100% ถูกต้องตามพจนานุกรมฉบับราชบัณฑิตยสถานสะกดคำถูกต้อง ห้ามมีสระสลับตำแหน่งหรือสระลอย และห้ามตัดกระพริบคำตรงกลางคำที่ทำให้เสียความหมาย

งานที่ต้องส่งคืนในรูปแบบโครงสร้าง JSON:
1. productType: ระบุชนิดผลผลิตทางการเกษตรที่มองเห็นในรูปภาพ (เช่น "ทุเรียนหมอนทอง", "มะม่วงน้ำดอกไม้", "เมล็ดกาแฟโรบัสต้า", "ข้าวหอมมะลิแท้", "ผักสลัดออร์แกนิก")
2. analysis: เขียนอธิบายภาพจุดเด่นของสินค้าที่เห็นในรูปสั้นๆ 1-2 ประโยค (เช่น "เมล่อนสีเขียวตาข่ายลอนชัดเจน ขั้วสดเหมือนเพิ่งตัดแต่ง สวยงามน่าทานยิ่งนัก")
3. suggestedHeadlines: เสก "พาดหัวระดับโปรโมทเพจ" 4 แบบเด็ดๆ สั้นกระชับ สัมผัสคล้องจอง เช่น:
   - "กรอบนอกนุ่มใน หวานฉ่ำทุกลูก!"
   - "คัดเกรดพรีเมียมจากต้น ส่งตรงถึงบ้านคุณ"
   - "หวานธรรมชาติ ไร้สารเคมี ปลอดปลอดภัย 100%"
4. suggestedSubtitles: เสก "คำโปรโมชั่นหรือสโลแกนจำง่าย" 4 แบบเด็ดๆ ที่ดึงดูดใจ
5. badges: เลือกข้อความสลักตราสุดฮิตให้ 4 แบบ คัดคำเด็ดๆ สั้นๆ ไม่เกิน 12 ตัวอักษร (เช่น "ส่งตรงจากสวน", "สดใหม่ 100%", "อร่อยท้าพิสูจน์", "เกษตรวิถีไทย", "คัดพิเศษทุกลูก")
6. recommendedThemeColors: ให้ตรวจประเมินหาคู่โทนสีที่เหมาะสมที่สุดกับผลผลิตนี้ เพื่อใช้เป็นข้อมูลทำแบนเนอร์ให้ตัดกับผิวนอกสินค้าอย่างสวยงาม โดยครอบคลุม:
   - primary: สีเด่นหลักของคำพาดหัว (เป็นรหัส HEX เช่น #FFB200)
   - secondary: สีรอง (เป็นรหัส HEX)
   - bgStart: สีจุดเริ่มต้นไล่โทนพื้นหลัง (HEX)
   - bgEnd: สีปลายทางไล่โทนพื้นหลัง (HEX)
7. socialCaption: เสกคำโปรยข้อความสื่อสารออนไลน์ (Social Media Sales Post) ความยาวพอเหมาะ น่าเชื่อถือ เร้าจูงใจ มีเครื่องหมายแฮชแท็ก (#) แทรกอย่างเหมาะสม เช่น #ทุเรียนพรีเมียม #จากสวนเกษตรอินทรีย์ เป็นต้น
`;

    const productPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: promptInstructions,
    };

    // Calling Gemini-3.5-flash which is appropriate for complex textual copy-writing and analysis tasks
    const configSchema = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: [
          "productType",
          "analysis",
          "suggestedHeadlines",
          "suggestedSubtitles",
          "badges",
          "recommendedThemeColors",
          "socialCaption"
        ],
        properties: {
          productType: {
            type: Type.STRING,
            description: "The identified agricultural product type, in Thai",
          },
          analysis: {
            type: Type.STRING,
            description: "Short analysis of visual strengths in Thai status, 1-2 sentences",
          },
          suggestedHeadlines: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of 4 captivating high-converting Thai marketing headlines",
          },
          suggestedSubtitles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of 4 persuasive subheaders or taglines",
          },
          badges: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of 4 promotional badge phrases (e.g., 'สดจากสวน')",
          },
          recommendedThemeColors: {
            type: Type.OBJECT,
            required: ["primary", "secondary", "bgStart", "bgEnd"],
            properties: {
              primary: { type: Type.STRING },
              secondary: { type: Type.STRING },
              bgStart: { type: Type.STRING },
              bgEnd: { type: Type.STRING },
            },
          },
          socialCaption: {
            type: Type.STRING,
            description: "A complete high-converting Facebook/online sales post caption in Thai, with emojis and hashtags",
          },
        },
      },
    };

    let response;
    let success = false;
    let lastError = null;

    // Attempt 1: gemini-3.5-flash (Standard Flash Model)
    try {
      console.log("[SekRoop AI] Attempting generation with model: gemini-3.5-flash");
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [productPart, textPart] },
        config: configSchema,
      });
      success = true;
    } catch (err1: any) {
      lastError = err1;
      console.warn("[SekRoop AI] Primary model gemini-3.5-flash failed or busy. Trying backup model gemini-3.1-flash-lite...", err1.message || err1);
    }

    // Attempt 2: gemini-3.1-flash-lite (Flash Lite Model)
    if (!success) {
      try {
        console.log("[SekRoop AI] Attempting generation with model: gemini-3.1-flash-lite");
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: { parts: [productPart, textPart] },
          config: configSchema,
        });
        success = true;
      } catch (err2: any) {
        lastError = err2;
        console.warn("[SekRoop AI] Backup model gemini-3.1-flash-lite failed or busy too. Trying gemini-flash-latest...", err2.message || err2);
      }
    }

    // Attempt 3: gemini-flash-latest (General Flash Alias)
    if (!success) {
      try {
        console.log("[SekRoop AI] Attempting generation with model: gemini-flash-latest");
        response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: { parts: [productPart, textPart] },
          config: configSchema,
        });
        success = true;
      } catch (err3: any) {
        lastError = err3;
        console.warn("[SekRoop AI] All model attempts failed or busy.", err3.message || err3);
      }
    }

    if (!success || !response) {
      throw lastError || new Error("ระบบ AI ขัดข้องชั่วคราวเนื่องจากผู้ใช้งานหนาแน่น กรุณาลองใหม่อีกครั้ง");
    }

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini AI ไม่ส่งคืนผลลัพธ์การเขียนคำโฆษณา กรุณาลองใหม่อีกครั้ง");
    }

    const adResult = JSON.parse(resultText.trim());
    res.json(adResult);
  } catch (error: any) {
    console.error("AI Generation error, falling back to creative mock generator:", error);
    // Even if Gemini API fails, we return a high quality mock response so the user is never blocked!
    const fallbackResult = generateMockAdResult(
      req.body.farmName,
      req.body.productName,
      req.body.secondaryText,
      error.message || "รหัสผ่าน Gemini API ล้มเหลวชั่วคราวในการตอบสนอง"
    );
    res.json(fallbackResult);
  }
});

// Setup dev server or static static assets serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve client router for SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SekRoop AI Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
