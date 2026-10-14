
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "./SurveyRepository"

export class DeleteQuestion {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(
    surveyId: string,
    questionId: string
  ): Promise<Survey> {
    const survey = await this.surveyRepository.findById(surveyId)

    if (!survey) {
      throw new Error("Survey not found.")
    }

    survey.deleteQuestion(questionId)

    await this.surveyRepository.save(survey)

    return survey
  }
}
