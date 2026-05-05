import { describe, it, expect } from "vitest";
import {
  dailySlots,
  isWorkingDay,
  slotsForBooking,
  endTimeFor,
  timeToMinutes,
  minutesToTime,
} from "@/lib/booking";

describe("booking time helpers", () => {
  it("considers Sunday closed", () => {
    expect(isWorkingDay("2026-05-03")).toBe(false); // Sunday
    expect(isWorkingDay("2026-05-04")).toBe(true);  // Monday
  });

  it("returns 30-min slots within business hours", () => {
    const slots = dailySlots("2026-05-04"); // Monday 9–19
    expect(slots[0]).toBe("09:00");
    expect(slots[slots.length - 1]).toBe("18:30");
    expect(slots).toHaveLength(20);
  });

  it("returns no slots on closed days", () => {
    expect(dailySlots("2026-05-03")).toEqual([]);
  });

  it("computes the slot footprint of a booking with buffer", () => {
    expect(slotsForBooking("10:00", 60, 0)).toEqual(["10:00", "10:30"]);
    expect(slotsForBooking("10:00", 60, 15)).toEqual(["10:00", "10:30", "11:00"]);
  });

  it("computes end time from duration", () => {
    expect(endTimeFor("09:00", 90)).toBe("10:30");
  });

  it("round-trips times through minutes", () => {
    expect(minutesToTime(timeToMinutes("13:45"))).toBe("13:45");
  });
});
