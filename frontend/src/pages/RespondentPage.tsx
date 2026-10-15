
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Survey } from '../App'

function RespondentPage() {
  const { surveyId } = useParams<{ surveyId: string }>()

const [survey, setSurvey] = useState<Survey | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState("")
const [validationErrors, setValidationErrors] = useState<
  Record<string, string>
>({})
const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
const [submitting, setSubmitting] = useState(false)
const [success, setSuccess] = useState(false)



useEffect(() => {
  async function fetchSurvey() {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `http://localhost:5000/api/surveys/${surveyId}`
      )

      if (!response.ok) {
        throw new Error("Could not load survey.")
      }

      const data: Survey = await response.json()

      if (data.status !== "published") {
        throw new Error("This survey is not available for responses.")
      }

      setSurvey(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      )
    } finally {
      setLoading(false)
    }
  }

  if (surveyId) {
    void fetchSurvey()
  } else {
    setError("Survey ID is missing.")
    setLoading(false)
  }
}, [surveyId])

  
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()

  if (!survey || submitting) return

  setError("")

  const missingAnswer = survey.questions.find((question) => {
    if (!question.required) return false

    const answer = answers[question.id]

    if (typeof answer === "string") return !answer.trim()
    if (Array.isArray(answer)) return answer.length === 0

    return answer === undefined
  })

  if (missingAnswer) {
  setValidationErrors({
    [missingAnswer.id]: "Please answer this required question.",
  })
  return
}

setValidationErrors({})

  try {
    setSubmitting(true)

    const response = await fetch(
      `http://localhost:5000/api/surveys/${survey.id}/responses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Could not submit your responses.")
    }

    setSuccess(true)
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Could not submit your responses."
    )
  } finally {
    setSubmitting(false)
  }
}

  if (loading) {
    return (
      <main className="dashboard">
        <section className="create-form">
          <p>Loading survey...</p>
        </section>
      </main>
    )
  }

  if (error || !survey) {
    return (
      <main className="dashboard">
        <section className="create-form">
          <h1>Survey unavailable</h1>
          <p role="alert" className="error-message">
            {error || "Could not load survey."}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard">
      <section className="create-form">
        <p className="eyebrow">EMPLOYEE EXPERIENCE</p>
        <h1>{survey.title}</h1>
        {survey.description && (
  <p className="survey-description">
    {survey.description}
  </p>
)}
        <p>Share your feedback by answering the questions below.</p>

        

<form onSubmit={handleSubmit}>
  {survey.questions.map((question, index) => (
    <article key={question.id} className="survey-row">
      <h3>
        {index + 1}. {question.label}
        {question.required && " *"}
      </h3>

{question.type === "short_text" && (
  <input
    type="text"
    placeholder="Enter your answer"
    value={(answers[question.id] as string) ?? ""}
    onChange={(event) =>
      setAnswers({
        ...answers,
        [question.id]: event.target.value,
      })
    }
  />
)}

{question.type === "long_text" && (
  <textarea
    placeholder="Enter your answer"
    rows={4}
    value={(answers[question.id] as string) ?? ""}
    onChange={(event) =>
      setAnswers({
        ...answers,
        [question.id]: event.target.value,
      })
    }
  />
)}

{question.type === "single_choice" && (
  <div>
    {question.options?.map((option) => (
      <label key={option}>
        <input
          type="radio"
          name={question.id}
          checked={answers[question.id] === option}
          onChange={() =>
            setAnswers({ ...answers, [question.id]: option })
          }
        />
        {option}
      </label>
    ))}
  </div>
)}

{question.type === "multiple_choice" && (
  <div>
    {question.options?.map((option) => {
      const selected = (answers[question.id] as string[]) ?? []

      return (
        <label key={option}>
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(event) => {
              const updated = event.target.checked
                ? [...selected, option]
                : selected.filter((item) => item !== option)

              setAnswers({ ...answers, [question.id]: updated })
            }}
          />
          {option}
        </label>
      )
    })}
  </div>
)}

{question.type === "rating" && (
  <div>
    {[1, 2, 3, 4, 5].map((rating) => (
      <label key={rating}>
        <input
          type="radio"
          name={question.id}
          checked={answers[question.id] === rating}
          onChange={() =>
            setAnswers({ ...answers, [question.id]: rating })
          }
        />
        {rating}
      </label>
    ))}
  </div>
)}
{validationErrors[question.id] && (
  <p className="field-error">
    {validationErrors[question.id]}
  </p>
)}

      {/* Keep all five input controls you already added here. */}
    </article>
  ))}

  {error && (
    <p role="alert" className="error-message">
      {error}
    </p>
  )}

  {success ? (
    <p role="status">Your response has been submitted successfully. Thank you!</p>
  ) : (
    <button
      type="submit"
      className="primary-button"
      disabled={submitting}
    >
      {submitting ? "Submitting..." : "Submit response"}
    </button>
  )}
</form>


      </section>
    </main>
  )
}

export default RespondentPage
