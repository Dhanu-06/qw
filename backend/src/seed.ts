import "dotenv/config"
import mongoose from "mongoose"
import { connectDatabase } from "./infrastructure/database"
import { SurveyModel } from "./infrastructure/SurveyModel"
import { SurveyResponseModel } from "./infrastructure/SurveyResponseModel"

async function seedDatabase(): Promise<void> {
  try {
    await connectDatabase()

// Remove only records explicitly marked as demo data.
await SurveyResponseModel.deleteMany({ isSeedData: true })
await SurveyModel.deleteMany({ isSeedData: true })

console.log("Previous demo data cleared safely.")
console.log("Connected to MongoDB. Ready to seed demo data.")

    const onboardingSurvey = {
  _id: "seed-employee-onboarding",
  title: "Employee Onboarding Feedback",
  description:
    "Help us understand how smoothly new employees settle into the company.",
  isSeedData: true,
  status: "published" as const,
  questions: [
    {
      id: "seed-onboarding-q1",
      label: "How was your onboarding experience?",
      type: "single_choice" as const,
      required: true,
      options: ["Excellent", "Good", "Average", "Poor"],
    },
    {
      id: "seed-onboarding-q2",
      label: "What could we improve?",
      type: "long_text" as const,
      required: false,
    },
    {
      id: "seed-onboarding-q3",
      label: "Rate your overall onboarding experience",
      type: "rating" as const,
      required: true,
    },
  ],
}

await SurveyModel.create(onboardingSurvey)

const additionalSurveys = Array.from({ length: 11 }, (_, index) => {
  const number = index + 2

  const statuses = ["draft", "published", "closed"] as const
  const status = statuses[index % statuses.length]

  return {
    _id: `seed-survey-${String(number).padStart(2, "0")}`,
    title: `Demo Survey ${number}`,
    description: `Sample survey ${number} for testing the survey dashboard.`,
    isSeedData: true,
    status,
    questions: [
      {
        id: `seed-survey-${number}-q1`,
        label: "How satisfied are you with your experience?",
        type: "rating" as const,
        required: true,
      },
    ],
  }
})

await SurveyModel.create(additionalSurveys)
console.log("Created 11 additional demo surveys.")


console.log("Created sample survey: Employee Onboarding Feedback.")
const sampleResponses = [
  {
    _id: "seed-response-1",
    surveyId: "seed-employee-onboarding",
    isSeedData: true,
    answers: [
      { questionId: "seed-onboarding-q1", value: "Excellent" },
      {
        questionId: "seed-onboarding-q2",
        value: "The team was welcoming and helpful.",
      },
      { questionId: "seed-onboarding-q3", value: 5 },
    ],
    submittedAt: new Date("2026-10-10T09:00:00Z"),
  },
  {
    _id: "seed-response-2",
    surveyId: "seed-employee-onboarding",
    isSeedData: true,
    answers: [
      { questionId: "seed-onboarding-q1", value: "Good" },
      { questionId: "seed-onboarding-q3", value: 4 },
    ],
    submittedAt: new Date("2026-10-11T10:00:00Z"),
  },
  {
    _id: "seed-response-3",
    surveyId: "seed-employee-onboarding",
    isSeedData: true,
    answers: [
      { questionId: "seed-onboarding-q1", value: "Excellent" },
      {
        questionId: "seed-onboarding-q2",
        value: "A short introduction to internal tools would help.",
      },
      { questionId: "seed-onboarding-q3", value: 5 },
    ],
    submittedAt: new Date("2026-10-12T11:00:00Z"),
  },
]

await SurveyResponseModel.create(sampleResponses)
console.log("Created 3 sample responses.")


  } catch (error) {
    console.error("Failed to seed database:", error)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seedDatabase()