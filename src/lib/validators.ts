import { z } from "zod";

export const bookingSchema = z.object({
  name:           z.string().min(2, "Name must be at least 2 characters"),
  phone:          z.string().regex(/^\+?[\d\s\-()\\.]{7,20}$/, "Invalid phone number"),
  email:          z.string().email("Invalid email address"),
  serviceId:      z.string().uuid("Invalid service"),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime:      z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  technicianId:   z.string().uuid().optional().or(z.literal("")),
  notes:          z.string().max(500).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;
