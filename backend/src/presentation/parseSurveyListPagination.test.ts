import { describe, expect, it } from "vitest"
import { parseSurveyListPagination } from "./parseSurveyListPagination"

describe("parseSurveyListPagination", () => {
  it("defaults to page 1 and limit 5", () => {
    expect(parseSurveyListPagination({})).toEqual({ page: 1, limit: 5 })
  })

  it("uses requested page sizes of 5, 25, and 100", () => {
    expect(parseSurveyListPagination({ page: "1", limit: "5" })).toEqual({
      page: 1,
      limit: 5,
    })
    expect(parseSurveyListPagination({ page: "2", limit: "25" })).toEqual({
      page: 2,
      limit: 25,
    })
    expect(parseSurveyListPagination({ page: "3", limit: "100" })).toEqual({
      page: 3,
      limit: 100,
    })
  })

  it("clamps invalid or over-limit values instead of throwing", () => {
    expect(parseSurveyListPagination({ page: "0", limit: "-3" })).toEqual({
      page: 1,
      limit: 1,
    })
    expect(parseSurveyListPagination({ page: "abc", limit: "999" })).toEqual({
      page: 1,
      limit: 100,
    })
  })
})
