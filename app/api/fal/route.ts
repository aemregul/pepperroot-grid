import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, aspect, prompt, mode } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 });
    }

    console.log("=== FAL.AI GENERATION ===");
    console.log("Mode:", mode);
    console.log("Aspect:", aspect);

    // Grid prompt oluştur
    const gridPrompt = buildGridPrompt(mode, prompt);
    console.log("Grid Prompt:", gridPrompt.substring(0, 200) + "...");

    // FAL.AI base64 data URI'yi direkt kabul ediyor!
    // image zaten "data:image/jpeg;base64,..." formatında

    // 1. Nano Banana Pro Edit dene
    try {
      console.log("Trying Nano Banana Pro Edit...");
      const result = await generateWithNanoBananaPro(image, gridPrompt, aspect, FAL_KEY);
      console.log("Nano Banana Pro success!");
      return NextResponse.json({ success: true, gridImage: result, panels: [] });
    } catch (nbError) {
      console.error("Nano Banana Pro failed:", nbError);
    }

    // 2. FLUX 2 Pro Edit dene
    try {
      console.log("Trying FLUX 2 Pro Edit...");
      const result = await generateWithFlux2ProEdit(image, gridPrompt, FAL_KEY);
      console.log("FLUX 2 Pro Edit success!");
      return NextResponse.json({ success: true, gridImage: result, panels: [] });
    } catch (flux2Error) {
      console.error("FLUX 2 Pro Edit failed:", flux2Error);
    }

    // 3. FLUX 1 dev image-to-image (fallback)
    try {
      console.log("Trying FLUX 1 dev image-to-image...");
      const result = await generateWithFlux1Dev(image, gridPrompt, aspect, FAL_KEY);
      console.log("FLUX 1 dev success!");
      return NextResponse.json({ success: true, gridImage: result, panels: [] });
    } catch (flux1Error) {
      console.error("FLUX 1 dev failed:", flux1Error);
      throw flux1Error;
    }

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Generation failed'
    }, { status: 500 });
  }
}

// Nano Banana Pro Edit - Google Gemini 3 Pro tabanlı
async function generateWithNanoBananaPro(imageData: string, prompt: string, aspect: string, apiKey: string): Promise<string> {
  const aspectRatio = aspect === "16:9" ? "16:9" : aspect === "9:16" ? "9:16" : "1:1";

  const requestBody = {
    prompt: prompt,
    image_urls: [imageData],  // FAL base64 data URI kabul ediyor
    num_images: 1,
    aspect_ratio: aspectRatio,
    output_format: "png",
    resolution: "2K",
  };

  console.log("Nano Banana Pro request...");

  const response = await fetch("https://fal.run/fal-ai/nano-banana-pro/edit", {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Nano Banana Pro error response:", errorText);
    throw new Error(`Nano Banana Pro failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Nano Banana Pro response:", JSON.stringify(data).substring(0, 200));

  if (data.images && data.images.length > 0) {
    return data.images[0].url;
  }

  throw new Error("No images in response");
}

// FLUX 2 Pro Edit
async function generateWithFlux2ProEdit(imageData: string, prompt: string, apiKey: string): Promise<string> {
  const requestBody = {
    prompt: prompt,
    image_urls: [imageData],
  };

  console.log("FLUX 2 Pro Edit request...");

  const response = await fetch("https://fal.run/fal-ai/flux-2-pro/edit", {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("FLUX 2 Pro Edit error response:", errorText);
    throw new Error(`FLUX 2 Pro Edit failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("FLUX 2 Pro Edit response:", JSON.stringify(data).substring(0, 200));

  if (data.images && data.images.length > 0) {
    return data.images[0].url;
  }

  throw new Error("No images in response");
}

// FLUX 1 dev image-to-image (en güvenilir fallback)
async function generateWithFlux1Dev(imageData: string, prompt: string, aspect: string, apiKey: string): Promise<string> {
  const imageSize = aspect === "16:9"
    ? { width: 1920, height: 1080 }
    : aspect === "9:16"
      ? { width: 1080, height: 1920 }
      : { width: 1024, height: 1024 };

  const requestBody = {
    prompt: prompt,
    image_url: imageData,  // FLUX 1 tek URL alıyor (array değil)
    strength: 0.75,
    num_inference_steps: 28,
    guidance_scale: 3.5,
    image_size: imageSize,
    num_images: 1,
    enable_safety_checker: false,
    output_format: "png",
  };

  console.log("FLUX 1 dev request...");

  const response = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("FLUX 1 dev error response:", errorText);
    throw new Error(`FLUX 1 dev failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("FLUX 1 dev response:", JSON.stringify(data).substring(0, 200));

  if (data.images && data.images.length > 0) {
    return data.images[0].url;
  }

  throw new Error("No images in response");
}

function buildGridPrompt(mode: string, characterPrompt: string): string {
  const basePrompt = characterPrompt || "the subject from the reference image";

  switch (mode) {
    case "angles":
      return `Create a professional 3x3 grid layout showing 9 different cinematic camera angles of ${basePrompt}. 

CRITICAL REQUIREMENTS:
- NO borders, NO gaps, NO white space between panels
- Each panel flows seamlessly edge-to-edge
- All 9 panels show the EXACT SAME person with identical face, skin tone, features
- The face must be clearly visible in ALL panels

9 CAMERA ANGLES (left to right, top to bottom):
1. Wide establishing shot - full body, environment visible
2. Medium wide - head to knees
3. Medium shot - waist up, classic portrait
4. Medium close-up - chest and head
5. Close-up - face fills 70% of frame
6. Three-quarter angle - face turned 45°
7. Low angle - camera below, looking up heroically  
8. High angle - camera above, looking down
9. Profile view - side of face, rim lighting

Style: Cinematic, photorealistic, 8K quality, consistent lighting.`;

    case "thumbnail":
      return `Create a professional 3x3 grid of 9 YouTube thumbnail variations showing ${basePrompt}.

CRITICAL REQUIREMENTS:
- NO borders, NO gaps between panels
- All 9 panels show the EXACT SAME person
- Keep original background visible, only add color TINTS

9 THUMBNAIL STYLES:
1. Warm ORANGE tint - SURPRISED expression
2. Cool BLUE light - EXCITED, wide eyes
3. Golden YELLOW glow - AMAZED, looking up
4. Soft TEAL accent - CURIOUS, raised eyebrow
5. Purple RIM light - SHOCKED
6. Sunset WARM backlight - TRIUMPHANT
7. Cyan HIGHLIGHTS - WORRIED
8. Pink AMBIENT - HAPPY, smile
9. Dramatic BACKLIGHT - INTENSE

Style: YouTube thumbnail quality, dramatic, photorealistic.`;

    case "storyboard":
      return `Create a professional 3x3 storyboard grid of 9 sequential panels showing ${basePrompt}.

CRITICAL REQUIREMENTS:
- NO borders, NO gaps between panels
- All 9 panels show the EXACT SAME person
- Story progresses left to right, top to bottom

9 STORY BEATS:
1. ESTABLISHING - calm moment, wide shot
2. TENSION - notices something, medium
3. REACTION - close-up, concern
4. ACTION BEGINS - starts moving
5. PEAK ACTION - dynamic movement
6. INTENSITY - extreme close-up, emotion
7. CLIMAX - dramatic action
8. RESOLUTION - conflict ending
9. CONCLUSION - final emotional beat

Style: Cinematic storyboard, film quality, consistent character.`;

    default:
      return `Create a 3x3 grid of 9 variations showing ${basePrompt}. NO borders, NO gaps. Photorealistic, cinematic.`;
  }
}