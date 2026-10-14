
export interface Answer {
  questionId: string
  value: string | string[] | number
}

export class SurveyResponse {
  constructor(
    public readonly id: string,
    public readonly surveyId: string,
    public readonly answers: Answer[],
    public readonly submittedAt: Date = new Date()
  ) {}
}
