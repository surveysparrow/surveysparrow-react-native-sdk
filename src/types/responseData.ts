export interface IResponseData {
  response: Response[];
  type: string;
}

export interface Response {
  answer: number;
  id: number;
  question: string;
}
