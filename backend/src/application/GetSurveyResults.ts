import type { SurveyRepository } from "./SurveyRepository"
import type { SurveyResponseRepository } from "./SurveyResponseRepository"

export class GetSurveyResults {
  constructor(
    private readonly surveyRepository: SurveyRepository,
    private readonly responseRepository: SurveyResponseRepository
  ) {}

  async execute(surveyId: string) {
    const survey = await this.surveyRepository.findById(surveyId)

    if (!survey) {
      throw new Error("Survey not found.")
    }

    const responses =
      await this.responseRepository.findBySurveyId(surveyId)

    const questions = survey.getQuestions()

    const questionResults = questions.map((question) => {
      const values = responses.flatMap((response) =>
        response.answers
          .filter((answer) => answer.questionId === question.id)
          .map((answer) => answer.value)
      )

      if (question.type === "rating") {
        const ratings = values.filter(
          (value): value is number => typeof value === "number"
        )

        const average =
          ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) /
              ratings.length
            : null

        return {
          questionId: question.id,
          label: question.label,
          type: question.type,
          averageRating: average,
          ratingCount: ratings.length,
        }
      }

      if (
        question.type === "single_choice" ||
        question.type === "multiple_choice"
      ) {
        const optionCounts = (question.options ?? []).map((option) => {
          const count = values.reduce<number>((total, value) => {
            if (typeof value === "string" && value === option.id) {
              return total + 1
            }

            if (Array.isArray(value) && value.includes(option.id)) {
              return total + 1
            }

            return total
          }, 0)

          return {
            option: option.text,
            count,
          }
        })

        return {
          questionId: question.id,
          label: question.label,
          type: question.type,
          optionCounts,
        }
      }

      return {
        questionId: question.id,
        label: question.label,
        type: question.type,
        responseCount: values.length,
      }
    })

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        questions,
      },
      totalResponses: responses.length,
      questionResults,
      responses,
    }
  }
}
