
import { Survey } from "../domain/survey"
import type { SurveyRepository } from "../application/SurveyRepository"
import { SurveyModel } from "./SurveyModel"

export class MongoSurveyRepository implements SurveyRepository {


async findAll(): Promise<Survey[]> {
  const documents = await SurveyModel.find()
    .sort({ createdAt: -1, _id: 1 })
    .lean()

  return documents.map((document) =>
    Survey.rehydrate(
      document._id.toString(),
      document.title,
      document.status,
      document.questions.map((question) => ({
        id: question.id,
        label: question.label,
        type: question.type,
        required: question.required,
        options: question.options,
            })),
      document.description ?? ""
    )
  )
}


async findPaginated(
  page: number,
  limit: number,
  status?: string
): Promise<{ documents: Survey[]; total: number }> {
  
const filter = status
  ? { status: status as "draft" | "published" | "closed" }
  : {}


  const [documents, total] = await Promise.all([
    SurveyModel.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SurveyModel.countDocuments(filter),
  ])

  const surveys = documents.map((document) =>
    Survey.rehydrate(
      document._id.toString(),
      document.title,
      document.status,
      document.questions.map((question) => ({
        id: question.id,
        label: question.label,
        type: question.type,
        required: question.required,
        options: question.options,
      })),
      document.description ?? ""
    )
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

  
return Survey.rehydrate(
  document._id.toString(),
  document.title,
  document.status,
  document.questions.map((question) => ({
    id: question.id,
    label: question.label,
    type: question.type,
    required: question.required,
    options: question.options,
  })),
  document.description ?? ""
)

}

}
