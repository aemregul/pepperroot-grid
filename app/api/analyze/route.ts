import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, mode, aspect } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    // Base64 formatını düzenle
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const modeDescriptions: Record<string, string> = {
      angles: 'different cinematic camera angles (wide shot, medium shot, close-up, low angle, high angle, over-the-shoulder, dutch angle, bird eye view, etc.). Each panel shows the SAME moment from a different camera position.',
      
      thumbnail: `YouTube clickbait thumbnail designs. CRITICAL REQUIREMENTS:
- Each panel must have BOLD, ATTENTION-GRABBING TEXT/TITLE overlay (like "SHOCKING!", "YOU WON'T BELIEVE THIS", "WAIT WHAT?!", "MUST SEE", "FINALLY!", etc.)
- Use EXAGGERATED facial expressions (shocked, surprised, excited, curious, amazed)
- Add GRAPHIC ELEMENTS like arrows pointing at something, circles highlighting areas, emoji-style reactions
- Apply DIFFERENT COLOR GRADING to each panel (warm orange/yellow, cool blue, high contrast, vibrant saturated)
- Create VISUAL DRAMA with dramatic lighting and shadows
- Each thumbnail must look like a CLICKABLE YouTube video preview
- Subject must be prominently visible with engaging expression
- Use bold colors, high contrast, and eye-catching compositions`,
      
      storyboard: 'a sequential story progression showing different moments/actions in a narrative arc with clear beginning, middle, and end. Each panel shows a DIFFERENT moment in time, like frames from a movie.'
    };

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this image and create a detailed prompt for generating a 3x3 grid (9 panels) showing ${modeDescriptions[mode] || modeDescriptions.angles}.

CRITICAL REQUIREMENTS:
1. Describe the scene, characters, lighting, color palette, and mood in DETAIL
2. For each of the 9 panels, specify EXACTLY what should be shown - be very specific
3. Each panel MUST be VISUALLY DISTINCT and UNIQUE from others
4. Maintain consistency in the main subject/character across all panels
5. Output aspect ratio: ${aspect}
6. The main subject must be clearly visible and recognizable in ALL 9 panels

${mode === 'thumbnail' ? `
THUMBNAIL SPECIFIC REQUIREMENTS:
- Panel 1: Shocked expression + "WOW" style text + warm colors
- Panel 2: Curious look + question-based text + cool blue tones
- Panel 3: Excited pose + exclamation text + high contrast
- Panel 4: Pointing at something + arrow graphics + vibrant colors
- Panel 5: Close-up surprised face + bold text overlay + dramatic lighting
- Panel 6: Action pose + energetic text + saturated colors
- Panel 7: Before/after style + comparison text + split tone
- Panel 8: Discovery moment + reveal text + spotlight effect
- Panel 9: Satisfied/accomplished look + success text + golden warm tones
` : ''}

Format your response as a single, detailed prompt that can be sent directly to an image generation AI. The prompt should:
- Start with overall scene and style description
- Include specific details for each panel (Panel 1, Panel 2, etc.)
- End with style/quality instructions
- Include "3x3 grid", "9 panels" in the prompt
${mode === 'thumbnail' ? '- IMPORTANT: Include clickbait text overlays, exaggerated expressions, arrows, circles, and graphic elements for each thumbnail' : '- Include "NO TEXT", "NO LABELS" in the prompt'}

Respond ONLY with the prompt, no explanations or preamble.`
            }
          ],
        }
      ],
    });

    const generatedPrompt = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}