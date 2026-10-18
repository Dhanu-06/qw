
import { useEffect, useState } from "react"
import "./App.css"

import { Routes, Route } from 'react-router-dom'
import RespondentPage from './pages/RespondentPage'
import ResultsPage from './pages/ResultsPage'


type Question = {
  id: string
  label: string
  type:
    | "short_text"
    | "long_text"
    | "single_choice"
    | "multiple_choice"
    | "rating"
  required: boolean
  options?: string[]
}

export type Survey = {
  id: string
  title: string
  description: string
  status: "draft" | "published" | "closed"
  questions: Question[]
}

const API_URL = `${import.meta.env.VITE_API_URL}/surveys`;

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [surveyTitle, setSurveyTitle] = useState("")
const [surveyDescription, setSurveyDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sharedSurveyId, setSharedSurveyId] = useState<string | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])

const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)

const [statusFilter, setStatusFilter] = useState("all")


  const [loadingSurveys, setLoadingSurveys] = useState(true)
  const [surveyError, setSurveyError] = useState("")

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([])
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
const [editQuestionLabel, setEditQuestionLabel] = useState("")
const [editQuestionRequired, setEditQuestionRequired] = useState(true)
const [savingEdit, setSavingEdit] = useState(false)
  const [questionLabel, setQuestionLabel] = useState("")
const [questionType, setQuestionType] =
  useState<Question["type"]>("short_text")
const [questionRequired, setQuestionRequired] = useState(true)
const [questionOptions, setQuestionOptions] = useState<string[]>(["", ""])
const [addingQuestion, setAddingQuestion] = useState(false)
  const [builderError, setBuilderError] = useState("")

  async function refreshSurveys() {

const query = new URLSearchParams({
  page: String(currentPage),
  limit: "5",
})

if (statusFilter !== "all") {
  query.set("status", statusFilter)
}

const response = await fetch(`${API_URL}?${query.toString()}`)


    if (!response.ok) {
      throw new Error("Could not refresh surveys.")
    }

    

const data: {
  surveys: Survey[]
  page: number
  totalPages: number
} = await response.json()

setSurveys(data.surveys)
setCurrentPage(data.page)
setTotalPages(data.totalPages)

  }

  useEffect(() => {
    async function loadSurveys() {
      try {
        setLoadingSurveys(true)
        setSurveyError("")
        await refreshSurveys()
      } catch (error) {
        setSurveyError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        )
      } finally {
        setLoadingSurveys(false)
      }
    }

    loadSurveys()
  }, [currentPage, statusFilter])

  async function handleCreateSurvey() {
    if (!surveyTitle.trim()) {
      setError("Please enter a survey title.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: surveyTitle.trim(),
          description: surveyDescription.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Could not create survey.")
      }

      await refreshSurveys()
      setSurveyTitle("")
      setSurveyDescription("")
      setShowCreateForm(false)
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
  
async function handleShare(surveyId: string) {
  const link = `${window.location.origin}/surveys/${surveyId}/respond`

  try {
    await navigator.clipboard.writeText(link)
    setSharedSurveyId(surveyId)
  } catch {
    setSharedSurveyId(null)
    alert(`Could not copy link. Please copy it manually:\n${link}`)
  }
}


  async function openSurvey(surveyId: string) {
    try {
      setBuilderError("")

      const response = await fetch(`${API_URL}/${surveyId}`)

      if (!response.ok) {
        throw new Error("Could not load survey.")
      }

      const data: Survey = await response.json()

      setSelectedSurvey(data)
      setSurveyQuestions(data.questions)
    } catch (error) {
      setBuilderError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      )
    }
  }

async function addQuestion() {
  if (!selectedSurvey) return

  if (!questionLabel.trim()) {
    setBuilderError("Please enter a question.")
    return
  }

  if (surveyQuestions.length >= 5) {
    setBuilderError("A survey can have at most 5 questions.")
    return
  }

  try {
    setAddingQuestion(true)
    setBuilderError("")

    const response = await fetch(
      `${API_URL}/${selectedSurvey.id}/questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
body: JSON.stringify({
  label: questionLabel.trim(),
  type: questionType,
  required: questionRequired,
  ...(questionType === "single_choice" ||
  questionType === "multiple_choice"
    ? {
        options: questionOptions
          .map((option) => option.trim())
          .filter((option) => option !== ""),
      }
    : {}),
}),

      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Could not add question.")
    }

    const updatedResponse = await fetch(
      `${API_URL}/${selectedSurvey.id}`
    )

    if (!updatedResponse.ok) {
      throw new Error("Question added, but could not refresh the survey.")
    }

    const updatedSurvey: Survey = await updatedResponse.json()

    setSelectedSurvey(updatedSurvey)
    setSurveyQuestions(updatedSurvey.questions)
    setQuestionLabel("")
    setQuestionType("short_text")
    setQuestionRequired(true)
    setQuestionOptions(["", ""])

    await refreshSurveys()
  } catch (error) {
    setBuilderError(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    )
  } finally {
    setAddingQuestion(false)
  }
}

async function deleteQuestion(questionId: string) {
  if (!selectedSurvey) return

  const confirmed = window.confirm(
    "Are you sure you want to delete this question?"
  )

  if (!confirmed) return

  try {
    setBuilderError("")

    const response = await fetch(
      `${API_URL}/${selectedSurvey.id}/questions/${questionId}`,
      { method: "DELETE" }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Could not delete question.")
    }

    const updatedResponse = await fetch(
      `${API_URL}/${selectedSurvey.id}`
    )

    if (!updatedResponse.ok) {
      throw new Error("Question deleted, but could not refresh the survey.")
    }

    const updatedSurvey: Survey = await updatedResponse.json()

    setSelectedSurvey(updatedSurvey)
    setSurveyQuestions(updatedSurvey.questions)
    await refreshSurveys()
  } catch (error) {
    setBuilderError(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    )
  }
}

async function saveQuestionEdit(question: Question) {
  if (!selectedSurvey) return

  if (!editQuestionLabel.trim()) {
    setBuilderError("Question text cannot be empty.")
    return
  }

  try {
    setSavingEdit(true)
    setBuilderError("")

    const response = await fetch(
      `${API_URL}/${selectedSurvey.id}/questions/${question.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: editQuestionLabel.trim(),
          type: question.type,
          required: editQuestionRequired,
          ...(question.options ? { options: question.options } : {}),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Could not update question.")
    }

    const updatedResponse = await fetch(
      `${API_URL}/${selectedSurvey.id}`
    )

    if (!updatedResponse.ok) {
      throw new Error("Question updated, but could not refresh the survey.")
    }

    const updatedSurvey: Survey = await updatedResponse.json()

    setSelectedSurvey(updatedSurvey)
    setSurveyQuestions(updatedSurvey.questions)
    setEditingQuestionId(null)
    setEditQuestionLabel("")
    await refreshSurveys()
  } catch (error) {
    setBuilderError(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    )
  } finally {
    setSavingEdit(false)
  }
}


async function publishSurvey() {
  if (!selectedSurvey) return

  try {
    setBuilderError("")

    const response = await fetch(
      `${API_URL}/${selectedSurvey.id}/publish`,
      {
        method: "POST",
      }
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || "Could not publish survey.")
    }

    await openSurvey(selectedSurvey.id)
  } catch (error) {
    setBuilderError(
      error instanceof Error
        ? error.message
        : "Could not publish survey."
    )
  }
}

async function closeSurvey() {
  if (!selectedSurvey) return

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/surveys/${selectedSurvey.id}/close`,
      { method: "POST" }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to close survey.")
    }

    await openSurvey(selectedSurvey.id)
    alert("Survey closed successfully!")
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Failed to close survey."
    )
  }
}


  function closeSurveyView() {
    setSelectedSurvey(null)
    setSurveyQuestions([])
    setBuilderError("")
  }

  
return (
  <Routes>
    <Route
      path="/surveys/:surveyId/respond"
      element={<RespondentPage />}
    />

<Route
  path="/surveys/:surveyId/results"
  element={<ResultsPage />}
/>

    <Route
      path="*"
      element={
        <div className="app">

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">Q</div>
          <span>QW Survey</span>
        </div>

        <span className="topbar-label">Employee Experience</span>
      </header>

      <main className="dashboard">
        {selectedSurvey ? (
  showPreview ? (
    <section className="create-form">
      <button
        type="button"
        className="secondary-button"
        onClick={() => setShowPreview(false)}
      >
        ← Back to builder
      </button>

      <p className="eyebrow">SURVEY PREVIEW</p>
      <h1>{selectedSurvey.title}</h1>
      <p>Review how your survey will appear to respondents.</p>

      {surveyQuestions.map((question, index) => (
        <article key={question.id} className="survey-row">
          <h3>
            {index + 1}. {question.label}
            {question.required && " *"}
          </h3>

          {question.type === "short_text" && (
            <input placeholder="Your answer" disabled />
          )}

          {question.type === "long_text" && (
            <textarea placeholder="Your answer" disabled />
          )}

          {question.type === "single_choice" && (
            <div>
              {question.options?.map((option) => (
                <label key={option}>
                  <input type="radio" disabled />
                  {option}
                </label>
              ))}
            </div>
          )}

          {question.type === "multiple_choice" && (
            <div>
              {question.options?.map((option) => (
                <label key={option}>
                  <input type="checkbox" disabled />
                  {option}
                </label>
              ))}
            </div>
          )}

          {question.type === "rating" && (
            <p>Rating: 1 — 2 — 3 — 4 — 5</p>
          )}
        </article>
      ))}
    </section>
  ) : (
    <section className="create-form">
            <button
              type="button"
              className="secondary-button"
              onClick={closeSurveyView}
            >
              ← Back to dashboard
            </button>

            <p className="eyebrow">SURVEY DETAILS</p>
            <h1>{selectedSurvey.title}</h1>

            <p>
              Status:{" "}
              <span
                className={`status status-${selectedSurvey.status}`}
              >
                {selectedSurvey.status}
              </span>
            </p>

            <p>Questions: {surveyQuestions.length}</p>

{selectedSurvey.status !== "draft" && (
  <button
    type="button"
    className="primary-button"
    onClick={() =>
      window.location.href = `/surveys/${selectedSurvey.id}/results`
    }
  >
    View results
  </button>
)}

            {selectedSurvey.status === "draft" && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => setShowPreview(true)}
  >
    Preview survey
  </button>
)}

{selectedSurvey.status === "draft" && surveyQuestions.length > 0 && (
  <button
    type="button"
    className="primary-button"
    onClick={publishSurvey}
  >
    Publish survey
  </button>
)}

{selectedSurvey.status === "published" && (
  <button
    type="button"
    className="secondary-button"
    onClick={closeSurvey}
  >
    Close survey
  </button>
)}


            {surveyQuestions.length >= 5 && (
  <p className="error-message">
    You've reached the maximum of 5 questions for this survey.
  </p>
)}
            {selectedSurvey.status === "draft" && (
  <p>You can add questions to this draft survey.</p>
)}
 
{selectedSurvey.status === "draft" && (
  <div className="create-form">
    <h2>Add a question</h2>

    <label htmlFor="question-label">Question text</label>
    <input
      id="question-label"
      value={questionLabel}
      onChange={(event) => setQuestionLabel(event.target.value)}
      placeholder="Enter your question"
    />

    <label htmlFor="question-type">Question type</label>
    <select
      id="question-type"
      value={questionType}
      onChange={(event) =>
        setQuestionType(event.target.value as Question["type"])
      }
    >
      <option value="short_text">Short text</option>
      <option value="long_text">Long text</option>
      <option value="single_choice">Single choice</option>
      <option value="multiple_choice">Multiple choice</option>
      <option value="rating">Rating (1–5)</option>
    </select>

{(questionType === "single_choice" ||
  questionType === "multiple_choice") && (
  <div>
    <label>Answer options</label>

    {questionOptions.map((option, index) => (
      <div key={index}>
        <input
          value={option}
          placeholder={`Option ${index + 1}`}
          onChange={(event) => {
            const updatedOptions = [...questionOptions]
            updatedOptions[index] = event.target.value
            setQuestionOptions(updatedOptions)
          }}
        />

        {questionOptions.length > 2 && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setQuestionOptions(
                questionOptions.filter((_, i) => i !== index)
              )
            }}
          >
            Remove
          </button>
        )}
      </div>
    ))}

    <button
      type="button"
      className="secondary-button"
      onClick={() => setQuestionOptions([...questionOptions, ""])}
    >
      + Add option
    </button>
  </div>
)}


    <label>
      <input
        type="checkbox"
        checked={questionRequired}
        onChange={(event) => setQuestionRequired(event.target.checked)}
      />
      Required question
    </label>

    <button
  type="button"
  className="primary-button"
  onClick={addQuestion}
  disabled={addingQuestion}
>
  {addingQuestion ? "Adding..." : "Add question"}
</button>
  </div>
)}

            {builderError && (
              <p role="alert" className="error-message">
                {builderError}
              </p>
            )}

            {surveyQuestions.length === 0 ? (
              <p>
                This survey has no questions yet. We will add the
                question builder next.
              </p>
            ) : (
              <div>
                
{surveyQuestions.map((question, index) => (
  
<article key={question.id} className="survey-row">
  <div>
    <p className="eyebrow">QUESTION {index + 1}</p>
    
{editingQuestionId === question.id ? (
  <div>
    <label htmlFor={`edit-question-${question.id}`}>
      Question text
    </label>

    <input
      id={`edit-question-${question.id}`}
      value={editQuestionLabel}
      onChange={(event) =>
        setEditQuestionLabel(event.target.value)
      }
    />

    <label>
      <input
        type="checkbox"
        checked={editQuestionRequired}
        onChange={(event) =>
          setEditQuestionRequired(event.target.checked)
        }
      />
      Required question
    </label>

    <button
      type="button"
      className="primary-button"
      onClick={() => saveQuestionEdit(question)}
      disabled={savingEdit}
    >
      {savingEdit ? "Saving..." : "Save changes"}
    </button>

    <button
      type="button"
      className="secondary-button"
      onClick={() => {
        setEditingQuestionId(null)
        setBuilderError("")
      }}
    >
      Cancel
    </button>
  </div>
) : (
  <h3>{question.label}</h3>
)}


    <p>Type: {question.type.replace("_", " ")}</p>

    <span
      className={`status ${
        question.required ? "status-published" : "status-draft"
      }`}
    >
      {question.required ? "Required" : "Optional"}
    </span>

    {question.options && question.options.length > 0 && (
      <ul>
        {question.options.map((option) => (
          <li key={option}>{option}</li>
        ))}
      </ul>
    )}

{selectedSurvey.status === "draft" && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      setEditingQuestionId(question.id)
      setEditQuestionLabel(question.label)
      setEditQuestionRequired(question.required)
      setBuilderError("")
    }}
  >
    Edit question
  </button>
)}

    {selectedSurvey.status === "draft" && (
      <button
        type="button"
        className="secondary-button"
        onClick={() => deleteQuestion(question.id)}
      >
        Delete question
      </button>
    )}
  </div>
</article>
))} 

             
              </div>
            )}
          </section>
          )
        ) : (
          <>

            <section className="welcome">
              <p className="eyebrow">
                LISTEN. UNDERSTAND. IMPROVE.
              </p>

              <h1>Good questions create better workplaces.</h1>

              <p className="welcome-description">
                Create surveys, understand your people, and turn
                feedback into action.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setError("")
                  setShowCreateForm(true)
                }}
              >
                + Create a survey
              </button>
            </section>

            {showCreateForm && (
              <section className="create-form">
                <h2>Create your survey</h2>

                <label htmlFor="survey-title">Survey title</label>
                <input
                  id="survey-title"
                  value={surveyTitle}
                  onChange={(event) =>
                    setSurveyTitle(event.target.value)
                  }
                  placeholder="e.g. New Employee Onboarding"
                />
                
<textarea
  value={surveyDescription}
  onChange={(e) => setSurveyDescription(e.target.value)}
  placeholder="Survey description (optional)"
  rows={3}
/>

                {error && (
                  <p role="alert" className="error-message">
                    {error}
                  </p>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setSurveyTitle("")
                      setError("")
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleCreateSurvey}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Continue"}
                  </button>
                </div>
              </section>
            )}

            <section className="stats">
              <article className="stat-card">
                <span className="stat-icon">▤</span>
                <p>Total surveys</p>
                <h2>{surveys.length}</h2>
                <span className="stat-note">Your workspace</span>
              </article>

              <article className="stat-card">
                <span className="stat-icon">◷</span>
                <p>Drafts</p>
                <h2>
                  {surveys.filter(
                    (survey) => survey.status === "draft"
                  ).length}
                </h2>
                <span className="stat-note">Still in progress</span>
              </article>

              <article className="stat-card">
                <span className="stat-icon">✓</span>
                <p>Published</p>
                <h2>
                  {surveys.filter(
                    (survey) => survey.status === "published"
                  ).length}
                </h2>
                <span className="stat-note">
                  Collecting feedback
                </span>
              </article>
            </section>

            <section className="survey-section">
              <div>
                <h2>Your surveys</h2>
                <p>Manage your surveys from one place.</p>
              </div>

              {loadingSurveys ? (
                <p>Loading surveys...</p>
              ) : surveyError ? (
                <p role="alert" className="error-message">
                  {surveyError}
                </p>
              ) : surveys.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">▤</div>
                  <h3>Your first survey starts here</h3>
                  <p>
                    Create a survey to start collecting feedback
                    from your team.
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create your first survey
                  </button>
                </div>
              ) : (
                <>
<div className="filter-controls">
  <label htmlFor="survey-status-filter">
    Filter by status:
  </label>

  <select
    id="survey-status-filter"
    value={statusFilter}
    onChange={(event) => {
      setStatusFilter(event.target.value)
      setCurrentPage(1)
    }}
  >
    <option value="all">All surveys</option>
    <option value="draft">Draft</option>
    <option value="published">Published</option>
    <option value="closed">Closed</option>
  </select>
</div>

                <div className="survey-list">
                  {surveys.map((survey) => (
                    <article
                      className="survey-row"
                      key={survey.id}
                    >
                      <div>
  <h3>{survey.title}</h3>
  {survey.description && (
    <p>{survey.description}</p>
  )}
  <p>
    {survey.questions.length} questions
  </p>
</div>

                      
<div className="survey-actions">
  <span className={`status status-${survey.status}`}>
    {survey.status}
  </span>

  <button
    type="button"
    className="secondary-button"
    onClick={() => openSurvey(survey.id)}
  >
    Open survey
  </button>

  {survey.status === "published" && (
    <button
      type="button"
      className="secondary-button"
      onClick={() => handleShare(survey.id)}
    >
      Share
    </button>
  )}
</div>
{sharedSurveyId === survey.id && (
  <p role="status" className="share-message">
    Link copied!
  </p>
)}
                    </article>
                  ))}


                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setCurrentPage((page) => page - 1)
                      }
                    >
                      Previous
                    </button>

                    <span>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      className="secondary-button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((page) => page + 1)
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
                </>
              )}
            </section>
          
          </>
        )}
      </main>
    </div>
      }
    />
  </Routes>
)
}


export default App
