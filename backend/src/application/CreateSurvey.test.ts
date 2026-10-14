
import { describe, it, expect, vi } from "vitest"
import { CreateSurvey } from "./CreateSurvey"
import type { SurveyRepository } from "./SurveyRepository"

describe("CreateSurvey", () => {
  it("creates and saves a draft survey", async () => {
    const repository: SurveyRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findPaginated: vi.fn(),
}

    const useCase = new CreateSurvey(repository)

    const survey = await useCase.execute("Employee Onboarding")

    expect(survey.title).toBe("Employee Onboarding")
    expect(survey.status).toBe("draft")
    expect(repository.save).toHaveBeenCalledWith(survey)
  })
})
