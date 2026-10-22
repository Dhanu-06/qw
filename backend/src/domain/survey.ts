import type { Question } from "./question"
import type { Answer } from "./SurveyResponse"

export type SurveyStatus = "draft" | "published" | "closed"

export class Survey {
  private questions: Question[] = []

  

constructor(
  public readonly id: string,
  public title: string,
  public description: string = "",
  public status: SurveyStatus = "draft"
) {}




static rehydrate(
  id: string,
  title: string,
  status: SurveyStatus,
  questions: Question[],
  description: string = ""
): Survey {
  const survey = new Survey(id, title, description)

  for (const question of questions) {
    survey.validateQuestion(question)
  }

  survey.questions = questions.map((question) => ({
  ...question,
  options: question.options ? [...question.options] : undefined,
}))

survey.title = title
survey.description = description
survey.status = status

survey.validateDetails()

return survey
}


private validateDetails(): void {
  if (typeof this.title !== "string" || !this.title.trim()) {
    throw new Error("Survey title cannot be empty.")
  }

  if (this.title.length > 100) {
    throw new Error("Survey title cannot exceed 100 characters.")
  }

  if (typeof this.description !== "string") {
    throw new Error("Survey description must be a string.")
  }

  if (this.description.length > 500) {
    throw new Error("Survey description cannot exceed 500 characters.")
  }
}

  addQuestion(question: Question): void {
    if (this.status !== "draft") {
      throw new Error("Only draft surveys can be edited.")
    }

    if (this.questions.length >= 5) {
      throw new Error("A survey cannot have more than 5 questions.")
    }
        if (this.questions.some((existing) => existing.id === question.id)) {
      throw new Error("Question ID already exists.")
    }
    
    this.validateQuestion(question)

    this.questions.push(question)
  }

  getQuestions(): Question[] {
  return this.questions.map((question) => ({
    ...question,
    options: question.options ? [...question.options] : undefined,
  }))
}

    
private validateQuestion(question: Question): void {
  const validTypes = [
    "short_text",
    "long_text",
    "single_choice",
    "multiple_choice",
    "rating",
  ]

  if (!validTypes.includes(question.type)) {
    throw new Error("Invalid question type.")
  }

  if (typeof question.label !== "string" || !question.label.trim()) {
    throw new Error("Question label cannot be empty.")
  }

  if (question.label.length > 200) {
    throw new Error("Question label cannot exceed 200 characters.")
  }

  if (
    question.type === "single_choice" ||
    question.type === "multiple_choice"
  ) {
    const options = question.options ?? []

    if (!Array.isArray(options)) {
      throw new Error("Options must be an array.")
    }

    if (options.some((option) => typeof option !== "string")) {
      throw new Error("Every option must be a string.")
    }

    const cleanedOptions = options.map((option) => option.trim())

    if (cleanedOptions.length < 2) {
      throw new Error("Choice questions need at least 2 options.")
    }

    if (cleanedOptions.some((option) => !option)) {
      throw new Error("Options cannot be empty.")
    }

    if (cleanedOptions.some((option) => option.length > 100)) {
      throw new Error("Each option cannot exceed 100 characters.")
    }

    if (new Set(cleanedOptions).size !== cleanedOptions.length) {
      throw new Error("Choice options must be distinct.")
    }
  }

  if (question.type === "rating" && question.options !== undefined) {
    throw new Error("Rating questions do not use options.")
  }
}


    updateQuestion(questionId: string, updatedQuestion: Question): void {
    if (this.status !== "draft") {
      throw new Error("Only draft surveys can be edited.")
    }

    const index = this.questions.findIndex(
      (question) => question.id === questionId
    )

    if (index === -1) {
      throw new Error("Question not found.")
    }

    if (updatedQuestion.id !== questionId) {
      throw new Error("Question ID cannot be changed.")
    }

    this.validateQuestion(updatedQuestion)
    this.questions[index] = updatedQuestion

  }

  deleteQuestion(questionId: string): void {
    if (this.status !== "draft") {
      throw new Error("Only draft surveys can be edited.")
    }

    this.questions = this.questions.filter(
      (question) => question.id !== questionId
    )
  }


validateAnswers(answers: Answer[]): void {
  if (this.status !== "published") {
    throw new Error("Only published surveys accept responses.")
  }

  if (!Array.isArray(answers)) {
    throw new Error("Answers must be an array.")
  }

  const answeredIds = new Set<string>()

  for (const answer of answers) {
    if (
      !answer ||
      typeof answer.questionId !== "string" ||
      answeredIds.has(answer.questionId)
    ) {
      throw new Error("Invalid or duplicate answer.")
    }

    answeredIds.add(answer.questionId)

    const question = this.questions.find(
      (q) => q.id === answer.questionId
    )

    if (!question) {
      throw new Error("Answer refers to an unknown question.")
    }

    const value = answer.value

    switch (question.type) {
      case "short_text":
      case "long_text":
        if (typeof value !== "string") {
          throw new Error("Text answers must be strings.")
        }
        if (question.required && !value.trim()) {
          throw new Error("Required question cannot be empty.")
        }
        const maxLength = question.type === "short_text" ? 100 : 500
        if (value.length > maxLength) {
    throw new Error(
      `${question.type === "short_text" ? "Short text" : "Long text"} answers cannot exceed ${maxLength} characters.`
    )
  }
        break

      case "single_choice":
        if (
          typeof value !== "string" ||
          !question.options?.includes(value)
        ) {
          throw new Error("Invalid single-choice answer.")
        }
        break

      case "multiple_choice":
        if (
          !Array.isArray(value) ||
          !value.every(
            (item) =>
              typeof item === "string" &&
              question.options?.includes(item)
          ) ||
          new Set(value).size !== value.length
        ) {
          throw new Error("Invalid multiple-choice answer.")
        }
        if (question.required && value.length === 0) {
          throw new Error("Required question cannot be empty.")
        }
        break

      case "rating":
        if (
          typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < 1 ||
          value > 5
        ) {
          throw new Error("Rating must be a whole number from 1 to 5.")
        }
        break
    }
  }

  for (const question of this.questions) {
    if (question.required && !answeredIds.has(question.id)) {
      throw new Error(`Missing required answer: ${question.label}`)
    }
  }
}

    
publish(): void {
  if (this.status !== "draft") {
    throw new Error("Only draft surveys can be published.")
  }

  this.validateDetails()

  if (this.questions.length === 0) {
    throw new Error("A survey must have at least one question.")
  }

  for (const question of this.questions) {
    this.validateQuestion(question)
  }
  this.status = "published"
}
    close(): void {
    if (this.status !== "published") {
      throw new Error("Only published surveys can be closed.")
    }

    this.status = "closed"
  }
}