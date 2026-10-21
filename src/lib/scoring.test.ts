import { describe, expect, it } from "vitest";
import { scoreAnswer } from "./scoring";

const mcq = { type: "MCQ", correctAnswer: "2", marks: 4, negative: 1 };
const num = { type: "NUMERICAL", correctAnswer: "12.5", marks: 4, negative: 0 };

describe("scoreAnswer", () => {
  it("awards marks for correct MCQ", () => expect(scoreAnswer(mcq, "2")).toBe(4));
  it("deducts for wrong MCQ", () => expect(scoreAnswer(mcq, "1")).toBe(-1));
  it("gives 0 when unanswered", () => {
    expect(scoreAnswer(mcq, null)).toBe(0);
    expect(scoreAnswer(mcq, "")).toBe(0);
  });
  it("numerical: correct, wrong, garbage", () => {
    expect(scoreAnswer(num, "12.5")).toBe(4);
    expect(scoreAnswer(num, "12.6")).toBe(0);
    expect(scoreAnswer(num, "abc")).toBe(0);
  });
});
