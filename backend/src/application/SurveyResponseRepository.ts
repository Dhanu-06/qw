
import type { SurveyResponse } from "../domain/SurveyResponse"

export interface SurveyResponseRepository {
  save(response: SurveyResponse): Promise<void>

  findBySurveyId(surveyId: string): Promise<SurveyResponse[]>

  findPaginatedBySurveyId(
    surveyId: string,
    page: number,
    limit: number
  ): Promise<{
    documents: SurveyResponse[]
    total: number
  }>
}
