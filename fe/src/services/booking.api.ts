import axios from "../utils/axios.customize";

export interface Booking {
  _id: string;

  complex_id: {
    _id: string;
    name: string;
  };

  total_price: {
    $numberDecimal: string;
  };

  booking_date: string;

  status: "confirmed" | "completed" | "pending" | "cancelled";
}

export interface GetBookingsResponse {
  data: Booking[];
  total: number;
  totalPages: number;
}

const getBookingOfUserApi = async (
  page: number,
  limit: number
): Promise<GetBookingsResponse> => {

  const URL_API = `/api/v1/bookings/history?page=${page}&limit=${limit}`;

  return await axios.get<any, GetBookingsResponse>(URL_API);
};

export interface GetReviewOfBookingResponse {
    review_id: string;
    rating: number;
    comment: string;
}

const getReviewOfBookingApi = async (bookingId: string): Promise<GetReviewOfBookingResponse> => {
    console.log("bookingId", bookingId);
    const URL_API = `/api/v1/bookings`;
    const response = await axios.get<any,GetReviewOfBookingResponse>(`${URL_API}/reviews/user-review/${bookingId}`);
    console.log("response", response);
    return response;
}
export { getBookingOfUserApi, getReviewOfBookingApi };