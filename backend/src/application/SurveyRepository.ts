
import type { Survey } from "../domain/survey"

export interface SurveyRepository {
  save(survey: Survey): Promise<void>
  findById(id: string): Promise<Survey | null>
  findPaginated(
  page: number,
  limit: number,
  status?: string,
  search?: string,
  sortBy?: "newest" | "name-asc" | "name-desc"
): Promise<{ documents: Survey[]; total: number }>
  getStatistics(): Promise<{
    total: number
    drafts: number
    published: number
  }>
}
