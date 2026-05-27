import SubField from "../models/sub_field.model.js";
import FieldTypeConfig from "../models/field_type_configs.model.js";
import PricingRule from "../models/pricing_rule.model.js";
import TimeSlot from "../models/time_slot.model.js";
import dayjs from "dayjs";

const CalculatePrice = async (subField_id, playDate, startTime, endTime) => { 
    const subField = await SubField.findById(subField_id);
    if (!subField) throw new Error("Sub-field not found");

    const fieldTypeConfig = await FieldTypeConfig.findById(subField.config_id);
    if (!fieldTypeConfig) throw new Error("Field type configuration not found");

    const basePrice = fieldTypeConfig.base_price;
    let finalPrice = basePrice;

    const dayName = dayjs(playDate).format('dddd');

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
        start: dayjs(
            `${playDate} ${start}`,
            "YYYY-MM-DD HH:mm"
        ),
        end: dayjs(
            `${playDate} ${end}`,
            "YYYY-MM-DD HH:mm"
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

    // console.log("All Slots:", allSlots);

    // console.log(dayjs(playDate).startOf('day').toDate());
    // 3. Lấy các khung đã được đặt cho ngày đó
    const startOfDay = dayjs(playDate)
        .startOf("day")
        .toDate();

    const endOfDay = dayjs(playDate)
        .endOf("day")
        .toDate();

    const bookedSlots = await TimeSlot.find({
        sub_field_id: subField_id,
        booked_date: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: {
            $in: ["Locked", "Booked", "Maintenance"]
        }
    });

    // console.log("Booked Slots from DB:", bookedSlots);

    // Chuyển mảng thành Map để tìm kiếm O(1) thay vì O(n)
    const bookedMap = new Map(bookedSlots.map(s => [s.time, s.status]));

    // console.log("Booked Map:", bookedMap);
    // console.log(
    //     "queryDate:",
    //     dayjs(playDate)
    //         .startOf('day')
    //         .toDate()
    // );
    // console.log("playDate", playDate);
    // console.log("subField_id", subField_id);

    // Merge & kiem tra expired
    const now = dayjs();
    const isToday = dayjs(playDate).isSame(now, 'day');
    

    return allSlots.map(slot => {
        //Kiểm tra giờ quá khứ
        if(isToday)
        {
            const slotStartTime = dayjs(`${playDate} ${slot.startTime}`, "YYYY-MM-DD HH:mm");
            if(slotStartTime.isBefore(now)) {
                return { ...slot, status: "Expired" };
            }
        }

        // 2. Check Busy (Đã đặt/Khóa)
        const slotRange = parseTimeRange(
            slot.time,
            playDate
        );

        const matchedBooking = bookedSlots.find(
            bookedSlot => {

                const bookedRange =
                    parseTimeRange(
                        bookedSlot.time,
                        playDate
                    );

                // overlap condition
                return (
                    slotRange.start.isBefore(bookedRange.end) &&
                    slotRange.end.isAfter(bookedRange.start)
                );
            }
        );

        if (matchedBooking) {
            return {
                ...slot,
                status: matchedBooking.status
            };
        }

        return slot;
    });
}

function generateTimeSlots(openingHour, closingHour, dateString, slotStep) {
    const slots = [];
    // Khởi tạo điểm bắt đầu: "2024-03-20 08:00"
    let current = dayjs(`${dateString} ${openingHour}`, "YYYY-MM-DD HH:mm");
    // Điểm kết thúc: "2024-03-20 22:00"
    const end = dayjs(`${dateString} ${closingHour}`, "YYYY-MM-DD HH:mm");


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