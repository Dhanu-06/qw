
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "../application/SurveyRepository"
import type { Question } from "../domain/question"
import { SurveyModel } from "./SurveyModel"
import { mapPersistedQuestion } from "./mapPersistedQuestions"

type PersistedQuestion = {
  id: string
  label: string
  type: Question["type"]
  required: boolean
  helperText?: string
  options?: unknown
}

type PersistedSurveyDocument = {
  _id: { toString(): string }
  title: string
  status: Survey["status"]
  description?: string
  questions: PersistedQuestion[]
}

function toDomainSurvey(document: PersistedSurveyDocument): Survey {
  return Survey.rehydrate(
    document._id.toString(),
    document.title,
    document.status,
    document.questions.map(mapPersistedQuestion),
    document.description ?? ""
  )
}

export class MongoSurveyRepository implements SurveyRepository {

async findPaginated(
  page: number,
  limit: number,
  status?: string,
  search?: string,
  sortBy: "newest" | "name-asc" | "name-desc" = "newest"
): Promise<{ documents: Survey[]; total: number }> {
  const filter: Record<string, unknown> = {}

  if (status) {
    filter.status = status
  }

  if (search?.trim()) {
    filter.title = {
      $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    }
  }

  const sort: Record<string, 1 | -1> =
  sortBy === "name-asc"
    ? { title: 1, _id: 1 }
    : sortBy === "name-desc"
      ? { title: -1, _id: 1 }
      : { createdAt: -1, _id: 1 }

  const [documents, total] = await Promise.all([
    SurveyModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SurveyModel.countDocuments(filter),
  ])

  const surveys = documents.map((document) =>
    toDomainSurvey(document as PersistedSurveyDocument)
  )

  return { documents: surveys, total }
}

async getStatistics(): Promise<{
  total: number
  drafts: number
  published: number
}> {
  const [total, drafts, published] = await Promise.all([
    SurveyModel.countDocuments(),
    SurveyModel.countDocuments({ status: "draft" }),
    SurveyModel.countDocuments({ status: "published" }),
  ])

  return { total, drafts, published }
}

  async save(survey: Survey): Promise<void> {
    await SurveyModel.findOneAndUpdate(
      { _id: survey.id },
      {
        _id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        questions: survey.getQuestions(),
      },
      { upsert: true, runValidators: true }
    )
  }

  
async findById(id: string): Promise<Survey | null> {
  const document = await SurveyModel.findById(id).lean()

  if (!document) {
    return null
  }

  
  return toDomainSurvey(document as PersistedSurveyDocument)

}

}
