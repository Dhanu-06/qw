import "dotenv/config"
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import mongoose from "mongoose"
import { MongoSurveyRepository } from "./MongoSurveyRepository"
import { Survey } from "../domain/survey"

describe("MongoSurveyRepository", () => {
  const repository = new MongoSurveyRepository()

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI!)
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  it("saves and retrieves a draft survey", async () => {
    const id = crypto.randomUUID()
    const survey = new Survey(id, "Employee Onboarding")

    await repository.save(survey)

    const savedSurvey = await repository.findById(id)

    expect(savedSurvey).not.toBeNull()
    expect(savedSurvey?.title).toBe("Employee Onboarding")
    expect(savedSurvey?.status).toBe("draft")
  })
})
