export const formatDate = (date) => {
  // Ép thời gian sang múi giờ VN (GMT+7) dưới dạng các thành phần số
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Chuyển đổi date thành một object chứa các thành phần ngày giờ của GMT+7
  const parts = formatter.formatToParts(date);
  const partValues = {};
  parts.forEach((part) => {
    partValues[part.type] = part.value;
  });

  let hour = partValues.hour;
  if (hour === "24") hour = "00";

  return `${partValues.year}${partValues.month}${partValues.day}${hour}${partValues.minute}${partValues.second}`;
};