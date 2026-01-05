"use client";

import { useRef, useState } from "react";
import { Sparkles, PenLine, Film, Image as ImageIcon, Grid3x3 } from "lucide-react";

type ModeTop = "angles" | "thumbnail" | "storyboard";
type Aspect = "16:9" | "9:16" | "1:1";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [mode, setMode] = useState<"auto" | "self">("auto");
  const [prompt, setPrompt] = useState("");
  const [gridGenerated, setGridGenerated] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [scale, setScale] = useState<1 | 2 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [topMode, setTopMode] = useState<ModeTop>("angles");

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleCell = (index: number) => {
    setSelected((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const generateGrid = () => {
    setLoading(true);
    setTimeout(() => {
      setGridGenerated(true);
      setLoading(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center gap-10 py-12 text-white">
      {/* TOP MODE BAR */}
      <div className="flex items-center justify-center mt-6">
        <div className="flex bg-neutral-900 border border-neutral-700 rounded-full p-1 gap-1">
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
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition ${
                  active
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* UPLOAD AREA */}
      <div
        className="relative w-[75vw] h-[55vh] border border-white/30 rounded-xl flex items-center justify-center cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {!image && (
          <span className="text-white/70 text-4xl font-semibold">
            DROP IMAGE HERE
          </span>
        )}

        {image && (
          <img
            src={image}
            alt="uploaded"
            className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none"
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
      </div>

      {/* CONTROLS */}
      {image && (
        <>
          {/* ASPECT */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs tracking-widest text-gray-400">
              OUTPUT ASPECT RATIO
            </span>

            <div className="relative w-[200px]">
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as Aspect)}
                className="
                  w-full appearance-none
                  bg-[#1c1c1c] text-white
                  px-4 py-2.5 text-sm
                  rounded-xl border border-[#2a2a2a]
                  hover:border-green-400 focus:border-green-400
                  focus:outline-none transition cursor-pointer
                "
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>

              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </div>
            </div>
          </div>

          {/* MODE SWITCH */}
          <div className="flex items-center gap-1 rounded-full border border-white/20 bg-[#1a1a1a] p-1 mt-1">
            <button
              onClick={() => setMode("auto")}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full transition ${
                mode === "auto"
                  ? "bg-green-500 text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Sparkles size={18} strokeWidth={1.8} />
              AUTO
            </button>

            <button
              onClick={() => setMode("self")}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full transition ${
                mode === "self"
                  ? "bg-green-500 text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <PenLine size={18} strokeWidth={1.8} />
              SELF PROMPT
            </button>
          </div>

          {/* PROMPT – MODE SELF */}
          {mode === "self" && (
            <div className="w-[520px] mt-4">
              <label className="block text-xs tracking-widest text-gray-400 mb-2">
                PROMPT
              </label>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="DESCRIBE THE STYLE AND WORDS YOU WOULD LIKE TO SEE IN EACH PANEL"
                className="
                  w-full h-36 resize-none
                  bg-[#111] text-white/80 text-sm
                  px-5 py-4 rounded-xl
                  border border-white/15
                  focus:border-green-400
                  focus:outline-none transition
                "
              />

              <p className="mt-2 text-xs text-white/40">
                OPTIONAL: YOUR PROMPT WILL AFFECT THE GRID GENERATION.
              </p>
            </div>
          )}

          <button
            onClick={generateGrid}
            className="bg-green-500 px-10 py-4 rounded-xl text-black font-bold mt-2"
          >
            {loading ? "ANALYZING..." : "GENERATE GRID"}
          </button>
        </>
      )}

      {/* GRID */}
      {gridGenerated && image && (
        <div className="relative w-[75vw] aspect-video border border-white/20 rounded-xl overflow-hidden z-10">
          <img
            src={image}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-auto">
            {Array.from({ length: 9 }).map((_, i) => {
              const isSelected = selected.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleCell(i)}
                  className={`relative group cursor-pointer ${
                    isSelected
                      ? "border-4 border-green-400"
                      : "border border-white/30"
                  }`}
                >
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition">
                    #{i + 1}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-black text-sm font-bold">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UPSCALE */}
      {selected.length > 0 && (
        <div className="relative z-30 flex flex-col items-center gap-5">
          <div className="flex bg-white/10 rounded-full p-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s as 1 | 2 | 4)}
                className={`px-6 py-2 rounded-full ${
                  scale === s ? "bg-white text-black" : "text-white/50"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button className="bg-green-500 px-14 py-4 rounded-xl text-black font-bold">
            UPSCALE {selected.length} IMAGE{selected.length > 1 ? "S" : ""}
          </button>
        </div>
      )}
    </main>
  );
}