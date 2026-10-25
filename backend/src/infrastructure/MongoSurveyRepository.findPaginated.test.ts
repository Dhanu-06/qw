import { beforeEach, describe, expect, it, vi } from "vitest"
import { Survey } from "../domain/survey"

const lean = vi.fn()
const limitFn = vi.fn(() => ({ lean }))
const skipFn = vi.fn(() => ({ limit: limitFn }))
const sortFn = vi.fn(() => ({ skip: skipFn }))
const findFn = vi.fn((_filter?: unknown) => ({ sort: sortFn }))
const countDocuments = vi.fn(async (_filter?: unknown) => 0)
const findById = vi.fn((_id?: unknown) => ({ lean: vi.fn() }))

vi.mock("./SurveyModel", () => ({
  SurveyModel: {
    find: (filter?: unknown) => findFn(filter),
    countDocuments: (filter?: unknown) => countDocuments(filter),
    findById: (id?: unknown) => findById(id),
  },
}))

import { MongoSurveyRepository } from "./MongoSurveyRepository"

const mixedQuestionSurvey = {
  _id: { toString: () => "survey-mixed" },
  title: "Mixed Question Survey",
  status: "published" as const,
  description: "All question types",
  questions: [
    {
      id: "q-short",
      label: "Role",
      type: "short_text" as const,
      required: true,
    },
    {
      id: "q-long",
      label: "Comments",
      type: "long_text" as const,
      required: false,
    },
    {
      id: "q-single",
      label: "Recommend?",
      type: "single_choice" as const,
      required: true,
      options: ["yes", "no"],
    },
    {
      id: "q-multi",
      label: "Languages",
      type: "multiple_choice" as const,
      required: true,
      options: [
        { id: "java-id", text: "java" },
        { id: "js-id", text: "js" },
      ],
    },
    {
      id: "q-rating",
      label: "Score",
      type: "rating" as const,
      required: true,
    },
  ],
}

describe("MongoSurveyRepository mapping and pagination", () => {
  const repository = new MongoSurveyRepository()

  beforeEach(() => {
    lean.mockReset()
    limitFn.mockClear()
    skipFn.mockClear()
    sortFn.mockClear()
    findFn.mockClear()
    countDocuments.mockReset()
    findById.mockReset()
  })

  it("rehydrates findPaginated results including legacy string options", async () => {
    lean.mockResolvedValue([mixedQuestionSurvey])
    countDocuments.mockResolvedValue(1)

    const result = await repository.findPaginated(1, 5)

    const questions = result.documents[0].getQuestions()
    expect(questions).toHaveLength(5)
    expect(questions[2].options).toEqual([
      { id: "yes", text: "yes" },
      { id: "no", text: "no" },
    ])
    expect(questions[3].options).toEqual([
      { id: "java-id", text: "java" },
      { id: "js-id", text: "js" },
    ])
    expect(questions[4].options).toBeUndefined()
  })

  it("rehydrates findById results including legacy string options", async () => {
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mixedQuestionSurvey),
    })

    const survey = await repository.findById("survey-mixed")

    expect(survey).not.toBeNull()
    expect(survey?.getQuestions()[2].options).toEqual([
      { id: "yes", text: "yes" },
      { id: "no", text: "no" },
    ])
    expect(survey?.getQuestions()[3].options?.[0].id).toBe("java-id")
  })

  it("uses the requested page size in skip and limit", async () => {
    lean.mockResolvedValue([])
    countDocuments.mockResolvedValue(0)

    await repository.findPaginated(3, 25, "published", "onboard", "name-asc")

    expect(findFn).toHaveBeenCalledWith({
      status: "published",
      title: { $regex: "onboard", $options: "i" },
    })
    expect(sortFn).toHaveBeenCalledWith({ title: 1, _id: 1 })
    expect(skipFn).toHaveBeenCalledWith(50)
    expect(limitFn).toHaveBeenCalledWith(25)

    await repository.findPaginated(1, 5)
    expect(skipFn).toHaveBeenCalledWith(0)
    expect(limitFn).toHaveBeenCalledWith(5)

    await repository.findPaginated(2, 100)
    expect(skipFn).toHaveBeenCalledWith(100)
    expect(limitFn).toHaveBeenCalledWith(100)
  })

  it("sorts newest with a deterministic _id tiebreaker", async () => {
    lean.mockResolvedValue([])
    countDocuments.mockResolvedValue(0)

    await repository.findPaginated(1, 5, undefined, undefined, "newest")
    expect(sortFn).toHaveBeenCalledWith({ createdAt: -1, _id: 1 })

    await repository.findPaginated(1, 5, undefined, undefined, "name-desc")
    expect(sortFn).toHaveBeenCalledWith({ title: -1, _id: 1 })
  })

  it("returns an empty page when skip is beyond the last page", async () => {
    lean.mockResolvedValue([])
    countDocuments.mockResolvedValue(12)

    const result = await repository.findPaginated(10, 5)

    expect(result.documents).toEqual([])
    expect(result.total).toBe(12)
    expect(skipFn).toHaveBeenCalledWith(45)
    expect(limitFn).toHaveBeenCalledWith(5)
  })

  it("lets domain validation reject genuinely invalid options", async () => {
    lean.mockResolvedValue([
      {
        _id: { toString: () => "survey-invalid" },
        title: "Invalid Survey",
        status: "draft",
        questions: [
          {
            id: "q1",
            label: "Broken choice",
            type: "single_choice",
            required: true,
            options: [{ foo: "bar" }, { foo: "baz" }],
          },
        ],
      },
    ])
    countDocuments.mockResolvedValue(1)

    await expect(repository.findPaginated(1, 5)).rejects.toThrow(
      "Every option must have an ID and text."
    )
  })

  it("preserves option IDs used by submitted answers after rehydrate", async () => {
    findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => "survey-answers" },
        title: "Answer Compatibility",
        status: "published",
        questions: [
          {
            id: "q1",
            label: "Recommend?",
            type: "single_choice",
            required: true,
            options: ["yes", "no"],
          },
        ],
      }),
    })

    const survey = (await repository.findById("survey-answers")) as Survey

    expect(() =>
      survey.validateAnswers([{ questionId: "q1", value: "yes" }])
    ).not.toThrow()
  })
})
