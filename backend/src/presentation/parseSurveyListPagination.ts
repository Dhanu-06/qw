export const SURVEY_LIST_MAX_LIMIT = 100

export function parseSurveyListPagination(query: {
  page?: unknown
  limit?: unknown
}): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(
    SURVEY_LIST_MAX_LIMIT,
    Math.max(1, Number(query.limit) || 5)
  )

  return { page, limit }
}
