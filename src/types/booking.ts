export interface BookingFormData {
  name:         string;
  phone:        string;
  email:        string;
  serviceId:    string;     // UUID
  date:         string;     // YYYY-MM-DD
  startTime:    string;     // HH:MM (30-min slot)
  technicianId: string;     // UUID or "" for no preference
  notes:        string;
}
