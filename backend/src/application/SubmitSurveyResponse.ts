
import { SurveyResponse } from "../domain/SurveyResponse"
import type { SurveyRepository } from "./SurveyRepository"
import type { SurveyResponseRepository } from "./SurveyResponseRepository"

export class SubmitSurveyResponse {
  constructor(
    private readonly surveyRepository: SurveyRepository,
    private readonly responseRepository: SurveyResponseRepository
  ) {}

  async execute(
    surveyId: string,
    answers: SurveyResponse["answers"]
  ): Promise<SurveyResponse> {
    const survey = await this.surveyRepository.findById(surveyId)

    if (!survey) {
      throw new Error("Survey not found.")
    }

    survey.validateAnswers(answers)

    const response = new SurveyResponse(
      crypto.randomUUID(),
      surveyId,
      answers
    )

    await this.responseRepository.save(response)

    return response
  }
}
