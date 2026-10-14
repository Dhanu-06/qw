
import type { Survey } from "../domain/survey"

export interface SurveyRepository {
  save(survey: Survey): Promise<void>
  findById(id: string): Promise<Survey | null>
  findAll(): Promise<Survey[]>
  findPaginated(
  page: number,
  limit: number,
  status?: string
): Promise<{ documents: Survey[]; total: number }>
}
