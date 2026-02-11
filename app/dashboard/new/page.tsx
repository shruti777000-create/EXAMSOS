"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { saveRoadmap, updateStats, getStats } from "@/lib/store"
import { buildRoadmap } from "@/lib/roadmap-generator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Loader2, Upload, FileText, Sparkles } from "lucide-react"

export default function NewRoadmapPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<"input" | "generating" | "review">("input")
  const [name, setName] = useState("")
  const [examDate, setExamDate] = useState("")
  const [dailyHours, setDailyHours] = useState(4)
  const [syllabusText, setSyllabusText] = useState("")
  const [inputMethod, setInputMethod] = useState<"text" | "upload">("text")
  const [error, setError] = useState("")
  const [generatingMessage, setGeneratingMessage] = useState("")

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setSyllabusText(text)
    }
    reader.readAsText(file)
  }

  const handleGenerate = async () => {
    if (!name || !examDate || !syllabusText) {
      setError("Please fill in all required fields.")
      return
    }

    const examDateObj = new Date(examDate)
    if (examDateObj <= new Date()) {
      setError("Exam date must be in the future.")
      return
    }

    setError("")
    setStep("generating")

    const messages = [
      "Analyzing your syllabus...",
      "Identifying key topics and modules...",
      "Calculating optimal time distribution...",
      "Scheduling revision sessions...",
      "Building your personalized roadmap...",
    ]

    let msgIndex = 0
    setGeneratingMessage(messages[0])
    const interval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, messages.length - 1)
      setGeneratingMessage(messages[msgIndex])
    }, 2000)

    try {
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabusText,
          examDate,
          dailyHours,
          name,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate roadmap")
      }

      const data = await res.json()

      if (!data.roadmap?.modules) {
        throw new Error("Invalid response from AI")
      }

      const roadmap = buildRoadmap(
        user!.id,
        { name, examDate, dailyHours, inputMethod: inputMethod === "text" ? "text_input" : "pdf_upload" },
        data.roadmap.modules
      )

      saveRoadmap(roadmap)

      // Update stats
      const stats = getStats()
      updateStats({
        ...stats,
        totalTopics: stats.totalTopics + roadmap.topics.length,
      })

      clearInterval(interval)
      router.push(`/dashboard/roadmap/${roadmap.id}`)
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setStep("input")
    }
  }

  if (step === "generating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Generating Your Study Plan
          </h2>
          <p className="mt-2 text-muted-foreground">{generatingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create New Roadmap</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your syllabus details and let AI create your personalized study plan.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Exam Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exam Details</CardTitle>
            <CardDescription>Basic information about your upcoming exam</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Exam / Course Name</Label>
              <Input
                id="name"
                placeholder="e.g., JEE Physics, UPSC History, Calculus 101"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="examDate">Exam Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Daily Study Hours: {dailyHours}h</Label>
              <Slider
                value={[dailyHours]}
                onValueChange={([val]) => setDailyHours(val)}
                min={1}
                max={12}
                step={0.5}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 hour</span>
                <span>12 hours</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Syllabus Content</CardTitle>
            <CardDescription>Provide your syllabus for AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "text" | "upload")}>
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="text" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1 gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <Textarea
                  placeholder={`Paste your syllabus here...\n\nExample:\nModule 1: Mechanics\n- Newton's Laws of Motion\n- Work, Energy and Power\n- Rotational Motion\n\nModule 2: Thermodynamics\n- Laws of Thermodynamics\n- Heat Transfer\n- Kinetic Theory of Gases`}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  className="min-h-[200px] resize-y"
                />
              </TabsContent>

              <TabsContent value="upload">
                <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-8">
                  <Upload className="h-10 w-10 text-primary" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">Upload your syllabus</p>
                    <p className="text-sm text-muted-foreground">Supports .txt files</p>
                  </div>
                  <Input
                    type="file"
                    accept=".txt,.text"
                    onChange={handleFileUpload}
                    className="max-w-xs"
                  />
                  {syllabusText && inputMethod === "upload" && (
                    <p className="text-sm text-success">File loaded successfully</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          size="lg"
          className="w-full gap-2 text-base"
          onClick={handleGenerate}
          disabled={!name || !examDate || !syllabusText}
        >
          <Sparkles className="h-5 w-5" />
          Generate Study Roadmap
        </Button>
      </div>
    </div>
  )
}
