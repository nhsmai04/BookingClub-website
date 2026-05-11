import axios from "../utils/axios.customize";

const URL_API = "/api/v1/reviews";

export interface CreateReviewPayload {
  booking_id: string;
  rating: number;
  comment: string;
}

const createReviewApi = (payload: CreateReviewPayload) => {
    return  axios.post(URL_API, payload);
}



export { createReviewApi };