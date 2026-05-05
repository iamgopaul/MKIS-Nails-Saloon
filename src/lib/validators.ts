import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[\d\s\-()\\.]{7,20}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Please select a service"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  timeSlot: z.enum(["Morning", "Afternoon", "Evening"]),
  technician: z.string().max(100).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;
