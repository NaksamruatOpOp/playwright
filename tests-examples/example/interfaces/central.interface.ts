export interface BaseParams {
  courseType?: "enrollform" | "waiting" | "learn";
  content: string;
}


export interface QuestionParams {
  answer: string
}

export interface AnswerParams extends QuestionParams {
  index: number,
  questionText: string
}