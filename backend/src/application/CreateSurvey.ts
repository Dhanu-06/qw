
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "./SurveyRepository"

export class CreateSurvey {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  
async execute(title: string, description: string = ""): Promise<Survey> {
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Survey title cannot be empty.")
  }

  if (title.length > 100) {
    throw new Error("Survey title cannot exceed 100 characters.")
  }

  if (typeof description !== "string") {
    throw new Error("Survey description must be a string.")
  }

  if (description.length > 500) {
    throw new Error("Survey description cannot exceed 500 characters.")
  }

  const survey = new Survey(
    crypto.randomUUID(),
    title,
    description
  )
  await this.surveyRepository.save(survey)
  return survey
}
}