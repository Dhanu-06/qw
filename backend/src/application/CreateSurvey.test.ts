
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

  
it("rejects an empty survey title", async () => {
  const repository: SurveyRepository = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findPaginated: vi.fn(),
  }

  const useCase = new CreateSurvey(repository)

  await expect(useCase.execute("   ")).rejects.toThrow(
    "Survey title cannot be empty."
  )

  expect(repository.save).not.toHaveBeenCalled()
})

it("rejects a survey title longer than 100 characters", async () => {
  const repository: SurveyRepository = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findPaginated: vi.fn(),
  }

  const useCase = new CreateSurvey(repository)

  await expect(useCase.execute("A".repeat(101))).rejects.toThrow(
    "Survey title cannot exceed 100 characters."
  )

  expect(repository.save).not.toHaveBeenCalled()
})

it("rejects a survey description longer than 500 characters", async () => {
  const repository: SurveyRepository = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findPaginated: vi.fn(),
  }

  const useCase = new CreateSurvey(repository)

  await expect(
    useCase.execute("Employee Survey", "A".repeat(501))
  ).rejects.toThrow(
    "Survey description cannot exceed 500 characters."
  )

  expect(repository.save).not.toHaveBeenCalled()
})

it("accepts a title of 100 characters and description of 500 characters", async () => {
  const repository: SurveyRepository = {
    save: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findPaginated: vi.fn(),
  }

  const useCase = new CreateSurvey(repository)
  const title = "T".repeat(100)
  const description = "D".repeat(500)

  const survey = await useCase.execute(title, description)

  expect(survey.title).toBe(title)
  expect(survey.description).toBe(description)
  expect(repository.save).toHaveBeenCalledWith(survey)
})

})