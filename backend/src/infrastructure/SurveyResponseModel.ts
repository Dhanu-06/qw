
import mongoose, { Schema } from "mongoose"
import type { Answer } from "../domain/SurveyResponse"

const answerSchema = new Schema<Answer>(
  {
    questionId: { type: String, required: true },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
)

const surveyResponseSchema = new Schema(
  {
    _id: { type: String, required: true },
    surveyId: { type: String, required: true, index: true },
    isSeedData: { type: Boolean, default: false },
    answers: {
      type: [answerSchema],
      required: true,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: false }
)

export const SurveyResponseModel = mongoose.model(
  "SurveyResponse",
  surveyResponseSchema,
  "surveyResponses"
)
