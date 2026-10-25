
import { Router } from "express"
import { CreateSurvey } from "../application/CreateSurvey"
import { MongoSurveyRepository } from "../infrastructure/MongoSurveyRepository"
import { AddQuestion } from "../application/AddQuestion"
import type { Question } from "../domain/question"
import { UpdateQuestion } from "../application/UpdateQuestion"
import { DeleteQuestion } from "../application/DeleteQuestion"
import { SubmitSurveyResponse } from "../application/SubmitSurveyResponse"
import { MongoSurveyResponseRepository } from "../infrastructure/MongoSurveyResponseRepository"
import { GetSurveyResults } from "../application/GetSurveyResults"
import { isValidUuid } from "./validateUuid"
import { parseSurveyListPagination } from "./parseSurveyListPagination"

const router = Router()
const surveyRepository = new MongoSurveyRepository()
const createSurvey = new CreateSurvey(surveyRepository)
const addQuestion = new AddQuestion(surveyRepository)
const updateQuestion = new UpdateQuestion(surveyRepository)
const deleteQuestion = new DeleteQuestion(surveyRepository)
const responseRepository = new MongoSurveyResponseRepository()
const submitSurveyResponse = new SubmitSurveyResponse(
  surveyRepository,
  responseRepository
)
const getSurveyResults = new GetSurveyResults(
  surveyRepository,
  responseRepository
)


router.post("/", async (req, res) => {
  try {
    const { title } = req.body
    console.info("[Survey] Create request received")

    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        message: "Survey title is required.",
      })
      return
    }

    const description =
  typeof req.body.description === "string"
    ? req.body.description.trim()
    : ""

const survey = await createSurvey.execute(
  title.trim(),
  description
)
console.info("[Survey] Created successfully", {
  surveyId: survey.id,
})

    res.status(201).json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
    console.error("Failed to create survey:", error)
    res.status(500).json({
      message: "Failed to create survey.",
    })
  }
})

router.get("/", async (req, res) => {
  try {
    const { page, limit } = parseSurveyListPagination(req.query)

    const status =
      typeof req.query.status === "string" &&
      ["draft", "published", "closed"].includes(req.query.status)
        ? req.query.status
        : undefined

        const search =
  typeof req.query.search === "string"
    ? req.query.search.trim()
    : undefined

const validSortOptions = ["newest", "name-asc", "name-desc"]

const sortBy =
  typeof req.query.sortBy === "string" &&
  validSortOptions.includes(req.query.sortBy)
    ? (req.query.sortBy as "newest" | "name-asc" | "name-desc")
    : "newest"

    const { documents: paginatedSurveys, total } =
      await surveyRepository.findPaginated(
  page,
  limit,
  status,
  search,
  sortBy
)
console.debug("[Survey] Fetching survey list", {
  page,
  limit,
  status,
  sortBy,
  hasSearch: Boolean(search),
})

    res.status(200).json({
      surveys: paginatedSurveys.map((survey) => ({
        id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        questions: survey.getQuestions(),
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[Survey] Failed to fetch survey list", error)
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error."

    res.status(500).json({ message })
  }
})


router.post("/:id/questions", async (req, res) => {
  try {
    const { label, type, required, helperText, options } = req.body
    console.info("[Survey] Add question request received", {
  surveyId: req.params.id,
  questionType: type,
})
    const validTypes = [
      "short_text",
      "long_text",
      "single_choice",
      "multiple_choice",
      "rating",
    ]

    if (
      typeof label !== "string" ||
      !label.trim() ||
      typeof type !== "string" ||
      !validTypes.includes(type) ||
      typeof required !== "boolean"
    ) {
      console.warn("[Survey] Invalid question data", {
  surveyId: req.params.id,
})
      res.status(400).json({ message: "Invalid question data." })
      return
    }

    const question: Question = {
      id: crypto.randomUUID(),
      label: label.trim(),
      type: type as Question["type"],
      required,
      ...(helperText !== undefined ? { helperText } : {}),
      options,
    }

    const survey = await addQuestion.execute(
      req.params.id,
      question
    )
    console.info("[Survey] Question added successfully", {
  surveyId: survey.id,
  questionId: question.id,
})

    res.status(201).json({
      id: survey.id,
      title: survey.title,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
  const message =
    error instanceof Error ? error.message : "Unexpected error."

  if (message === "Survey not found.") {
    console.warn("[Survey] Cannot add question: survey not found", {
      surveyId: req.params.id,
    })

    res.status(404).json({ message })
    return
  }

  console.error("[Survey] Failed to add question", {
    surveyId: req.params.id,
    error,
  })

  res.status(400).json({ message })
}
})

router.put("/:id/questions/:questionId", async (req, res) => {
  try {
    const { label, type, required, helperText, options } = req.body
    console.info("[Survey] Update question request received", {
  surveyId: req.params.id,
  questionId: req.params.questionId,
})
    const validTypes = [
      "short_text",
      "long_text",
      "single_choice",
      "multiple_choice",
      "rating",
    ]

    if (
      typeof label !== "string" ||
      typeof type !== "string" ||
      !validTypes.includes(type) ||
      typeof required !== "boolean"
    ) {
      console.warn("[Survey] Invalid question update data", {
  surveyId: req.params.id,
  questionId: req.params.questionId,
})
      res.status(400).json({ message: "Invalid question data." })
      return
    }

    const question: Question = {
      id: req.params.questionId,
      label,
      type: type as Question["type"],
      required,
      ...(helperText !== undefined ? { helperText } : {}),
      options,
    }

    const survey = await updateQuestion.execute(
      req.params.id,
      req.params.questionId,
      question
    )
    console.info("[Survey] Question updated successfully", {
  surveyId: survey.id,
  questionId: req.params.questionId,
})
    res.status(200).json({
      id: survey.id,
      title: survey.title,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
  const message =
    error instanceof Error ? error.message : "Unexpected error."

  if (message === "Survey not found.") {
    console.warn("[Survey] Cannot update question: survey not found", {
      surveyId: req.params.id,
    })

    res.status(404).json({ message })
    return
  }

  console.error("[Survey] Failed to update question", {
    surveyId: req.params.id,
    questionId: req.params.questionId,
    error,
  })

  res.status(400).json({ message })
}
})


router.post("/:id/publish", async (req, res) => {
  try {
    console.info("[Survey] Publish request received", {
  surveyId: req.params.id,
})
    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
      console.warn("[Survey] Cannot publish: survey not found", {
  surveyId: req.params.id,
})
      return
    }

    survey.publish()
    await surveyRepository.save(survey)
    console.info("[Survey] Published successfully", {
  surveyId: survey.id,
  status: survey.status,
})

    res.status(200).json({
      id: survey.id,
      title: survey.title,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
  const message =
    error instanceof Error ? error.message : "Unexpected error."

  console.error("[Survey] Failed to publish survey", {
    surveyId: req.params.id,
    error,
  })

  res.status(400).json({ message })
}
})

router.post("/:id/close", async (req, res) => {
  try {
    console.info("[Survey] Close request received", {
  surveyId: req.params.id,
})
    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
      console.warn("[Survey] Cannot close: survey not found", {
  surveyId: req.params.id,
})
      return
    }

    survey.close()
    await surveyRepository.save(survey)
    console.info("[Survey] Closed successfully", {
  surveyId: survey.id,
  status: survey.status,
})
    res.status(200).json({
      id: survey.id,
      title: survey.title,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
  const message =
    error instanceof Error ? error.message : "Unexpected error."

  console.error("[Survey] Failed to close survey", {
    surveyId: req.params.id,
    error,
  })

  res.status(400).json({ message })
}
})


router.get("/stats", async (_req, res) => {
  try {
    const stats = await surveyRepository.getStatistics()

console.debug("[Survey] Statistics fetched successfully", stats)

res.status(200).json(stats)
  } catch (error) {
    console.error("Failed to fetch survey statistics:", error)
    res.status(500).json({
      message: "Could not fetch survey statistics.",
    })
  }
})

router.get("/:id", async (req, res) => {
  try {
    console.debug("[Survey] Fetching survey", {
  surveyId: req.params.id,
})
    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
      console.warn("[Survey] Survey not found", {
  surveyId: req.params.id,
})
      return
    }

    res.status(200).json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
  console.error("[Survey] Failed to fetch survey", {
    surveyId: req.params.id,
    error,
  })

  const message =
    error instanceof Error ? error.message : "Unexpected error."

  res.status(500).json({ message })
}
})

router.delete("/:id/questions/:questionId", async (req, res) => {
  const { id, questionId } = req.params
  try {
    console.info("[Survey] Delete question request received", {
  surveyId: id,
  questionId,
})
    if (!isValidUuid(id)) {
      console.warn("[Survey] Invalid survey ID format", {
  surveyId: id,
})
      res.status(400).json({
        message: "Invalid survey ID format.",
      })
      return
    }

    if (!isValidUuid(questionId)) {
      console.warn("[Survey] Invalid question ID format", {
  questionId,
})
      res.status(400).json({
        message: "Invalid question ID format.",
      })
      return
    }

    const survey = await deleteQuestion.execute(id, questionId)
    console.info("[Survey] Question deleted successfully", {
  surveyId: survey.id,
  questionId,
})
    res.status(200).json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
  const message =
    error instanceof Error ? error.message : "Unexpected error."

  if (message === "Survey not found.") {
    console.warn("[Survey] Cannot delete question: survey not found", {
      surveyId: id,
    })

    res.status(404).json({ message })
    return
  }

  if (message === "Question not found.") {
    console.warn("[Survey] Cannot delete question: question not found", {
      surveyId: id,
      questionId,
    })

    res.status(404).json({ message })
    return
  }

  console.error("[Survey] Failed to delete question", {
    surveyId: id,
    questionId,
    error,
  })

  res.status(400).json({ message })
}
})


router.post("/:id/responses", async (req, res) => {
  try {
    const answers = req.body?.answers

if (!Array.isArray(answers)) {
      res.status(400).json({ message: "Answers must be an array." })
      return
    }

    const response = await submitSurveyResponse.execute(
      req.params.id,
      answers
    )
    res.status(201).json({
      id: response.id,
      surveyId: response.surveyId,
      answers: response.answers,
      submittedAt: response.submittedAt,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error."

    if (message === "Survey not found.") {
      res.status(404).json({ message })
      return
    }

    res.status(400).json({ message })
  }
})

router.get("/:id/results", async (req, res) => {
  try {
    const results = await getSurveyResults.execute(req.params.id)

    res.status(200).json(results)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error."

    if (message === "Survey not found.") {
      res.status(404).json({ message })
      return
    }

    res.status(500).json({ message })
  }
})

router.get("/:id/responses", async (req, res) => {
  try {
    const rawPage = req.query.page
const rawLimit = req.query.limit

const page = rawPage === undefined ? 1 : Number(rawPage)
const limit = rawLimit === undefined ? 5 : Number(rawLimit)

if (
  !Number.isInteger(page) ||
  page < 1 ||
  !Number.isInteger(limit) ||
  limit < 1 ||
  limit > 10
) {
  res.status(400).json({
    message:
      "Page must be a positive integer. Limit must be an integer between 1 and 10.",
  })
  return
}

    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
      return
    }

    const { documents, total } =
      await responseRepository.findPaginatedBySurveyId(
        req.params.id,
        page,
        limit
      )
 
    res.status(200).json({
      responses: documents,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error."

    res.status(500).json({ message })
  }
})


export default router
