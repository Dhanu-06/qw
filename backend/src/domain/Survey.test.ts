import { describe, it, expect } from "vitest"
import { Survey } from "./survey"
import type { Question } from "./question"

describe("Survey", () => {
  it("should reject a sixth question", () => {
    const survey = new Survey("survey-1", "New Joiner Check-in")

    for (let i = 1; i <= 5; i++) {
      const question: Question = {
        id: `q${i}`,
        label: `Question ${i}`,
        type: "short_text",
        required: true,
      }

      survey.addQuestion(question)
    }

    const sixthQuestion: Question = {
      id: "q6",
      label: "Question 6",
      type: "short_text",
      required: true,
    }

    expect(() => survey.addQuestion(sixthQuestion)).toThrow(
      "A survey cannot have more than 5 questions."
    )
  })

  it("should preserve the original question when an update is invalid", () => {
    const survey = new Survey("survey-1", "New Joiner Check-in")

    const originalQuestion: Question = {
      id: "q1",
      label: "How was your onboarding?",
      type: "single_choice",
      required: true,
      options: ["Good", "Bad"],
    }

    survey.addQuestion(originalQuestion)

    const invalidQuestion: Question = {
      id: "q1",
      label: "How was your onboarding?",
      type: "single_choice",
      required: true,
      options: ["Good"],
    }

    expect(() => survey.updateQuestion("q1", invalidQuestion)).toThrow(
      "Choice questions need at least 2 options."
    )

    expect(survey.getQuestions()[0]).toEqual(originalQuestion)
  })

    it("should reject duplicate question IDs", () => {
    const survey = new Survey("survey-1", "New Joiner Check-in")

    const firstQuestion: Question = {
      id: "q1",
      label: "What is your role?",
      type: "short_text",
      required: true,
    }

    const duplicateQuestion: Question = {
      id: "q1",
      label: "What support do you need?",
      type: "long_text",
      required: false,
    }

    survey.addQuestion(firstQuestion)

    expect(() => survey.addQuestion(duplicateQuestion)).toThrow(
      "Question ID already exists."
    )

    expect(survey.getQuestions()).toHaveLength(1)
  })

    it("should reject choice questions with fewer than two options", () => {
    const survey = new Survey("survey-1", "New Joiner Check-in")

    const invalidQuestion: Question = {
      id: "q1",
      label: "How clear are your responsibilities?",
      type: "single_choice",
      required: true,
      options: ["Very clear"],
    }

    expect(() => survey.addQuestion(invalidQuestion)).toThrow(
      "Choice questions need at least 2 options."
    )

    expect(survey.getQuestions()).toHaveLength(0)
  })

    it("should publish a valid survey", () => {
    const survey = new Survey("survey-1", "New Joiner Check-in")

    const question: Question = {
      id: "q1",
      label: "What would help you feel connected to your team?",
      type: "short_text",
      required: true,
    }

    survey.addQuestion(question)
    survey.publish()

    expect(survey.status).toBe("published")
  })

    it("should reject publishing a survey with a blank title", () => {
    const survey = new Survey("survey-2", "   ")

    const question: Question = {
      id: "q1",
      label: "What would help you feel connected to your team?",
      type: "short_text",
      required: true,
    }

    survey.addQuestion(question)

    expect(() => survey.publish()).toThrow(
      "Survey title cannot be empty."
    )

    expect(survey.status).toBe("draft")
  })
  
    it("should reject publishing a survey without questions", () => {
    const survey = new Survey("survey-3", "New Joiner Check-in")

    expect(() => survey.publish()).toThrow(
      "A survey must have at least one question."
    )

    expect(survey.status).toBe("draft")
  })

    it("should reject adding questions after publication", () => {
    const survey = new Survey("survey-4", "New Joiner Check-in")

    const question: Question = {
      id: "q1",
      label: "What would help you feel connected to your team?",
      type: "short_text",
      required: true,
    }

    survey.addQuestion(question)
    survey.publish()

    const anotherQuestion: Question = {
      id: "q2",
      label: "What support do you need?",
      type: "long_text",
      required: false,
    }

    expect(() => survey.addQuestion(anotherQuestion)).toThrow(
      "Only draft surveys can be edited."
    )

    expect(survey.getQuestions()).toHaveLength(1)
  })

    it("should reject updating questions after publication", () => {
    const survey = new Survey("survey-5", "New Joiner Check-in")

    const question: Question = {
      id: "q1",
      label: "What is your role?",
      type: "short_text",
      required: true,
    }

    survey.addQuestion(question)
    survey.publish()

    const updatedQuestion: Question = {
      ...question,
      label: "What is your new role?",
    }

    expect(() => survey.updateQuestion("q1", updatedQuestion)).toThrow(
      "Only draft surveys can be edited."
    )

    expect(survey.getQuestions()[0].label).toBe("What is your role?")
  })
    it("should reject deleting questions after publication", () => {
    const survey = new Survey("survey-6", "New Joiner Check-in")

    const question: Question = {
      id: "q1",
      label: "What is your role?",
      type: "short_text",
      required: true,
    }

    survey.addQuestion(question)
    survey.publish()

    expect(() => survey.deleteQuestion("q1")).toThrow(
      "Only draft surveys can be edited."
    )

    expect(survey.getQuestions()).toHaveLength(1)
  })

    it("should close a published survey", () => {
    const survey = new Survey("survey-7", "New Joiner Check-in")

    survey.addQuestion({
      id: "q1",
      label: "What is your role?",
      type: "short_text",
      required: true,
    })

    survey.publish()
    survey.close()

    expect(survey.status).toBe("closed")
  })
  
    it("should reject closing a draft survey", () => {
    const survey = new Survey("survey-8", "New Joiner Check-in")

    expect(() => survey.close()).toThrow(
      "Only published surveys can be closed."
    )

    expect(survey.status).toBe("draft")
  })

    it("should protect its questions from external mutation", () => {
    const survey = new Survey("survey-9", "New Joiner Check-in")

    survey.addQuestion({
      id: "q1",
      label: "How clear are your responsibilities?",
      type: "single_choice",
      required: true,
      options: ["Very clear", "Not clear"],
    })

    const questions = survey.getQuestions()

    questions[0].label = ""
    questions[0].options?.push("Maybe")

    const savedQuestion = survey.getQuestions()[0]

    expect(savedQuestion.label).toBe(
      "How clear are your responsibilities?"
    )
    expect(savedQuestion.options).toEqual(["Very clear", "Not clear"])
  })

    it("should reject an unsupported question type", () => {
    const survey = new Survey("survey-10", "New Joiner Check-in")

    const invalidQuestion = {
      id: "q1",
      label: "What is your role?",
      type: "email",
      required: true,
    } as unknown as Question

    expect(() => survey.addQuestion(invalidQuestion)).toThrow(
      "Invalid question type."
    )

    expect(survey.getQuestions()).toHaveLength(0)
  })


it("rehydrates a published survey with its questions", () => {
  const question = {
    id: "q1",
    label: "How was your onboarding?",
    type: "rating" as const,
    required: true,
  }

  const survey = Survey.rehydrate(
    "survey-1",
    "Employee Onboarding",
    "published",
    [question]
  )

  expect(survey.status).toBe("published")
  expect(survey.getQuestions()).toEqual([question])
})


it("accepts a valid rating response", () => {
  const survey = Survey.rehydrate(
    "survey-20",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([{ questionId: "q1", value: 4 }])
  ).not.toThrow()
})

it("rejects a rating outside the 1 to 5 range", () => {
  const survey = Survey.rehydrate(
    "survey-21",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([{ questionId: "q1", value: 6 }])
  ).toThrow("Rating must be a whole number from 1 to 5.")
})

it("rejects a response missing a required answer", () => {
  const survey = Survey.rehydrate(
    "survey-22",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() => survey.validateAnswers([])).toThrow(
    "Missing required answer: Rate your onboarding"
  )
})

it("rejects duplicate answers for the same question", () => {
  const survey = Survey.rehydrate(
    "survey-23",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: 3 },
      { questionId: "q1", value: 5 },
    ])
  ).toThrow("Invalid or duplicate answer.")
})


it("rejects responses to a closed survey", () => {
  const survey = Survey.rehydrate(
    "survey-24",
    "Employee Onboarding",
    "closed",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([{ questionId: "q1", value: 4 }])
  ).toThrow("Only published surveys accept responses.")
})

it("rejects a blank required text answer", () => {
  const survey = Survey.rehydrate(
    "survey-25",
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

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "   " },
    ])
  ).toThrow("Required question cannot be empty.")
})

it("rejects an answer for an unknown question", () => {
  const survey = Survey.rehydrate(
    "survey-26",
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

  expect(() =>
    survey.validateAnswers([
      { questionId: "unknown-question", value: "Developer" },
    ])
  ).toThrow("Answer refers to an unknown question.")
})

it("rejects an invalid single-choice option", () => {
  const survey = Survey.rehydrate(
    "survey-27",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "How was your onboarding?",
        type: "single_choice",
        required: true,
        options: ["Good", "Bad"],
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "Excellent" },
    ])
  ).toThrow("Invalid single-choice answer.")
})

it("rejects an invalid multiple-choice option", () => {
  const survey = Survey.rehydrate(
    "survey-28",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "What support do you need?",
        type: "multiple_choice",
        required: true,
        options: ["Training", "Mentoring", "Resources"],
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      {
        questionId: "q1",
        value: ["Training", "Free holidays"],
      },
    ])
  ).toThrow("Invalid multiple-choice answer.")
})

it("rejects duplicate multiple-choice selections", () => {
  const survey = Survey.rehydrate(
    "survey-29",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "What support do you need?",
        type: "multiple_choice",
        required: true,
        options: ["Training", "Mentoring", "Resources"],
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      {
        questionId: "q1",
        value: ["Training", "Training"],
      },
    ])
  ).toThrow("Invalid multiple-choice answer.")
})

it("rejects an empty selection for a required multiple-choice question", () => {
  const survey = Survey.rehydrate(
    "survey-30",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "What support do you need?",
        type: "multiple_choice",
        required: true,
        options: ["Training", "Mentoring", "Resources"],
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: [] },
    ])
  ).toThrow("Required question cannot be empty.")
})


it("rejects a decimal rating", () => {
  const survey = Survey.rehydrate(
    "survey-31",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: 2.5 },
    ])
  ).toThrow("Rating must be a whole number from 1 to 5.")
})

it("rejects a rating below 1", () => {
  const survey = Survey.rehydrate(
    "survey-32",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "Rate your onboarding",
        type: "rating",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: 0 },
    ])
  ).toThrow("Rating must be a whole number from 1 to 5.")
})

it("allows an unanswered optional question to be omitted", () => {
  const survey = Survey.rehydrate(
    "survey-33",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "What is your role?",
        type: "short_text",
        required: true,
      },
      {
        id: "q2",
        label: "Any additional comments?",
        type: "long_text",
        required: false,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "Developer" },
    ])
  ).not.toThrow()
})

it("rejects a non-string text answer", () => {
  const survey = Survey.rehydrate(
    "survey-34",
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

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: 123 },
    ])
  ).toThrow("Text answers must be strings.")
})

it("rejects a non-array answer payload", () => {
  const survey = Survey.rehydrate(
    "survey-35",
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

  expect(() =>
    survey.validateAnswers(
      { questionId: "q1", value: "Developer" } as any
    )
  ).toThrow("Answers must be an array.")
})

it("rejects responses to a draft survey", () => {
  const survey = Survey.rehydrate(
    "survey-36",
    "Employee Onboarding",
    "draft",
    [
      {
        id: "q1",
        label: "What is your role?",
        type: "short_text",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "Developer" },
    ])
  ).toThrow("Only published surveys accept responses.")
})

it("accepts valid multiple-choice selections", () => {
  const survey = Survey.rehydrate(
    "survey-37",
    "Employee Onboarding",
    "published",
    [
      {
        id: "q1",
        label: "What support do you need?",
        type: "multiple_choice",
        required: true,
        options: ["Training", "Mentoring", "Resources"],
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      {
        questionId: "q1",
        value: ["Training", "Mentoring"],
      },
    ])
  ).not.toThrow()
})


it("accepts a question label of exactly 200 characters", () => {
  const survey = new Survey("survey-limit-1", "Test Survey")

  expect(() =>
    survey.addQuestion({
      id: "q1",
      label: "Q".repeat(200),
      type: "short_text",
      required: true,
    })
  ).not.toThrow()
})

it("rejects a question label longer than 200 characters", () => {
  const survey = new Survey("survey-limit-2", "Test Survey")

  expect(() =>
    survey.addQuestion({
      id: "q1",
      label: "Q".repeat(201),
      type: "short_text",
      required: true,
    })
  ).toThrow("Question label cannot exceed 200 characters.")
})

it("accepts an option of exactly 100 characters", () => {
  const survey = new Survey("survey-limit-3", "Test Survey")

  expect(() =>
    survey.addQuestion({
      id: "q1",
      label: "Choose an option",
      type: "single_choice",
      required: true,
      options: ["A".repeat(100), "Other"],
    })
  ).not.toThrow()
})

it("rejects an option longer than 100 characters", () => {
  const survey = new Survey("survey-limit-4", "Test Survey")

  expect(() =>
    survey.addQuestion({
      id: "q1",
      label: "Choose an option",
      type: "single_choice",
      required: true,
      options: ["A".repeat(101), "Other"],
    })
  ).toThrow("Each option cannot exceed 100 characters.")
})

it("accepts a short-text answer of exactly 100 characters", () => {
  const survey = Survey.rehydrate(
    "survey-limit-5",
    "Test Survey",
    "published",
    [
      {
        id: "q1",
        label: "Short answer",
        type: "short_text",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "A".repeat(100) },
    ])
  ).not.toThrow()
})

it("rejects a long-text answer longer than 500 characters", () => {
  const survey = Survey.rehydrate(
    "survey-limit-6",
    "Test Survey",
    "published",
    [
      {
        id: "q1",
        label: "Long answer",
        type: "long_text",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "A".repeat(501) },
    ])
  ).toThrow(
    "Long text answers cannot exceed 500 characters."
  )
})
it("rejects a short-text answer longer than 100 characters", () => {
  const survey = Survey.rehydrate(
    "survey-limit-7",
    "Test Survey",
    "published",
    [
      {
        id: "q1",
        label: "Short answer",
        type: "short_text",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "A".repeat(101) },
    ])
  ).toThrow("Short text answers cannot exceed 100 characters.")
})

it("accepts a long-text answer of exactly 500 characters", () => {
  const survey = Survey.rehydrate(
    "survey-limit-8",
    "Test Survey",
    "published",
    [
      {
        id: "q1",
        label: "Long answer",
        type: "long_text",
        required: true,
      },
    ]
  )

  expect(() =>
    survey.validateAnswers([
      { questionId: "q1", value: "A".repeat(500) },
    ])
  ).not.toThrow()
})

it("should reject updating a question with a label longer than 200 characters", () => {
  const survey = new Survey("survey-update-1", "Test Survey")

  const question: Question = {
    id: "q1",
    label: "Original question",
    type: "short_text",
    required: true,
  }

  survey.addQuestion(question)

  const updatedQuestion: Question = {
    ...question,
    label: "Q".repeat(201),
  }

  expect(() => survey.updateQuestion("q1", updatedQuestion)).toThrow(
    "Question label cannot exceed 200 characters."
  )

  expect(survey.getQuestions()[0].label).toBe("Original question")
})

it("should reject updating a choice option longer than 100 characters", () => {
  const survey = new Survey("survey-update-2", "Test Survey")

  const question: Question = {
    id: "q1",
    label: "Choose an option",
    type: "single_choice",
    required: true,
    options: ["Option A", "Option B"],
  }

  survey.addQuestion(question)

  const updatedQuestion: Question = {
    ...question,
    options: ["A".repeat(101), "Option B"],
  }

  expect(() => survey.updateQuestion("q1", updatedQuestion)).toThrow(
    "Each option cannot exceed 100 characters."
  )

  expect(survey.getQuestions()[0].options).toEqual(["Option A", "Option B"])
})

})