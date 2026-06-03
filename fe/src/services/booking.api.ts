import axios from "../utils/axios.customize";

interface BookingDetailPayload {
  sub_field_id: string;
  play_date: string;
  startTime: string;
  endTime: string;
  services: string[];
}

export interface CreateBookingPayload {
  complex_id: string;
  booking_date: string;
  booking_details: BookingDetailPayload[];
}

interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user_id: string;
    complex_id: string;
  };
}

export const createBookingApi = (
  payload: CreateBookingPayload
): Promise<CreateBookingResponse> => {
  return axios.post("/api/v1/bookings", payload);
};

interface CreatePaymentResponse {
  paymentUrl: string;
}

export const createVnpayPaymentApi = (
  bookingId: string
): Promise<CreatePaymentResponse> => {
  return axios.post(`/api/v1/bookings/${bookingId}/payments/vnpay`);
};


export interface Booking {
  _id: string;

  complex_id: {
    _id: string;
    name: string;
    address: string;
    sport_type: string;
  };

  total_price: {
    $numberDecimal: string;
  };
  booking_date: string;
  qr_code_url: string;
  status: "confirmed" | "completed" | "pending" | "cancelled";

}

export type FilterOption = 'Tất cả' | 'Hoàn thành' | 'Khác';

export interface GetBookingsResponse {
  data: Booking[];
  total: number;
  totalPages: number;
}

const getBookingOfUserApi = async (
  searchKeyword: string ,
  statusFilter: FilterOption,
  page: number,
  limit: number
): Promise<GetBookingsResponse> => {
  let statusParam = 'all';
  if (statusFilter === 'Khác') statusParam = 'other';
  if (statusFilter === 'Hoàn thành') statusParam = 'completed';
  const URL_API = `/api/v1/bookings/history?keyword=${searchKeyword || ''}&status=${statusParam}&page=${page}&limit=${limit}`;

  return await axios.get<any, GetBookingsResponse>(URL_API);
};

export interface GetReviewOfBookingResponse {
    _id: string;
    rating: number;
    comment: string;
}

const getReviewOfBookingApi = async (bookingId: string): Promise<GetReviewOfBookingResponse> => {
    const URL_API = `/api/v1/bookings`;
    const response = await axios.get<any,GetReviewOfBookingResponse[]>(`${URL_API}/reviews/user-review/${bookingId}`);
    return response[0];
}

export interface NearestTimeSlot {
  play_date: string;
  start_time: string;
  end_time: string;
  start_datetime: string;
}

export interface NextBooking {
  _id: string;
  complex_id: {
    _id: string;
    name: string;
  };
  booking_date: string;
  status: string;

  nearest_time_slot: NearestTimeSlot;
}
export interface GetBookingStatsResponse {
  totalBookings: number;
  booking: NextBooking | null;
}
const getNextBookingOfUserApi = async (stateStatus: string) : Promise<GetBookingStatsResponse> => {
  const URL_API = `/api/v1/bookings/next-booking`;
  const response = await axios.get<any,GetBookingStatsResponse>(URL_API, {
    params: {
      status: stateStatus 
    }
  });
  return response;
}

export { getBookingOfUserApi, getReviewOfBookingApi, getNextBookingOfUserApi };