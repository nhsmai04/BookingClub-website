import axios from "../utils/axios.customize";

// Lấy TimeSlot cho BookingCard
interface TimeSlot {
    time: string;
    startTime: string;
    status: string;
}

export interface ArrayTimeSlot {
    timeSlots: TimeSlot[];
}

export interface TimeSlotPayload {
    playDate: string;
    subfield_id: string;
}

export const getTimeSlot = async (
    payload: TimeSlotPayload
): Promise<ArrayTimeSlot> => {
    const { playDate, subfield_id } = payload;

    const response = await axios.get(
        `/api/v1/subfield/${subfield_id}/available-time-slots`,
        {
            params: { playDate }
        }
    );
    return response.data || response; 
};

// Lấy Chi tiết sân cho CourtInfo
export interface PricingRule {
    rule_name: string;
    day_of_week: string[];
    start_hour: string;
    end_hour: string;
    price_multiplier: number;
    priority: number;
}

export interface SubFieldDetail {
    id: string;
    name: string;
    sportType: string;
    basePrice: number;
    minDuration: number;
    slotStep: number;
    pricingRules: PricingRule[];
    status: string;
}

export interface ReviewItem {
  review_id: number; 
  userName: string;
  avatarUrl?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SportComplexDetail {
    id: string;
    name: string;
    address: string;
    images: string[];
    ownerName: string;
    openTime: string;
    closeTime: string;
    subFields: SubFieldDetail[];
    rating: number;
    totalReviews: number;
    priceRange: string;
    reviews: ReviewItem[];
    map_url: string;
}

export const getSportDetail = async (slug: string): Promise<SportComplexDetail> => {
    const response = await axios.get(`/api/v1/sportcomplex/detail/${slug}`);
    const raw = response.data || response; 

    if (!raw) {
        throw new Error("Không tìm thấy dữ liệu từ server");
    }
    // --- Logic Tinh Chỉnh ---
    const cleanSubFields = raw.subFields.map((field: any) => {
        const config = raw.fieldTypeConfigs?.find((c: any) => 
            String(c._id) === String(field.config_id)
        ) || {};

        return {
            id: field._id,
            name: field.field_name,
            field_name: field.field_name,
            sportType: config.field_type || field.field_type,
            field_type: config.field_type || field.field_type,
            basePrice: config.base_price || 0,
            minDuration: config.min_duration || 60,
            slotStep: config.slot_step || 30,
            pricingRules: (config.pricingRules || []).map((rule: any) => ({
                ...rule,
                priority: rule.priority ?? 1
            })),
            status: field.status
        };
    });

    let priceRange = "Chưa cập nhật";
    if (cleanSubFields.length > 0) {
        // Lấy tất cả basePrice ra một mảng số
        const prices = cleanSubFields.map((f: any) => f.basePrice).filter((p: number) => p > 0);

        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            // Nếu giá min và max bằng nhau thì chỉ hiện 1 con số, ngược lại hiện khoảng
            priceRange = minPrice === maxPrice
                ? `${minPrice.toLocaleString('vi-VN')}đ`
                : `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
        }
    }

    const cleanReviews = raw.reviews?.map((rev: any) => ({
        review_id: isNaN(Number(rev._id)) ? Math.random() : Number(rev._id),
        userName: rev.user_id?.name || "Người dùng",
        avatarUrl: rev.user_id?.avatar || "",
        rating: rev.rating || 0,
        comment: rev.comment || "",
        created_at: rev.created_at || ""
    })) || [];

    return {
        id: raw._id,
        name: raw.name,
        address: raw.address,
        images: raw.fieldImages?.map((img: any) => img.image_url) || [],
        ownerName: raw.owner?.name || "Chủ sân",
        openTime: raw.opening_hours,
        closeTime: raw.closing_hours,
        subFields: cleanSubFields,
        priceRange: priceRange,
        reviews: cleanReviews,
        rating: raw.rating || 0,
        totalReviews: raw.totalReviews || 0,
        map_url: raw.map_url || ""
    };
};
