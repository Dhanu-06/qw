
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "./SurveyRepository"

export class CreateSurvey {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(title: string, description: string = ""): Promise<Survey> {
    const survey = new Survey(
      crypto.randomUUID(),
      title,
      description
    )

    await this.surveyRepository.save(survey)

    return survey
  }
}
