export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "rating"
export interface Option {
id: string
text: string
}
export interface Question {
  id: string
  label: string
  type: QuestionType
  required: boolean
  helperText?: string
  options?: Option[]
}