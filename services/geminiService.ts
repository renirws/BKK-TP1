import { GoogleGenAI } from "@google/genai";

// Ideally this comes from process.env.API_KEY, but for this structure we check existence
const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const GeminiService = {
  isAvailable: () => !!ai,

  generateJobDescription: async (title: string, requirements: string[]): Promise<string> => {
    if (!ai) return "AI Service not configured (Missing API Key).";

    try {
      const prompt = `Buatkan deskripsi pekerjaan yang profesional dan menarik untuk posisi "${title}" di sebuah perusahaan mitra SMK. 
      Kualifikasi yang dibutuhkan adalah: ${requirements.join(', ')}. 
      Buat dalam Bahasa Indonesia yang formal namun mudah dipahami lulusan SMK. Maksimal 150 kata.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Gagal membuat deskripsi.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Terjadi kesalahan saat menghubungi AI.";
    }
  },

  improveCVSummary: async (currentSummary: string, major: string): Promise<string> => {
    if (!ai) return "AI Service not configured.";

    try {
      const prompt = `Saya adalah lulusan SMK jurusan ${major}. Berikut adalah ringkasan profil saya: "${currentSummary}".
      Tolong perbaiki kalimat tersebut agar terdengar lebih profesional, menonjolkan potensi, dan siap kerja.
      Gunakan Bahasa Indonesia yang baik. Maksimal 3 kalimat.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || currentSummary;
    } catch (error) {
      console.error("Gemini Error:", error);
      return currentSummary;
    }
  }
};