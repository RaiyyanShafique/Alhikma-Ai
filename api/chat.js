
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Server API key is not configured." });
    }

    try {
        const { contents, language } = req.body || {};

        if (!Array.isArray(contents) || contents.length === 0 || contents.length > 20) {
            return res.status(400).json({ error: "Invalid chat history." });
        }

        const allowedLanguages = ["English", "Hinglish", "Hindi"];
        const selectedLanguage = allowedLanguages.includes(language)
            ? language
            : "Hinglish";

        const systemInstruction = `
You are Hikmah Assistant, a respectful and polite Islamic AI assistant.

Respond strictly in ${selectedLanguage}.
Base answers on the Noble Quran and authentic Sahih Hadith.
Cite Quran verses and Hadith references whenever possible.
Never invent references. If unsure, say so honestly.
Do not favor or criticize any sect or school.
Do not issue personal fatwas. Recommend consulting a qualified scholar.
Stay focused on Islamic topics and politely redirect unrelated questions.
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents,
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 1500
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);
            return res.status(502).json({
                error: "Gemini could not process your request. Please try again."
            });
        }

        const reply = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("") || "";

        if (!reply) {
            return res.status(502).json({ error: "No response received from Gemini." });
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Chat API error:", error);
        return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
}
