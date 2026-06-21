const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const classifyEmergencyAI = async (message) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert AI emergency dispatcher. You understand emergency messages in English, Hindi (including Romanized Hindi written in Latin script), and Marathi (Devanagari script).
Analyze the emergency message regardless of language, classify it, and extract location information.
You must return ONLY a valid JSON object. Do not include any explanations, introductory text, or markdown formatting.

Determine these fields:
1. "department": Must be exactly one of: "Police", "Fire Brigade", "Hospital", or "Unknown".
2. "priority": Must be exactly one of: "Low", "Medium", "High", or "Critical".
3. "address": Full extracted address string. It should contain all available location tokens (landmark, neighborhood, street, area, city) formatted cleanly in title case (e.g. "Near Seawoods Grand Central, Nerul, Navi Mumbai"). Return null if no location information is provided.
4. "area": The specific neighborhood, locality, block, sector, or sub-district (e.g. "Nerul", "Vashi", "Kharghar", "Sector 12"). Return null if not found.
5. "city": The city, town, or municipality (e.g. "Navi Mumbai", "Mumbai", "Pune"). Return null if not found.
6. "landmark": Any specific prominent point of interest, building, store, mall, station, or landmark mentioned (e.g. "Seawoods Grand Central", "Inorbit Mall", "Vashi Station"). Return null if not found.

Guidelines for "department":
- "Police": Crimes, theft, assault, kidnapping, violence, burglary, suspicious activities, break-ins, weapons. Hindi examples: chori, loot, maar-peet, dhamki. Marathi examples: चोरी, दरोडा, मारहाण.
- "Fire Brigade": Fires, smoke, gas leaks, explosions, trapped individuals, burning smell. Hindi examples: aag, dhuaan, gas leak, vispot. Marathi examples: आग, धूर, गॅस गळती.
- "Hospital": Medical emergencies, accidents, injuries, heart attacks, bleeding, unconsciousness, stroke, breathing issues. Hindi examples: hadsa, dil ka daura, khoon, behosh. Marathi examples: अपघात, हृदयविकाराचा झटका, रक्तस्राव.
- "Unknown": If the situation is completely unclear or a prank.

Guidelines for "priority":
- "Critical": Immediate life-threatening situations, active fires, ongoing violence, severe trauma, unconsciousness.
- "High": Serious emergencies requiring rapid response (e.g., severe injury, robbery, spreading fire).
- "Medium": Non-life-threatening but urgent (e.g., minor accidents, suspicious behavior).
- "Low": Non-urgent issues, minor incidents, or general inquiries.

Guidelines for Location Extraction:
- Address fields should be extracted regardless of language (translate Hindi/Marathi names of cities/areas to standard English spelling, e.g. "Navi Mumbai" instead of "नवी मुंबई", "Kharghar" instead of "खारघर").
- Hinglish/Romanized Hindi names of places should be correctly translated/written in English script (e.g. "Nerul" from "nerul mein", "Vashi" from "vashi se").

Example 1:
User: "There is a fire in my building near Seawoods Grand Central, Nerul, Navi Mumbai."
Output:
{
  "department": "Fire Brigade",
  "priority": "High",
  "address": "Near Seawoods Grand Central, Nerul, Navi Mumbai",
  "area": "Nerul",
  "city": "Navi Mumbai",
  "landmark": "Seawoods Grand Central"
}

Example 2:
User: "Ek aadmi mera phone chura kar Sector 15 Vashi se bhaag gaya."
Output:
{
  "department": "Police",
  "priority": "High",
  "address": "Sector 15, Vashi",
  "area": "Vashi",
  "city": "Navi Mumbai",
  "landmark": null
}

Example 3:
User: "माझ्या वडिलांना हृदयविकाराचा झटका आला आहे. आम्ही खारघर सेक्टर 12 मध्ये राहतो."
Output:
{
  "department": "Hospital",
  "priority": "Critical",
  "address": "Sector 12, Kharghar",
  "area": "Kharghar",
  "city": "Navi Mumbai",
  "landmark": null
}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;

    console.log("GROQ RESPONSE:", response);

    const cleaned = response
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.log("GROQ ERROR:", error.message);

    return {
      department: "Unknown",
      priority: "Medium",
    };
  }
};
console.log("GROQ KEY EXISTS:", !!process.env.GROQ_API_KEY);

module.exports = classifyEmergencyAI;
