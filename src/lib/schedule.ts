import { format, parse } from "date-fns";

export type TimeWindow = {
    start: string;
    end: string;
    breaks?: Array<{ start: string; end: string }>;
    active?: boolean;
};

export type WeeklyScheduleEntry = {
    day: number;
    active: boolean;
    windows: TimeWindow[];
};

export type ScheduleOverride = {
    date: string;
    blocked?: boolean;
    windows?: TimeWindow[];
};

export type ServiceSchedule = {
    timezone?: string;
    slotInterval?: number;
    bufferMinutes?: number;
    workingDays?: WeeklyScheduleEntry[];
    overrides?: ScheduleOverride[];
};

export function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function generateSlotsFromWindow(window: TimeWindow, durationMinutes: number, intervalMinutes: number) {
    const start = timeToMinutes(window.start);
    const end = timeToMinutes(window.end);
    const slots: string[] = [];
    let cursor = start;

    while (cursor + durationMinutes <= end) {
        const candidate = minutesToTime(cursor);
        const withinBreak = window.breaks?.some((breakWindow) => {
            const breakStart = timeToMinutes(breakWindow.start);
            const breakEnd = timeToMinutes(breakWindow.end);
            return cursor < breakEnd && cursor + durationMinutes > breakStart;
        });

        if (!withinBreak) {
            slots.push(candidate);
        }

        cursor += intervalMinutes;
    }

    return slots;
}

export function generateAvailability({
    date,
    schedule,
    durationMinutes,
    existingTimes,
}: {
    date: Date;
    schedule: ServiceSchedule;
    durationMinutes: number;
    existingTimes: string[];
}) {
    const day = date.getDay();
    const isoDate = format(date, "yyyy-MM-dd");
    const override = schedule.overrides?.find((entry) => entry.date === isoDate);

    if (override?.blocked) {
        return [];
    }

    const windows = override?.windows ?? schedule.workingDays?.find((entry) => entry.day === day && entry.active)?.windows ?? [];
    const interval = schedule.slotInterval ?? 15;

    return windows.flatMap((window) =>
        generateSlotsFromWindow(window, durationMinutes, interval).filter((slot) => !existingTimes.includes(slot)),
    );
}

export function dateLabel(date: string, time: string) {
    const parsed = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
    return format(parsed, "EEE, MMM d • hh:mm a");
}
