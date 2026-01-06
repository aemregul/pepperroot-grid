"use client";

import { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  PenLine,
  Film,
  Image as ImageIcon,
  Grid3x3,
  Download,
  Upload,
  Zap,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  X,
  Mouse,
  ArrowRight,
  Clock,
} from "lucide-react";

type ModeTop = "angles" | "thumbnail" | "storyboard";
type Aspect = "16:9" | "9:16" | "1:1";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [gridImage, setGridImage] = useState<string | null>(null);
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [mode, setMode] = useState<"auto" | "self">("auto");
  const [prompt, setPrompt] = useState("");
  const [gridGenerated, setGridGenerated] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [scale, setScale] = useState<1 | 2 | 4>(2);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [topMode, setTopMode] = useState<ModeTop>("angles");
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [extractedImages, setExtractedImages] = useState<{index: number, url: string, status: 'extracting' | 'ready'}[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================
  // FILE HANDLING
  // ============================================
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setGridGenerated(false);
    setGridImage(null);
    setSelected([]);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // ============================================
  // GRID SELECTION
  // ============================================
  const toggleCell = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectAll = () => {
    if (selected.length === 9) {
      setSelected([]);
    } else {
      setSelected([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }
  };

  // ============================================
  // PROMPT BUILDER
  // ============================================
  const buildPrompt = () => {
    let basePrompt = "";

    switch (topMode) {
      case "angles":
        basePrompt =
          "Create a 3x3 grid showing this scene from 9 different camera angles: wide shot, close-up, low angle, high angle, side view, front view, detail shot, establishing shot, and dramatic perspective.";
        break;
      case "thumbnail":
        basePrompt =
          "Create a 3x3 grid of 9 eye-catching thumbnail variations of this image, each with different framing and emphasis.";
        break;
      case "storyboard":
        basePrompt =
          "Create a 3x3 grid showing a 9-panel storyboard progression of this scene.";
        break;
    }

    if (mode === "self" && prompt) {
      basePrompt += ` Style guidance: ${prompt}`;
    }

    return basePrompt;
  };

  // ============================================
  // NANOBANANA API - GRID GENERATION
  // ============================================
  const generateGrid = async () => {
    if (!image) return;

    setLoading(true);
    setLoadingProgress(0);
    setError(null);
    setSelected([]);

    try {
      // TODO: Nanobanana API entegrasyonu
      // const response = await fetch('NANOBANANA_API_URL/generate', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NANOBANANA_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     image: image,
      //     prompt: buildPrompt(),
      //     aspect_ratio: aspect,
      //   }),
      // });

      // DEMO MODE - Simüle edilmiş progress
      for (let i = 0; i <= 100; i += Math.random() * 15 + 5) {
        setLoadingProgress(Math.min(i, 99));
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      setLoadingProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      setGridImage(image);
      setGridGenerated(true);
    } catch (err) {
      console.error("Grid generation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  // ============================================
  // CROP GRID CELL
  // ============================================
  const cropGridCell = (cellIndex: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!gridImage) {
        reject(new Error("No grid image"));
        return;
      }

      const img = new window.Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context error"));
          return;
        }

        const cellWidth = img.width / 3;
        const cellHeight = img.height / 3;

        const col = cellIndex % 3;
        const row = Math.floor(cellIndex / 3);

        const x = col * cellWidth;
        const y = row * cellHeight;

        canvas.width = cellWidth;
        canvas.height = cellHeight;

        ctx.drawImage(img, x, y, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);

        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => reject(new Error("Image load failed"));
      img.src = gridImage;
    });
  };

  // ============================================
  // NANOBANANA API - UPSCALE & EXTRACT
  // ============================================
  const handleExtract = async () => {
    if (selected.length === 0) return;

    setExtracting(true);
    setExtractionProgress(0);
    setError(null);
    
    // Initialize extracted images with extracting status
    const initialImages: {index: number, url: string, status: 'extracting' | 'ready'}[] = selected.map(index => ({
      index,
      url: '',
      status: 'extracting'
    }));
    setExtractedImages([...initialImages]);

    try {
      for (let i = 0; i < selected.length; i++) {
        const cellIndex = selected[i];
        const croppedImage = await cropGridCell(cellIndex);

        // TODO: Nanobanana API ile upscale
        // const response = await fetch('NANOBANANA_API_URL/upscale', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_NANOBANANA_API_KEY}`,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     image: croppedImage,
        //     scale: scale,
        //   }),
        // });

        // DEMO MODE - API bağlanınca kaldırılacak
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update the specific image status to ready
        setExtractedImages(prev => {
          const newImages = prev.map(img => 
            img.index === cellIndex 
              ? { index: img.index, url: croppedImage, status: 'ready' as const }
              : img
          );
          return [...newImages];
        });

        setExtractionProgress(((i + 1) / selected.length) * 100);
      }
    } catch (err) {
      console.error("Extract error:", err);
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const downloadAllExtracted = () => {
    extractedImages.filter(img => img.status === 'ready').forEach(img => {
      const link = document.createElement("a");
      link.href = img.url;
      link.download = `upscaled_${img.index + 1}_${scale}x.png`;
      link.click();
    });
  };

  const downloadSingleImage = (img: {index: number, url: string}) => {
    const link = document.createElement("a");
    link.href = img.url;
    link.download = `upscaled_${img.index + 1}_${scale}x.png`;
    link.click();
  };

  // ============================================
  // UTILITIES
  // ============================================
  const resetAll = () => {
    setExtracting(false);
    setExtractionProgress(0);
    setExtractedImages([]);
    setSelected([]);
    setGridGenerated(false);
    setGridImage(null);
    setImage(null);
    setError(null);
  };

  const downloadGrid = () => {
    if (!gridImage) return;
    const link = document.createElement("a");
    link.href = gridImage;
    link.download = `grid_${topMode}_${Date.now()}.png`;
    link.click();
  };

  const fadeIn = mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4";

  // ============================================
  // MAIN UI
  // ============================================
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center gap-8 py-8 text-white relative overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <header className={`flex flex-col items-center gap-2 mt-4 transition-all duration-700 ${fadeIn}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <Grid3x3 size={24} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.3em] text-white">
            GRID<span className="text-emerald-400">GEN</span>
          </h1>
        </div>
      </header>

      {/* MODE SELECTOR */}
      <div className={`flex items-center justify-center transition-all duration-700 delay-100 ${fadeIn}`}>
        <div className="flex bg-[#111] border border-[#222] rounded-2xl p-1.5 gap-1">
          {[
            { key: "angles", label: "ANGLES", icon: Film },
            { key: "thumbnail", label: "THUMBNAIL", icon: ImageIcon },
            { key: "storyboard", label: "STORYBOARD", icon: Grid3x3 },
          ].map((item) => {
            const active = topMode === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => setTopMode(item.key as ModeTop)}
                className={`group relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                    : "text-gray-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span className="tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* UPLOAD AREA */}
      <div className={`transition-all duration-700 delay-200 ${fadeIn}`}>
        <div
          className={`relative w-[75vw] max-w-5xl h-[50vh] border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
            loading
              ? "border-[#333] bg-[#111] cursor-default"
              : isDragging
              ? "border-emerald-400 bg-emerald-500/5 scale-[1.02] cursor-pointer"
              : image
              ? "border-transparent bg-[#111] cursor-pointer"
              : "border-[#333] bg-[#0d0d0d] hover:border-[#444] hover:bg-[#111] cursor-pointer"
          }`}
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!image && (
            <span className="text-white text-4xl font-bold tracking-wide">
              DROP IMAGE HERE
            </span>
          )}

          {image && (
            <>
              <img
                src={image}
                alt="uploaded"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-[#1a1a1a]/95 flex flex-col items-center justify-center gap-6 z-20">
                  {/* Circular progress */}
                  <div className="relative w-24 h-24">
                    {/* Background circle */}
                    <svg className="w-24 h-24 -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#333"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * loadingProgress) / 100}
                        className="transition-all duration-300"
                      />
                    </svg>
                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {Math.round(loadingProgress)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Processing text */}
                  <p className="text-white text-lg font-bold tracking-[0.2em]">
                    PROCESSING IMAGE DATA
                  </p>
                </div>
              )}

              {/* Hover overlay - sadece loading değilken */}
              {!loading && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-300 flex items-center justify-center group">
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Upload size={24} className="text-white" />
                    <span className="text-white text-xl font-bold tracking-wider">
                      CHANGE IMAGE
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* CONTROLS */}
      {image && (
        <div className={`flex flex-col items-center gap-5 transition-all duration-500 ${image ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${loading ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-6">
            {/* Aspect Ratio */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] tracking-[0.3em] text-gray-600 font-medium">
                ASPECT RATIO
              </span>
              <div className="flex bg-[#111] border border-[#222] rounded-xl p-1 gap-1">
                {(["16:9", "9:16", "1:1"] as Aspect[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wider transition-all duration-200 ${
                      aspect === a
                        ? "bg-white text-black"
                        : "text-gray-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-12 bg-[#222]" />

            {/* Mode Toggle */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] tracking-[0.3em] text-gray-600 font-medium">
                PROMPT MODE
              </span>
              <div className="flex bg-[#111] border border-[#222] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setMode("auto")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium tracking-wider transition-all duration-200 ${
                    mode === "auto"
                      ? "bg-emerald-500 text-black"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Sparkles size={14} />
                  AUTO
                </button>
                <button
                  onClick={() => setMode("self")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium tracking-wider transition-all duration-200 ${
                    mode === "self"
                      ? "bg-emerald-500 text-black"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <PenLine size={14} />
                  CUSTOM
                </button>
              </div>
            </div>
          </div>

          {/* Custom Prompt */}
          {mode === "self" && (
            <div className="w-[500px]">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your style... warm tones, cinematic lighting, golden hour..."
                  className="w-full h-28 resize-none bg-[#111] text-white/90 text-sm px-4 py-3 rounded-xl border border-[#222] focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-700"
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-gray-700">
                  {prompt.length} / 500
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateGrid}
            disabled={loading}
            className="group relative bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 px-12 py-4 rounded-xl text-black font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-3">
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  GENERATING...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  {gridGenerated ? "REGENERATE GRID" : "GENERATE GRID"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>

          {gridGenerated && (
            <p className="text-[10px] text-gray-600 tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} />
              PROCESSING TIME: ~3-4 MINUTES
            </p>
          )}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3">
          <AlertTriangle className="text-red-400" size={18} />
          <span className="text-red-200 text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* GRID SELECTION */}
      {gridGenerated && gridImage && (
        <div className="flex flex-col items-center gap-3 mt-2 w-full">
          {/* Divider line - saydam */}
          <div className="w-[95vw] max-w-7xl h-[1px] bg-white/10" />
          
          {/* Grid Controls - SELECT ALL sol, DOWNLOAD sağ */}
          <div className="w-[95vw] max-w-7xl flex justify-between items-center mt-4">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-400 transition-colors tracking-wider"
            >
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                  selected.length === 9
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-gray-600"
                }`}
              >
                {selected.length === 9 && <Check size={12} className="text-black" />}
              </div>
              SELECT ALL
              {selected.length > 0 && (
                <span className="text-emerald-400 ml-2">({selected.length} SELECTED)</span>
              )}
            </button>

            <button
              onClick={downloadGrid}
              className="flex items-center gap-2 bg-transparent hover:bg-[#1a1a1a] border border-[#333] px-3 py-2 rounded text-xs tracking-wider transition-all duration-200 group"
            >
              <Download size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-gray-300 group-hover:text-white transition-colors">
                DOWNLOAD GRID (SINGLE PNG)
              </span>
            </button>
          </div>

          {/* GRID */}
          <div className="relative w-[95vw] max-w-7xl overflow-hidden">
            <div 
              className="w-full grid"
              style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                aspectRatio: '21 / 10',
                gap: '1px',
                backgroundColor: '#000'
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => {
                const isSelected = selected.includes(i);
                const extractedImg = extractedImages.find(img => img.index === i);
                const isExtracting = extractedImg?.status === 'extracting';
                const isExtracted = extractedImg?.status === 'ready';
                const isDisabled = isExtracting || isExtracted;
                
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!isDisabled) {
                        toggleCell(i);
                      }
                    }}
                    className={`relative group overflow-hidden ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{
                      backgroundImage: `url(${gridImage})`,
                      backgroundSize: "300% 300%",
                      backgroundPosition: `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`,
                    }}
                  >
                    <div
                      className={`absolute inset-0 transition-all duration-200 ${
                        isDisabled
                          ? ""
                          : "bg-transparent group-hover:bg-white/5"
                      }`}
                    />

                    {/* EXTRACTED badge - sol üst */}
                    {isExtracted && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-emerald-500/50 px-3 py-1.5 rounded text-xs font-medium text-emerald-400 tracking-wide">
                        EXTRACTED
                      </div>
                    )}

                    {/* REGENERATING badge - sol üst */}
                    {isExtracting && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-yellow-500/50 px-3 py-1.5 rounded text-xs font-medium text-yellow-400 tracking-wide">
                        <RefreshCw size={12} className="animate-spin" />
                        REGENERATING
                      </div>
                    )}

                    {/* Numara badge - sol alt (sadece extracted/extracting değilse) */}
                    {!isExtracted && !isExtracting && (
                      <div
                        className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                          isSelected
                            ? "bg-emerald-500 text-black opacity-100"
                            : "bg-black/70 text-gray-300 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        #{i + 1}
                      </div>
                    )}

                    {/* Selection border - kalın saydam çerçeve */}
                    <div
                      className={`absolute inset-0 transition-all duration-200 pointer-events-none ${
                        isSelected || isExtracted || isExtracting 
                          ? "border-4 border-emerald-400/70" 
                          : "border-transparent"
                      }`}
                    />

                    {/* Checkmark - sağ üst */}
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isSelected || isExtracted
                          ? "bg-emerald-400 scale-100"
                          : "bg-white/20 scale-0 group-hover:scale-100"
                      }`}
                    >
                      <Check size={12} className={isSelected || isExtracted ? "text-black" : "text-white/50"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EXTRACT SECTION */}
      {selected.length > 0 && (
        <div className="flex flex-col items-center gap-5 py-8">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] tracking-[0.3em] text-gray-600 font-medium">
              EXTRACTION QUALITY
            </span>
            <div className="flex bg-[#111] border border-[#222] rounded-xl p-1 gap-1">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s as 1 | 2 | 4)}
                  className={`relative px-8 py-3 rounded-lg text-sm font-bold tracking-wider transition-all duration-200 ${
                    scale === s
                      ? "bg-white text-black"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {s}X
                  {s === 4 && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-emerald-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                      4K
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExtract}
            disabled={loading}
            className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-14 py-4 rounded-xl text-black font-bold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30"
          >
            <span className="flex items-center gap-3">
              <Download size={20} />
              UPSCALE {selected.length} IMAGE{selected.length > 1 ? "S" : ""}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <div className="flex items-center gap-4 text-[10px] text-gray-600 tracking-[0.15em]">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              ESTIMATED: ~{selected.length} MIN
            </span>
          </div>
        </div>
      )}

      {/* EXTRACTION QUEUE */}
      {extractedImages.length > 0 && (
        <div className="flex flex-col items-center gap-6 w-full py-8">
          {/* Divider line with arrow */}
          <div className="w-[95vw] max-w-7xl flex flex-col items-center gap-0">
            <div className="w-full h-[1px] bg-white/20" />
            <div className="w-10 h-10 -mt-5 rounded-full border border-white/20 bg-[#0a0a0a] flex items-center justify-center">
              <Download size={18} className="text-gray-500" />
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-wider text-emerald-400">
              EXTRACTION QUEUE
            </h2>
            <span className="text-gray-500 text-2xl">({extractedImages.length})</span>
          </div>

          {/* Download button */}
          <div className="w-[95vw] max-w-7xl flex justify-end">
            {extracting ? (
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-4 py-2.5 rounded-lg text-sm">
                <Loader2 size={16} className="text-gray-400 animate-spin" />
                <span className="text-gray-400 tracking-wider">EXTRACTING...</span>
              </div>
            ) : (
              <button
                onClick={downloadAllExtracted}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                <Download size={16} className="text-black" />
                <span className="text-black tracking-wider">DOWNLOAD READY</span>
              </button>
            )}
          </div>

          {/* Extracted images grid */}
          <div className="w-[95vw] max-w-7xl grid grid-cols-3 gap-2">
            {extractedImages.map((img) => (
              <div
                key={img.index}
                className={`relative aspect-[21/10] bg-[#111] overflow-hidden group`}
                style={{
                  backgroundImage: img.status === 'ready' ? `url(${img.url})` : `url(${gridImage})`,
                  backgroundSize: img.status === 'ready' ? 'cover' : '300% 300%',
                  backgroundPosition: img.status === 'ready' ? 'center' : `${(img.index % 3) * 50}% ${Math.floor(img.index / 3) * 50}%`,
                }}
              >
                {/* Dark overlay for extracting */}
                {img.status === 'extracting' && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                    {/* Spinner */}
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Hover overlay with buttons - sadece ready durumunda */}
                {img.status === 'ready' && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {/* Upload as input button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Upload as input - görseli ana input olarak kullan
                        setImage(img.url);
                        setGridImage(null);
                        setGridGenerated(false);
                        setSelected([]);
                        setExtractedImages([]);
                      }}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-3 py-2 rounded-lg text-black font-bold text-xs tracking-wide transition-all"
                    >
                      <Sparkles size={14} />
                      UPLOAD AS INPUT
                    </button>

                    {/* Retry upscale button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Retry - bu görseli tekrar upscale et
                        // TODO: Implement retry logic
                      }}
                      className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] flex items-center justify-center transition-all group/btn relative"
                      title="Retry upscale"
                    >
                      <RefreshCw size={16} className="text-white" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#222] text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition-opacity">
                        Retry upscale
                      </span>
                    </button>

                    {/* Download button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSingleImage(img);
                      }}
                      className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] flex items-center justify-center transition-all group/btn relative"
                      title="Download image"
                    >
                      <Download size={16} className="text-white" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#222] text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition-opacity">
                        Download image
                      </span>
                    </button>
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute bottom-3 left-3 px-2 py-1 text-xs font-medium tracking-wider ${
                  img.status === 'extracting' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-emerald-500 text-black'
                }`}>
                  {img.status === 'extracting' ? 'EXTRACTING ...' : `READY • ${scale}X`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GO AGAIN & WARNING SECTION */}
      {gridGenerated && (
        <div className="flex flex-col items-center gap-6 py-8">
          <button
            onClick={resetAll}
            className="bg-emerald-500 hover:bg-emerald-400 px-16 py-4 rounded-xl text-black font-bold text-lg tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25"
          >
            GO AGAIN
          </button>

          <div className="flex flex-col items-center gap-3 max-w-2xl text-center">
            <p className="text-yellow-500 font-bold text-lg tracking-widest">WARNING:</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              CLICKING "GO AGAIN" WILL RESTART THE ENTIRE PROCESS. ANY EXTRACTED
              IMAGES THAT HAVEN'T BEEN DOWNLOADED WILL BE PERMANENTLY LOST
              AND CANNOT BE RECOVERED.
            </p>
            <p className="text-gray-600 text-xs tracking-wide mt-1">
              MAKE SURE TO DOWNLOAD ALL YOUR IMAGES BEFORE PROCEEDING.
            </p>
          </div>
        </div>
      )}


    </main>
  );
}