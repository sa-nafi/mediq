import { create } from 'zustand';

interface AppointmentStore {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useAppointmentStore = create<AppointmentStore>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
