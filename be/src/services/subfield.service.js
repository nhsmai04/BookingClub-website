import SubField from "../models/sub_field.model.js";
import FieldTypeConfig from "../models/field_type_configs.model.js";
import PricingRule from "../models/pricing_rule.model.js";
import TimeSlot from "../models/time_slot.model.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const CalculatePrice = async (subField_id, playDate, startTime, endTime) => { 
    const subField = await SubField.findById(subField_id);
    if (!subField) throw new Error("Sub-field not found");

    const fieldTypeConfig = await FieldTypeConfig.findById(subField.config_id);
    if (!fieldTypeConfig) throw new Error("Field type configuration not found");

    const basePrice = fieldTypeConfig.base_price;
    let finalPrice = basePrice;

    const dayName = dayjs.tz(playDate, "YYYY-MM-DD", "Asia/Ho_Chi_Minh").format('dddd');

    // convert time → minutes
    const toMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const startTimeMinutes = toMinutes(startTime);
    const endTimeMinutes = toMinutes(endTime);

    if (endTimeMinutes <= startTimeMinutes) throw new Error("Invalid time range");

    const pricingRules = await PricingRule.find({
        config_id: subField.config_id,
        is_active: true,
        day_of_week: dayName
    }).sort({ priority: -1 });

    const matchedRule = pricingRules.find(rule => {
        const start = toMinutes(rule.start_hour);
        const end = toMinutes(rule.end_hour);
        return startTimeMinutes >= start && startTimeMinutes < end;
    });

    if (matchedRule) {
        finalPrice = basePrice * matchedRule.price_multiplier ;
    }

    finalPrice *= ((endTimeMinutes - startTimeMinutes) / 60)
    
    return finalPrice;
};
const parseTimeRange = (timeRange, playDate) => {
    const [start, end] = timeRange.split(" - ");

    return {
        start: dayjs.tz(
            `${playDate} ${start}`,
            "YYYY-MM-DD HH:mm",
            "Asia/Ho_Chi_Minh"
        ),
        end: dayjs.tz(
            `${playDate} ${end}`,
            "YYYY-MM-DD HH:mm",
            "Asia/Ho_Chi_Minh"
        )
    };
};
const getAvailableTimeSlots = async (subField_id, playDate) => {
    const config = await SubField.findById(subField_id).populate("config_id").populate("complex_id");

    if(!config) throw new Error("Sub-field not found");

    const openingHour = config.complex_id.opening_hours;
    const closingHour = config.complex_id.closing_hours;
    const slotStep = config.config_id.slot_step;

    // 2. Tạo khung mặc định dựa trên thông tin vừa lấy
    let allSlots = generateTimeSlots(openingHour, closingHour, playDate, slotStep);

    // 3. Lấy các khung đã được đặt cho ngày đó
    const bookedSlots = await TimeSlot.find({
        sub_field_id: subField_id,
        booked_date: dayjs.tz(playDate, "YYYY-MM-DD", "Asia/Ho_Chi_Minh").startOf('day').toDate(),
        status: { $in: ["Locked", "Booked", "Maintenance"] }
    });
    

    // Chuyển mảng thành Map để tìm kiếm O(1) thay vì O(n)
    const bookedMap = new Map();

    bookedSlots.forEach(s => {
        // Tách chuỗi "06:00 - 08:00" thành start="06:00" và end="08:00"
        const [startTimeStr, endTimeStr] = s.time.split(" - ");
        
        let current = dayjs.tz(`${playDate} ${startTimeStr}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");
        const end = dayjs.tz(`${playDate} ${endTimeStr}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");

        // Vòng lặp chia nhỏ khoảng thời gian lớn thành từng slot bằng đúng slotStep
        while (current.isBefore(end)) {
            const startStr = current.format("HH:mm");
            const next = current.add(slotStep, 'minute');
            const endStr = next.format("HH:mm");

            if (next.isAfter(end)) break;

            const slotKey = `${startStr} - ${endStr}`; // Tạo key chuẩn: "06:00 - 06:30"
            bookedMap.set(slotKey, s.status);          // Nạp vào Map

            current = next;
        }
    });


    // Merge & kiem tra expired
    const now = dayjs.tz();
    const isToday = dayjs.tz(playDate, "YYYY-MM-DD", "Asia/Ho_Chi_Minh").isSame(now, 'day');
    

    return allSlots.map(slot => {
        //Kiểm tra giờ quá khứ
        if(isToday)
        {
            const slotStartTime = dayjs.tz(`${playDate} ${slot.startTime}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");
            if(slotStartTime.isBefore(now)) {
                return { ...slot, status: "Expired" };
            }
        }

        // 2. Check Busy (Đã đặt/Khóa)
        const statusFromDB = bookedMap.get(slot.time);
        if (statusFromDB) {
            return { ...slot, status: statusFromDB };
        }
        return slot;
    });
}

function generateTimeSlots(openingHour, closingHour, dateString, slotStep) {
    const slots = [];
    // Khởi tạo điểm bắt đầu: "2024-03-20 08:00"
    let current = dayjs.tz(`${dateString} ${openingHour}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");
    // Điểm kết thúc: "2024-03-20 22:00"
    const end = dayjs.tz(`${dateString} ${closingHour}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh");


    while (current.isBefore(end)) {
        const startStr = current.format("HH:mm");
        const next = current.add(slotStep, 'minute'); // Cộng theo slot_step từ DB
        const endStr = next.format("HH:mm");
        
        if (next.isAfter(end)) {
            break; // Nếu vượt quá giờ đóng cửa, dừng lại
        }

        slots.push({
            time: `${startStr} - ${endStr}`,
            startTime: startStr,
            status: "Available" // Mặc định là có thể đặt
        });
        current = next; // Cập nhật thời gian hiện tại
        };
    return slots;
}

export { CalculatePrice, getAvailableTimeSlots };