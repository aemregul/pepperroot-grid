import { NextRequest, NextResponse } from 'next/server';

const PANEL_PROMPTS = {
    angles: [
        "cinematic wide shot, full body, dramatic lighting",
        "medium wide shot, head to knees, professional photography",
        "medium shot, waist up, film still",
        "medium close-up, chest and head, cinematic",
        "close-up portrait, face detail, dramatic lighting",
        "three-quarter view, angled, rim lighting",
        "low angle shot, looking up, heroic, powerful",
        "high angle shot, looking down, cinematic",
        "profile shot, side view, dramatic rim light"
    ],
    thumbnail: [
        "surprised expression, dramatic lighting, youtube thumbnail style",
        "excited expression, vibrant colors, engaging",
        "shocked expression, dramatic, eye-catching",
        "amazed expression, bright lighting, dynamic",
        "intense expression, cinematic, powerful",
        "happy expression, warm lighting, inviting",
        "curious expression, intriguing, mysterious",
        "determined expression, strong, confident",
        "emotional expression, dramatic, impactful"
    ],
    storyboard: [
        "establishing shot, wide, scene setting",
        "action beginning, movement, tension",
        "dramatic moment, close-up reaction",
        "peak action, dynamic movement",
        "intense scene, emotional",
        "climax moment, dramatic",
        "resolution approaching, hopeful",
        "conclusion, emotional beat",
        "final moment, cinematic"
    ]
};

export async function POST(request: NextRequest) {
    try {
        const { image, characterDescription, mode, aspect, panelIndex } = await request.json();

        if (!image || !characterDescription) {
            return NextResponse.json({ error: 'Image and character description required' }, { status: 400 });
        }

        const FAL_KEY = process.env.FAL_KEY;
        if (!FAL_KEY) {
            return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 });
        }

        // Panel prompt'unu al
        const modePrompts = PANEL_PROMPTS[mode as keyof typeof PANEL_PROMPTS] || PANEL_PROMPTS.angles;
        const panelPrompt = modePrompts[panelIndex] || modePrompts[0];

        // Aspect ratio için boyutlar
        const getDimensions = (aspect: string) => {
            switch (aspect) {
                case "16:9": return { width: 1024, height: 576 };
                case "9:16": return { width: 576, height: 1024 };
                case "1:1": return { width: 768, height: 768 };
                default: return { width: 1024, height: 576 };
            }
        };

        const dimensions = getDimensions(aspect);

        // Final prompt: karakter tanımı + panel açıklaması
        const finalPrompt = `${characterDescription}, ${panelPrompt}, photorealistic, 8K, highly detailed, cinematic lighting`;

        console.log(`=== PANEL ${panelIndex + 1} GENERATION ===`);
        console.log("Mode:", mode);
        console.log("Prompt:", finalPrompt.substring(0, 100) + "...");

        // IP-Adapter Face ID API çağrısı
        const requestBody = {
            model_type: "SDXL-v2-plus",
            prompt: finalPrompt,
            face_image_url: image,
            negative_prompt: "blurry, low resolution, bad, ugly, distorted face, deformed, disfigured, low quality, pixelated",
            seed: Math.floor(Math.random() * 999999999),
            guidance_scale: 7.5,
            num_inference_steps: 50,
            width: dimensions.width,
            height: dimensions.height,
            face_id_det_size: 640,
        };

        const response = await fetch("https://fal.run/fal-ai/ip-adapter-face-id", {
            method: "POST",
            headers: {
                "Authorization": `Key ${FAL_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("IP-Adapter Face ID Error:", errorText);
            return NextResponse.json({ error: `FAL.AI error: ${response.status}` }, { status: 500 });
        }

        const data = await response.json();

        if (data.image && data.image.url) {
            console.log(`Panel ${panelIndex + 1} generated successfully!`);
            return NextResponse.json({
                success: true,
                imageUrl: data.image.url,
                panelIndex
            });
        }

        return NextResponse.json({ error: "No image generated" }, { status: 500 });

    } catch (error) {
        console.error('IP-Adapter Face ID API error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Panel generation failed'
        }, { status: 500 });
    }
}
