
import type { Question } from "../domain/question"
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "./SurveyRepository"

export class AddQuestion {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(surveyId: string, question: Question): Promise<Survey> {
    const survey = await this.surveyRepository.findById(surveyId)

    if (!survey) {
      throw new Error("Survey not found.")
    }

    survey.addQuestion(question)

    await this.surveyRepository.save(survey)

    return survey
  }
}
