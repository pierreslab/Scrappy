import { GOOGLE_API_KEY } from '../data/config';

export async function analyzeImageWithGemini(base64Image, mode) {
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

  let prompt = "";
  if (mode === 'recycle') {
    prompt = `
      Analyze this image. Identify the main object.
      Determine if it is recyclable.
      Return a RAW JSON object (no markdown formatting) with this exact structure:
      {
        "item": "Name of the item (capitalize first letter, e.g. 'Plastic Bottle' not 'plastic bottle')",
        "recyclable": true/false,
        "bin": "blue" (recycling), "green" (compost), "black" (trash), or "special" (hazardous),
        "description": "A short, kid-friendly instruction on how to recycle it (e.g. 'Rinse it first!').",
        "points": 10 (or 5 if not recyclable),
        "impact": "A fun tangible impact fact (e.g. 'Saved enough energy to power a lightbulb for 2 hours!')"
      }
    `;
  } else {
    prompt = `
      Analyze this image and identify the trash/recyclable items.
      Suggest 3 fun DIY craft projects for kids using these items.
      Return a RAW JSON object (no markdown formatting) with this exact structure:
      {
        "recipes": [
          {
            "id": 1,
            "name": "Project Name",
            "emoji": "🎨",
            "items": ["List", "of", "items", "needed"],
            "difficulty": "Easy"
          },
          ... (2 more)
        ]
      }
    `;
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      // thinkingConfig: { includeThoughts: false } // Not needed for 2.5 Flash-Lite or defaults are fine
    }
  };

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      throw new Error(data.error.message);
    }

    const textResponse = data.candidates[0].content.parts[0].text;

    // Clean up markdown code blocks if present
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini Request Failed:", error);
    // Fallback/Mock response in case of failure to keep app usable
    if (mode === 'recycle') {
      return {
        item: "Unknown Item",
        recyclable: true,
        bin: "blue",
        description: "We couldn't identify it, but try recycling it if it's plastic, paper, or glass!",
        points: 5,
        impact: "Every bit counts!"
      };
    } else {
      return {
        recipes: [
          { id: 1, name: "Mystery Monster", emoji: "👾", items: ["Any trash!"], difficulty: "Easy" }
        ]
      };
    }
  }
}

