
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type QuestionResult = {
  questionId: string
  label: string
  type: string
  textAnswers?: string[]
  optionCounts?: { option: string; count: number }[]
  averageRating?: number | null
  ratingCount?: number
}

type ResultsData = {
  survey: {
    id: string
    title: string
    status: string
  }
  totalResponses: number
  questionResults: QuestionResult[]
}

function ResultsPage() {
  const { surveyId } = useParams<{ surveyId: string }>()

  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

type SurveyResponseItem = {
  id: string
  surveyId: string
  answers: {
    questionId: string
    value: string | string[] | number
  }[]
  submittedAt: string
}

type PaginatedResponses = {
  responses: SurveyResponseItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

const [responseData, setResponseData] =
  useState<PaginatedResponses | null>(null)
const [responsePage, setResponsePage] = useState(1)
const [responsesLoading, setResponsesLoading] = useState(false)
const [responsesError, setResponsesError] = useState('')


  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/surveys/${surveyId}/results`
        )

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Could not load results.')
        }

        const data: ResultsData = await response.json()
        setResults(data)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Could not load results.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (surveyId) {
      void fetchResults()
    } else {
      setError('Survey ID is missing.')
      setLoading(false)
    }
  }, [surveyId])


useEffect(() => {
  async function fetchResponses() {
    if (!surveyId) return

    try {
      setResponsesLoading(true)
      setResponsesError('')

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/surveys/${surveyId}/responses?page=${responsePage}&limit=5`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          data.message || 'Could not load responses.'
        )
      }

      const data: PaginatedResponses = await response.json()
      setResponseData(data)
    } catch (error) {
      setResponsesError(
        error instanceof Error
          ? error.message
          : 'Could not load responses.'
      )
    } finally {
      setResponsesLoading(false)
    }
  }

  void fetchResponses()
}, [surveyId, responsePage])


  if (loading) {
    return (
      <main className="dashboard">
        <section className="create-form">
          <p>Loading results...</p>
        </section>
      </main>
    )
  }

  if (error || !results) {
    return (
      <main className="dashboard">
        <section className="create-form">
          <h1>Results unavailable</h1>
          <p role="alert" className="error-message">
            {error || 'Could not load results.'}
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard results-page">
  <section className="results-container">
        <p className="eyebrow">SURVEY RESULTS</p>
        <h1>{results.survey.title}</h1>
        <p>Total responses: {results.totalResponses}</p>

        
{results.questionResults.map((question) => (
  <article
  key={question.questionId}
  className="results-question-card"
>
    <h3>{question.label}</h3>
    <p>Type: {question.type.replace("_", " ")}</p>

    {question.textAnswers && (
      <div>
        <h4>Submitted answers</h4>
        {question.textAnswers.length === 0 ? (
          <p>No text answers yet.</p>
        ) : (
          <ul>
            {question.textAnswers.map((answer, index) => (
              <li key={index}>{answer}</li>
            ))}
          </ul>
        )}
      </div>
    )}

    
{question.optionCounts && (
  <div className="analytics-section">
    <h4>Response breakdown</h4>

    {question.optionCounts.length === 0 ? (
      <p>No options available.</p>
    ) : (
      question.optionCounts.map((item) => {
        const total = question.optionCounts!.reduce(
          (sum, option) => sum + option.count,
          0
        )

        const percentage =
          total === 0 ? 0 : (item.count / total) * 100

        return (
          <div key={item.option} className="analytics-item">
            <div className="analytics-label">
              <span>{item.option}</span>
              <span>
                {item.count} ({percentage.toFixed(0)}%)
              </span>
            </div>

            <div
              className="analytics-track"
              role="progressbar"
              aria-label={`${item.option} responses`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percentage)}
            >
              <div
                className="analytics-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })
    )}
  </div>
)}


    
{question.averageRating !== undefined && (
  <div className="analytics-section">
    <h4>Average rating</h4>

    {question.averageRating === null ? (
      <p>No ratings submitted yet.</p>
    ) : (
      <>
        <p className="rating-score">
          {question.averageRating.toFixed(2)} / 5
          {" "}({question.ratingCount} ratings)
        </p>

        <div
          className="analytics-track rating-track"
          role="progressbar"
          aria-label="Average rating"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={question.averageRating}
        >
          <div
            className="analytics-fill"
            style={{
              width: `${(question.averageRating / 5) * 100}%`,
            }}
          />
        </div>
      </>
    )}
  </div>
)}

  </article>
))}

<div className="survey-section submitted-responses">
  <h2>Submitted responses</h2>
  <p>Browse individual responses submitted to this survey.</p>

  {responsesLoading && <p>Loading responses...</p>}

  {responsesError && (
    <p role="alert" className="error-message">
      {responsesError}
    </p>
  )}

  {!responsesLoading &&
    !responsesError &&
    responseData && (
      <>
        <p>
          Total responses: {responseData.total}
        </p>

        {responseData.responses.length === 0 ? (
          <div className="empty-state">
            <h3>No responses yet</h3>
            <p>Submitted responses will appear here.</p>
          </div>
        ) : (
          responseData.responses.map((response, index) => (
            <article
              key={response.id}
              className="submitted-response-card"
            >
              <div>
                <h3>
                  Response{" "}
                  {(responseData.page - 1) *
                    responseData.limit +
                    index +
                    1}
                </h3>

                <p>
                  Submitted:{" "}
                  {new Date(
                    response.submittedAt
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                {response.answers.map((answer) => {
                  const question =
                    results.survey &&
                    results.questionResults.find(
                      (item) =>
                        item.questionId === answer.questionId
                    )

                  return (
                    <div key={answer.questionId}>
                      <strong>
                        {question?.label ?? "Question"}
                      </strong>
                      <p>
                        {Array.isArray(answer.value)
                          ? answer.value.join(", ")
                          : String(answer.value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </article>
          ))
        )}

        <div className="pagination">
          <button
            className="secondary-button"
            disabled={responseData.page <= 1}
            onClick={() =>
              setResponsePage((page) => page - 1)
            }
          >
            Previous
          </button>

          <span>
            Page {responseData.page} of{" "}
            {Math.max(1, responseData.totalPages)}
          </span>

          <button
            className="secondary-button"
            disabled={
              responseData.page >= responseData.totalPages
            }
            onClick={() =>
              setResponsePage((page) => page + 1)
            }
          >
            Next
          </button>
        </div>
      </>
    )}
</div>

      </section>
    </main>
  )
}

export default ResultsPage
