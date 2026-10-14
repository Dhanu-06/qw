
import { describe, it, expect, vi } from "vitest"
import { SubmitSurveyResponse } from "./SubmitSurveyResponse"
import type { SurveyRepository } from "./SurveyRepository"
import type { SurveyResponseRepository } from "./SurveyResponseRepository"
import { Survey } from "../domain/survey"

describe("SubmitSurveyResponse", () => {
  it("does not save a response when validation fails", async () => {
    const survey = Survey.rehydrate(
      "survey-1",
      "Employee Onboarding",
      "published",
      [
        {
          id: "q1",
          label: "What is your role?",
          type: "short_text",
          required: true,
        },
      ]
    )

    const surveyRepository = {
      findById: vi.fn().mockResolvedValue(survey),
    } as unknown as SurveyRepository

    const responseRepository = {
      save: vi.fn(),
      findBySurveyId: vi.fn(),
      findPaginatedBySurveyId: vi.fn(),
    } as unknown as SurveyResponseRepository

    const submitSurveyResponse = new SubmitSurveyResponse(
      surveyRepository,
      responseRepository
    )

    await expect(
      submitSurveyResponse.execute("survey-1", [])
    ).rejects.toThrow("Missing required answer: What is your role?")

    expect(responseRepository.save).not.toHaveBeenCalled()
  })

it("saves a valid response with its survey reference and timestamp", async () => {
  const survey = Survey.rehydrate(
    "survey-2",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "What is your role?",
        type: "short_text",
        required: true,
      },
    ]
  )

  const surveyRepository = {
    findById: vi.fn().mockResolvedValue(survey),
  } as unknown as SurveyRepository

  const responseRepository = {
    save: vi.fn().mockResolvedValue(undefined),
    findBySurveyId: vi.fn(),
    findPaginatedBySurveyId: vi.fn(),
  } as unknown as SurveyResponseRepository

  const useCase = new SubmitSurveyResponse(
    surveyRepository,
    responseRepository
  )

  const response = await useCase.execute("survey-2", [
    { questionId: "q1", value: "Developer" },
  ])

  expect(responseRepository.save).toHaveBeenCalledTimes(1)
  expect(response.surveyId).toBe("survey-2")
  expect(response.submittedAt).toBeInstanceOf(Date)
  expect(response.answers).toEqual([
    { questionId: "q1", value: "Developer" },
  ])
})

})
