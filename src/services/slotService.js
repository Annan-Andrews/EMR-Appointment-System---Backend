const toMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTimeStr = (minutes) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const overlapsWithBreak = (slotStart, slotEnd, breaks) => {
  return breaks.some((b) => {
    const breakStart = toMinutes(b.start);
    const breakEnd = toMinutes(b.end);
    return slotStart < breakEnd && slotEnd > breakStart;
  });
};

const generateSlots = ({ startTime, endTime, slotDuration, breaks = [] }) => {
  const slots = [];

  let current = toMinutes(startTime);
  const end = toMinutes(endTime);

  while (current + slotDuration <= end) {
    const slotStart = current;
    const slotEnd = current + slotDuration;

    if (!overlapsWithBreak(slotStart, slotEnd, breaks)) {
      slots.push({
        start: toTimeStr(slotStart),
        end: toTimeStr(slotEnd),
      });
    }

    current += slotDuration;
  }

  return slots;
};

module.exports = { generateSlots, toMinutes, toTimeStr };
