import type { Option, Question } from "../domain/question"

export function mapPersistedOptions(raw: unknown): Option[] | undefined {
  if (raw === undefined || raw === null) {
    return undefined
  }

  if (!Array.isArray(raw)) {
    throw new Error("Options must be an array.")
  }

  return raw.map(mapPersistedOption)
}

export function mapPersistedQuestion(question: {
  id: string
  label: string
  type: Question["type"]
  required: boolean
  helperText?: string
  options?: unknown
}): Question {
  const mapped: Question = {
    id: question.id,
    label: question.label,
    type: question.type,
    required: question.required,
    options: mapPersistedOptions(question.options),
  }

  if (question.helperText !== undefined) {
    mapped.helperText = question.helperText
  }

  return mapped
}

function mapPersistedOption(item: unknown): Option {
  if (typeof item === "string") {
    return { id: item, text: item }
  }

  if (item && typeof item === "object") {
    const candidate = item as { id?: unknown; text?: unknown }
    const id = candidate.id
    const text = candidate.text

    if (typeof id === "string" && typeof text === "string") {
      return { id, text }
    }

    if (typeof id !== "string" && typeof text === "string") {
      return { id: text, text }
    }
  }

  throw new Error("Every option must have an ID and text.")
}
