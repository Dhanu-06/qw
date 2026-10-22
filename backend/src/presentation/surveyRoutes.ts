
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
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(
      10,
      Math.max(1, Number(req.query.limit) || 5)
    )

    const status =
      typeof req.query.status === "string" &&
      ["draft", "published", "closed"].includes(req.query.status)
        ? req.query.status
        : undefined

    const { documents: paginatedSurveys, total } =
      await surveyRepository.findPaginated(page, limit, status)

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
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error."

    res.status(500).json({ message })
  }
})


router.post("/:id/questions", async (req, res) => {
  try {
    const { label, type, required, options } = req.body

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
      res.status(400).json({ message: "Invalid question data." })
      return
    }

    const question: Question = {
      id: crypto.randomUUID(),
      label: label.trim(),
      type: type as Question["type"],
      required,
      options,
    }

    const survey = await addQuestion.execute(
      req.params.id,
      question
    )

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
      res.status(404).json({ message })
      return
    }

    res.status(400).json({ message })
  }
})

router.put("/:id/questions/:questionId", async (req, res) => {
  try {
    const { label, type, required, options } = req.body

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
      res.status(400).json({ message: "Invalid question data." })
      return
    }

    const question: Question = {
      id: req.params.questionId,
      label,
      type: type as Question["type"],
      required,
      options,
    }

    const survey = await updateQuestion.execute(
      req.params.id,
      req.params.questionId,
      question
    )

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
      res.status(404).json({ message })
      return
    }

    res.status(400).json({ message })
  }
})


router.post("/:id/publish", async (req, res) => {
  try {
    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
      return
    }

    survey.publish()
    await surveyRepository.save(survey)

    res.status(200).json({
      id: survey.id,
      title: survey.title,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error."

    res.status(400).json({ message })
  }
})

router.post("/:id/close", async (req, res) => {
  try {
    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
      return
    }

    survey.close()
    await surveyRepository.save(survey)

    res.status(200).json({
      id: survey.id,
      title: survey.title,
      status: survey.status,
      questions: survey.getQuestions(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error."

    res.status(400).json({ message })
  }
})


router.get("/stats", async (_req, res) => {
  try {
    const stats = await surveyRepository.getStatistics()
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
    const survey = await surveyRepository.findById(req.params.id)

    if (!survey) {
      res.status(404).json({ message: "Survey not found." })
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
    const message =
      error instanceof Error ? error.message : "Unexpected error."

    res.status(500).json({ message })
  }
})

router.delete("/:id/questions/:questionId", async (req, res) => {
  try {
    const survey = await deleteQuestion.execute(
      req.params.id,
      req.params.questionId
    )

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
      res.status(404).json({ message })
      return
    }

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
