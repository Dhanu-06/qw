
import { SurveyResponse } from "../domain/SurveyResponse"
import type { SurveyResponseRepository } from "../application/SurveyResponseRepository"
import { SurveyResponseModel } from "./SurveyResponseModel"

export class MongoSurveyResponseRepository
  implements SurveyResponseRepository
{
  async save(response: SurveyResponse): Promise<void> {
    await SurveyResponseModel.create({
      _id: response.id,
      surveyId: response.surveyId,
      answers: response.answers,
      submittedAt: response.submittedAt,
    })
  }

  async findBySurveyId(
    surveyId: string
  ): Promise<SurveyResponse[]> {
    const documents = await SurveyResponseModel.find({
      surveyId,
    })
      .sort({ submittedAt: -1, _id: 1 })
      .lean()

    return documents.map(
      (document) =>
        new SurveyResponse(
          document._id.toString(),
          document.surveyId,
          document.answers.map((answer) => ({
            questionId: answer.questionId,
            value: answer.value as string | string[] | number,
          })),
          document.submittedAt
        )
    )
  }

async findPaginatedBySurveyId(
  surveyId: string,
  page: number,
  limit: number
): Promise<{ documents: SurveyResponse[]; total: number }> {
  const filter = { surveyId }

  const [documents, total] = await Promise.all([
    SurveyResponseModel.find(filter)
      .sort({ submittedAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    SurveyResponseModel.countDocuments(filter),
  ])

  const responses = documents.map(
    (document) =>
      new SurveyResponse(
        document._id.toString(),
        document.surveyId,
        document.answers.map((answer) => ({
          questionId: answer.questionId,
          value: answer.value as string | string[] | number,
        })),
        document.submittedAt
      )
  )

  return { documents: responses, total }
}

}
