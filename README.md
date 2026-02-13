# Exam SOS - AI-Powered Study Roadmap Generator

**Exam SOS** is a personalized study planning application designed to help students complete their syllabus efficiently before exams. Using Google's Gemini AI, the platform analyzes your syllabus and generates a custom day-by-day study roadmap tailored to your available time and exam date.

## 🚀 Features

-   **AI Roadmap Generation**: Simply paste your syllabus or upload a text file, and our AI (Gemini Flash) will break it down into logical modules.
-   **Smart Scheduling**: The app calculates the optimal study time for each topic and schedules them across your available days.
-   **Revision Cycles**: Includes built-in quick, weekly, and final revision sessions to ensure maximum retention.
-   **Progress Tracking**: Monitor your progress with a visual dashboard, topic mastery tracking, and study streaks.
-   **Multi-Platform Access**: Your data is synced across devices using Supabase and backed up in Local Storage.
-   **Beautiful UI**: A modern, responsive interface built with Tailwind CSS and Radix UI.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **AI Integration**: [Google AI SDK](https://sdk.vercel.ai/providers/ai-sdk-providers/google) (Gemini Pro/Flash)
-   **Database/Auth**: [Supabase](https://supabase.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Components**: Radix UI / Shadcn UI

## 🏁 Getting Started

### 1. Prerequisites
-   Node.js (v18 or higher)
-   npm, pnpm, or yarn

### 2. Installation
```bash
git clone https://github.com/shruti777000-create/EXAMSOS.git
cd EXAMSOS
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your credentials:
```env
# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔑 Key Configuration Details

-   **Model Selection**: The project is currently configured to use `gemini-flash-latest` for cost-effective and fast generation. This can be adjusted in `app/api/generate-roadmap/route.ts`.
-   **Persistence**: Data is primarily stored in Local Storage for instant access and synced to Supabase for durability.

## 📄 License
This project is for educational purposes as part of the Exam SOS suite.
