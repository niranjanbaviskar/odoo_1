import { create } from "zustand";

type BookingState = {
    serviceId: string;
    providerId: string;
    date: string;
    time: string;
    numberOfPeople: number;
    setField: <K extends keyof BookingState>(key: K, value: BookingState[K]) => void;
    reset: () => void;
};

const initialState = {
    serviceId: "",
    providerId: "",
    date: "",
    time: "",
    numberOfPeople: 1,
};

export const useBookingStore = create<BookingState>((set) => ({
    ...initialState,
    setField: (key, value) => set({ [key]: value } as Partial<BookingState>),
    reset: () => set(initialState),
}));
