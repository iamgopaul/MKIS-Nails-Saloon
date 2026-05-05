export interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  timeSlot: "Morning" | "Afternoon" | "Evening";
  technician: string;
  notes: string;
}
