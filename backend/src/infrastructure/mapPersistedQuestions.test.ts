import { describe, expect, it } from "vitest"
import { mapPersistedOptions, mapPersistedQuestion } from "./mapPersistedQuestions"

describe("mapPersistedOptions", () => {
  it("preserves existing option IDs and text", () => {
    expect(
      mapPersistedOptions([
        { id: "opt-yes", text: "yes" },
        { id: "opt-no", text: "no" },
      ])
    ).toEqual([
      { id: "opt-yes", text: "yes" },
      { id: "opt-no", text: "no" },
    ])
  })

  it("converts legacy string options into stable id/text pairs", () => {
    expect(mapPersistedOptions(["yes", "no"])).toEqual([
      { id: "yes", text: "yes" },
      { id: "no", text: "no" },
    ])
  })

  it("uses option text as the ID when a persisted object has text but no ID", () => {
    expect(
      mapPersistedOptions([{ text: "Excellent" }, { text: "Poor" }])
    ).toEqual([
      { id: "Excellent", text: "Excellent" },
      { id: "Poor", text: "Poor" },
    ])
  })

  it("does not invent new IDs for already valid options", () => {
    const first = mapPersistedOptions([
      { id: "stable-1", text: "c" },
      { id: "stable-2", text: "cpp" },
    ])
    const second = mapPersistedOptions([
      { id: "stable-1", text: "c" },
      { id: "stable-2", text: "cpp" },
    ])

    expect(first).toEqual(second)
    expect(first?.[0].id).toBe("stable-1")
  })

  it("returns undefined when options are missing", () => {
    expect(mapPersistedOptions(undefined)).toBeUndefined()
  })

  it("rejects genuinely invalid option values", () => {
    expect(() => mapPersistedOptions([null, { id: 1 }])).toThrow(
      "Every option must have an ID and text."
    )
  })

  it("rejects a non-array options value", () => {
    expect(() => mapPersistedOptions("yes")).toThrow("Options must be an array.")
  })
})

describe("mapPersistedQuestion", () => {
  it("maps a short-text question without inventing options", () => {
    expect(
      mapPersistedQuestion({
        id: "q1",
        label: "Name",
        type: "short_text",
        required: true,
      })
    ).toEqual({
      id: "q1",
      label: "Name",
      type: "short_text",
      required: true,
      options: undefined,
    })
  })

  it("maps mixed valid and legacy choice options in order", () => {
    expect(
      mapPersistedQuestion({
        id: "q2",
        label: "Languages",
        type: "multiple_choice",
        required: false,
        helperText: "Pick all that apply",
        options: ["c", { id: "java-id", text: "java" }],
      })
    ).toEqual({
      id: "q2",
      label: "Languages",
      type: "multiple_choice",
      required: false,
      helperText: "Pick all that apply",
      options: [
        { id: "c", text: "c" },
        { id: "java-id", text: "java" },
      ],
    })
  })
})
