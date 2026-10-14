
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "./SurveyRepository"

export class CreateSurvey {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(title: string): Promise<Survey> {
    const survey = new Survey(crypto.randomUUID(), title)

    await this.surveyRepository.save(survey)

    return survey
  }
}
