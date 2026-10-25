import "dotenv/config"
import mongoose from "mongoose"
import { connectDatabase } from "../infrastructure/database"
import { SurveyModel } from "../infrastructure/SurveyModel"
import { mapPersistedOptions } from "../infrastructure/mapPersistedQuestions"

type CliOptions = {
  apply: boolean
}

function parseCliOptions(argv: string[]): CliOptions {
  return {
    apply: argv.includes("--apply"),
  }
}

function isLegacyOptionItem(item: unknown): boolean {
  if (typeof item === "string") {
    return true
  }

  if (item && typeof item === "object") {
    const candidate = item as { id?: unknown; text?: unknown }
    return typeof candidate.id !== "string" && typeof candidate.text === "string"
  }

  return false
}

function questionNeedsMigration(question: {
  type?: string
  options?: unknown
}): boolean {
  if (
    question.type !== "single_choice" &&
    question.type !== "multiple_choice"
  ) {
    return false
  }

  if (!Array.isArray(question.options)) {
    return false
  }

  return question.options.some(isLegacyOptionItem)
}

async function migrateLegacyChoiceOptions(): Promise<void> {
  const { apply } = parseCliOptions(process.argv)
  const mode = apply ? "apply" : "dry-run"

  console.log(
    `Legacy choice-option migration (${mode}). ` +
      "Existing {id, text} options are left unchanged. " +
      "String options become { id: originalString, text: originalString }."
  )
  console.log(
    "Response compatibility: answers that stored the option text will still match. " +
      "Answers that already stored a generated option ID are unchanged because those surveys already have IDs."
  )

  await connectDatabase()

  const documents = await SurveyModel.collection.find({}).toArray()

  let surveysWithLegacyOptions = 0
  let questionsUpdated = 0
  let optionsConverted = 0

  for (const document of documents) {
    const questions = Array.isArray(document.questions)
      ? document.questions
      : []
    const questionsToMigrate = questions.filter(questionNeedsMigration)

    if (questionsToMigrate.length === 0) {
      continue
    }

    surveysWithLegacyOptions += 1
    questionsUpdated += questionsToMigrate.length

    const nextQuestions = questions.map((question) => {
      if (!questionNeedsMigration(question)) {
        return question
      }

      const mappedOptions = mapPersistedOptions(question.options)
      optionsConverted += (question.options as unknown[]).filter(
        isLegacyOptionItem
      ).length

      return {
        ...question,
        options: mappedOptions,
      }
    })

    console.log(
      `- ${document._id}: ${questionsToMigrate.length} choice question(s) with legacy options`
    )

    if (apply) {
      await SurveyModel.collection.updateOne(
        { _id: document._id },
        { $set: { questions: nextQuestions } }
      )
    }
  }

  console.log(
    JSON.stringify(
      {
        mode,
        surveysScanned: documents.length,
        surveysWithLegacyOptions,
        questionsUpdated,
        optionsConverted,
      },
      null,
      2
    )
  )

  if (!apply) {
    console.log("Dry run complete. Re-run with --apply to write these changes.")
  }
}

migrateLegacyChoiceOptions()
  .catch((error) => {
    console.error("Legacy choice-option migration failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
