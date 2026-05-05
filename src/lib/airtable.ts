import Airtable from "airtable";
import type { BookingInput } from "@/lib/validators";

function getTable() {
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
    .base(process.env.AIRTABLE_BASE_ID!)(process.env.AIRTABLE_TABLE_NAME!);
}

export async function saveBooking(data: BookingInput): Promise<string> {
  const table = getTable();
  const record = await table.create({
    Name: data.name,
    Phone: data.phone,
    Email: data.email,
    Service: data.service,
    "Preferred Date": data.date,
    "Time Slot": data.timeSlot,
    Technician: data.technician || "Any Available",
    Notes: data.notes,
    Status: "Pending",
    "Submitted At": new Date().toISOString(),
  });
  return record.getId();
}
