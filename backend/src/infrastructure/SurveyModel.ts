
import mongoose, { Schema } from "mongoose"
import type { Question } from "../domain/question"
import type { SurveyStatus } from "../domain/survey"

const questionSchema = new Schema<Question>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "short_text",
        "long_text",
        "single_choice",
        "multiple_choice",
        "rating",
      ],
      required: true,
    },
    required: { type: Boolean, required: true },
    options: {
  type: [
    {
      _id: false,
      id: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  default: undefined,
},
  },
  { _id: false }
)

const surveySchema = new Schema<{
  _id: string
  title: string
  description: string
  status: SurveyStatus
  questions: Question[]
  isSeedData: boolean
}>(
  {
      _id: { type: String, required: true },
      title: { type: String, required: true, trim: true },
      description: { type: String, default: "" },
      isSeedData: { type: Boolean, default: false },
      status: {
      type: String,
      enum: ["draft", "published", "closed"] satisfies SurveyStatus[],
      default: "draft",
      required: true,
    },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
)

export const SurveyModel = mongoose.model(
  "Survey",
  surveySchema,
  "surveys"
)
