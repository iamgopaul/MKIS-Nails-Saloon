import Airtable, { type FieldSet } from "airtable";

// ─── base helpers ────────────────────────────────────────────────────────────

function base() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) return null;
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

function table(name: string) {
  return base()?.(name) ?? null;
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  order: number;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface GalleryItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  order: number;
  active: boolean;
  addedAt: string;
}

export interface ContentItem {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

// ─── team ────────────────────────────────────────────────────────────────────

export async function getTeam(): Promise<TeamMember[]> {
  const t = table("Team");
  if (!t) return [];
  try {
    const records = await t.select({ sort: [{ field: "Order", direction: "asc" }] }).all();
    return records
      .filter((r) => r.fields["Active"] !== false)
      .map((r) => ({
        id: r.id,
        name: String(r.fields["Name"] ?? ""),
        role: String(r.fields["Role"] ?? ""),
        bio: String(r.fields["Bio"] ?? ""),
        photoUrl: String(r.fields["PhotoUrl"] ?? ""),
        order: Number(r.fields["Order"] ?? 0),
        active: r.fields["Active"] !== false,
      }));
  } catch {
    return [];
  }
}

export async function getAllTeam(): Promise<TeamMember[]> {
  const t = table("Team");
  if (!t) return [];
  try {
    const records = await t.select({ sort: [{ field: "Order", direction: "asc" }] }).all();
    return records.map((r) => ({
      id: r.id,
      name: String(r.fields["Name"] ?? ""),
      role: String(r.fields["Role"] ?? ""),
      bio: String(r.fields["Bio"] ?? ""),
      photoUrl: String(r.fields["PhotoUrl"] ?? ""),
      order: Number(r.fields["Order"] ?? 0),
      active: r.fields["Active"] !== false,
    }));
  } catch {
    return [];
  }
}

export async function createTeamMember(data: Omit<TeamMember, "id">): Promise<TeamMember> {
  const t = table("Team")!;
  const r = await t.create({
    Name: data.name,
    Role: data.role,
    Bio: data.bio,
    PhotoUrl: data.photoUrl,
    Order: data.order,
    Active: data.active,
  });
  return { id: r.id, ...data };
}

export async function updateTeamMember(id: string, data: Partial<Omit<TeamMember, "id">>) {
  const t = table("Team")!;
  const fields: Partial<FieldSet> = {};
  if (data.name !== undefined)     fields["Name"]     = data.name;
  if (data.role !== undefined)     fields["Role"]     = data.role;
  if (data.bio !== undefined)      fields["Bio"]      = data.bio;
  if (data.photoUrl !== undefined) fields["PhotoUrl"] = data.photoUrl;
  if (data.order !== undefined)    fields["Order"]    = data.order;
  if (data.active !== undefined)   fields["Active"]   = data.active;
  await t.update(id, fields);
}

export async function deleteTeamMember(id: string) {
  const t = table("Team")!;
  await t.destroy(id);
}

// ─── services ────────────────────────────────────────────────────────────────

const staticServices: Omit<ServiceItem, "id" | "active">[] = [
  { name: "Classic Manicure", description: "Shape, buff, cuticle care, and your choice of polish.", duration: "45 min", price: "$25", icon: "💅", order: 1 },
  { name: "Gel Manicure",     description: "Long-lasting gel polish with UV cure for a flawless finish.", duration: "60 min", price: "$40", icon: "✨", order: 2 },
  { name: "Acrylic Full Set", description: "Full acrylic extension set in your chosen shape and length.", duration: "90 min", price: "$65", icon: "💎", order: 3 },
  { name: "Nail Art (Add-on)", description: "Custom designs per nail — flowers, gems, gradients, and more.", duration: "+30 min", price: "From $5/nail", icon: "🌸", order: 4 },
  { name: "Classic Pedicure", description: "Soak, exfoliate, shape, and polish for beautiful feet.", duration: "60 min", price: "$35", icon: "🦶", order: 5 },
  { name: "Gel Pedicure",     description: "All the classic pedi steps with a long-lasting gel finish.", duration: "75 min", price: "$50", icon: "🌟", order: 6 },
];

export async function getServices(): Promise<ServiceItem[]> {
  const t = table("Services");
  if (!t) return staticServices.map((s, i) => ({ ...s, id: `static-${i}`, active: true }));
  try {
    const records = await t.select({ sort: [{ field: "Order", direction: "asc" }] }).all();
    if (records.length === 0)
      return staticServices.map((s, i) => ({ ...s, id: `static-${i}`, active: true }));
    return records
      .filter((r) => r.fields["Active"] !== false)
      .map((r) => ({
        id: r.id,
        name: String(r.fields["Name"] ?? ""),
        description: String(r.fields["Description"] ?? ""),
        duration: String(r.fields["Duration"] ?? ""),
        price: String(r.fields["Price"] ?? ""),
        icon: String(r.fields["Icon"] ?? "💅"),
        order: Number(r.fields["Order"] ?? 0),
        active: r.fields["Active"] !== false,
      }));
  } catch {
    return staticServices.map((s, i) => ({ ...s, id: `static-${i}`, active: true }));
  }
}

export async function getAllServices(): Promise<ServiceItem[]> {
  const t = table("Services");
  if (!t) return staticServices.map((s, i) => ({ ...s, id: `static-${i}`, active: true }));
  try {
    const records = await t.select({ sort: [{ field: "Order", direction: "asc" }] }).all();
    if (records.length === 0)
      return staticServices.map((s, i) => ({ ...s, id: `static-${i}`, active: true }));
    return records.map((r) => ({
      id: r.id,
      name: String(r.fields["Name"] ?? ""),
      description: String(r.fields["Description"] ?? ""),
      duration: String(r.fields["Duration"] ?? ""),
      price: String(r.fields["Price"] ?? ""),
      icon: String(r.fields["Icon"] ?? "💅"),
      order: Number(r.fields["Order"] ?? 0),
      active: r.fields["Active"] !== false,
    }));
  } catch {
    return staticServices.map((s, i) => ({ ...s, id: `static-${i}`, active: true }));
  }
}

export async function createService(data: Omit<ServiceItem, "id">): Promise<ServiceItem> {
  const t = table("Services")!;
  const r = await t.create({
    Name: data.name, Description: data.description, Duration: data.duration,
    Price: data.price, Icon: data.icon, Order: data.order, Active: data.active,
  });
  return { id: r.id, ...data };
}

export async function updateService(id: string, data: Partial<Omit<ServiceItem, "id">>) {
  const t = table("Services")!;
  const fields: Partial<FieldSet> = {};
  if (data.name !== undefined)        fields["Name"]        = data.name;
  if (data.description !== undefined) fields["Description"] = data.description;
  if (data.duration !== undefined)    fields["Duration"]    = data.duration;
  if (data.price !== undefined)       fields["Price"]       = data.price;
  if (data.icon !== undefined)        fields["Icon"]        = data.icon;
  if (data.order !== undefined)       fields["Order"]       = data.order;
  if (data.active !== undefined)      fields["Active"]      = data.active;
  await t.update(id, fields);
}

export async function deleteService(id: string) {
  const t = table("Services")!;
  await t.destroy(id);
}

// ─── gallery ─────────────────────────────────────────────────────────────────

const staticGallery: Omit<GalleryItem, "id" | "active">[] = [
  { name: "French Ombré",    category: "Gel",       imageUrl: "/gallery/design-01.jpg", order: 1,  addedAt: "" },
  { name: "Floral Bloom",    category: "Nail Art",  imageUrl: "/gallery/design-02.jpg", order: 2,  addedAt: "" },
  { name: "Rose Gold Glam",  category: "Acrylic",   imageUrl: "/gallery/design-03.jpg", order: 3,  addedAt: "" },
  { name: "Pastel Dreams",   category: "Gel",       imageUrl: "/gallery/design-04.jpg", order: 4,  addedAt: "" },
  { name: "Marble Luxe",     category: "Gel",       imageUrl: "/gallery/design-05.jpg", order: 5,  addedAt: "" },
  { name: "Cherry Blossom",  category: "Nail Art",  imageUrl: "/gallery/design-06.jpg", order: 6,  addedAt: "" },
  { name: "Nude Elegance",   category: "Acrylic",   imageUrl: "/gallery/design-07.jpg", order: 7,  addedAt: "" },
  { name: "Glitter Storm",   category: "Gel",       imageUrl: "/gallery/design-08.jpg", order: 8,  addedAt: "" },
  { name: "Butterfly Wings", category: "Nail Art",  imageUrl: "/gallery/design-09.jpg", order: 9,  addedAt: "" },
  { name: "Classic Red",     category: "Manicure",  imageUrl: "/gallery/design-10.jpg", order: 10, addedAt: "" },
  { name: "Ocean Waves",     category: "Gel",       imageUrl: "/gallery/design-11.jpg", order: 11, addedAt: "" },
  { name: "Crystal Clear",   category: "Acrylic",   imageUrl: "/gallery/design-12.jpg", order: 12, addedAt: "" },
];

export async function getGallery(): Promise<GalleryItem[]> {
  const t = table("Gallery");
  if (!t) return staticGallery.map((g, i) => ({ ...g, id: `static-${i}`, active: true }));
  try {
    const records = await t.select({ sort: [{ field: "Order", direction: "asc" }] }).all();
    if (records.length === 0)
      return staticGallery.map((g, i) => ({ ...g, id: `static-${i}`, active: true }));
    return records
      .filter((r) => r.fields["Active"] !== false)
      .map((r) => ({
        id: r.id,
        name: String(r.fields["Name"] ?? ""),
        category: String(r.fields["Category"] ?? ""),
        imageUrl: String(r.fields["ImageUrl"] ?? ""),
        order: Number(r.fields["Order"] ?? 0),
        active: r.fields["Active"] !== false,
        addedAt: String(r.fields["AddedAt"] ?? ""),
      }));
  } catch {
    return staticGallery.map((g, i) => ({ ...g, id: `static-${i}`, active: true }));
  }
}

export async function getAllGallery(): Promise<GalleryItem[]> {
  const t = table("Gallery");
  if (!t) return staticGallery.map((g, i) => ({ ...g, id: `static-${i}`, active: true }));
  try {
    const records = await t.select({ sort: [{ field: "Order", direction: "asc" }] }).all();
    if (records.length === 0)
      return staticGallery.map((g, i) => ({ ...g, id: `static-${i}`, active: true }));
    return records.map((r) => ({
      id: r.id,
      name: String(r.fields["Name"] ?? ""),
      category: String(r.fields["Category"] ?? ""),
      imageUrl: String(r.fields["ImageUrl"] ?? ""),
      order: Number(r.fields["Order"] ?? 0),
      active: r.fields["Active"] !== false,
      addedAt: String(r.fields["AddedAt"] ?? ""),
    }));
  } catch {
    return staticGallery.map((g, i) => ({ ...g, id: `static-${i}`, active: true }));
  }
}

export async function createGalleryItem(data: Omit<GalleryItem, "id">): Promise<GalleryItem> {
  const t = table("Gallery")!;
  const r = await t.create({
    Name: data.name, Category: data.category, ImageUrl: data.imageUrl,
    Order: data.order, Active: data.active, AddedAt: data.addedAt || new Date().toISOString(),
  });
  return { id: r.id, ...data };
}

export async function updateGalleryItem(id: string, data: Partial<Omit<GalleryItem, "id">>) {
  const t = table("Gallery")!;
  const fields: Partial<FieldSet> = {};
  if (data.name !== undefined)     fields["Name"]     = data.name;
  if (data.category !== undefined) fields["Category"] = data.category;
  if (data.imageUrl !== undefined) fields["ImageUrl"] = data.imageUrl;
  if (data.order !== undefined)    fields["Order"]    = data.order;
  if (data.active !== undefined)   fields["Active"]   = data.active;
  await t.update(id, fields);
}

export async function deleteGalleryItem(id: string) {
  const t = table("Gallery")!;
  await t.destroy(id);
}

// ─── site content ─────────────────────────────────────────────────────────────

const defaultContent: Record<string, string> = {
  hero_badge:    "✨ Premium Nail Art & Care",
  hero_title:    "Where Beauty Meets Art",
  hero_subtitle: "At MKIS Nails Saloon, every set is a masterpiece. From classic elegance to bold nail art — we make your nails unforgettable.",
  about_title:   "Meet Our Team",
  about_subtitle: "Talented artists who are passionate about making you feel beautiful.",
  contact_phone:  "+1 (754) 230-2480",
  contact_email:  "mkisservicesllc@gmail.com",
  contact_address: "123 Beauty Lane, Your City",
  contact_hours:  "Mon–Sat 9 AM – 7 PM",
  business_status: "open",
  business_status_message: "",
};

export async function getContent(): Promise<Record<string, string>> {
  const t = table("SiteContent");
  if (!t) return defaultContent;
  try {
    const records = await t.select().all();
    const result = { ...defaultContent };
    for (const r of records) {
      const key = String(r.fields["Key"] ?? "");
      const val = String(r.fields["Value"] ?? "");
      if (key) result[key] = val;
    }
    return result;
  } catch {
    return defaultContent;
  }
}

export async function getAllContent(): Promise<ContentItem[]> {
  const t = table("SiteContent");
  if (!t) return Object.entries(defaultContent).map(([key, value], i) => ({
    id: `default-${i}`, key, value, updatedAt: ""
  }));
  try {
    const records = await t.select().all();
    return records.map((r) => ({
      id: r.id,
      key: String(r.fields["Key"] ?? ""),
      value: String(r.fields["Value"] ?? ""),
      updatedAt: String(r.fields["UpdatedAt"] ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function upsertContent(key: string, value: string) {
  const t = table("SiteContent");
  if (!t) return;
  try {
    const existing = await t.select({ filterByFormula: `{Key} = "${key}"` }).firstPage();
    if (existing.length > 0) {
      await t.update(existing[0].id, { Value: value, UpdatedAt: new Date().toISOString() });
    } else {
      await t.create({ Key: key, Value: value, UpdatedAt: new Date().toISOString() });
    }
  } catch {
    // silently fail
  }
}

// ─── trending / notifications ─────────────────────────────────────────────────

export interface TrendingService {
  name: string;
  count: number;
  percentage: number;
}

export async function getTrendingServices(): Promise<TrendingService[]> {
  const t = table("Bookings");
  if (!t) return [];
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const records = await t
      .select({
        fields: ["Service", "Submitted At"],
        filterByFormula: `IS_AFTER({Submitted At}, "${sevenDaysAgo}")`,
      })
      .all();

    const counts: Record<string, number> = {};
    for (const r of records) {
      const svc = String(r.fields["Service"] ?? "");
      if (svc) counts[svc] = (counts[svc] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }));
  } catch {
    return [];
  }
}

export interface LiveNotification {
  id: string;
  type: "trending" | "booking" | "new" | "milestone";
  message: string;
  icon: string;
}

export async function getLiveNotifications(): Promise<LiveNotification[]> {
  const t = table("Bookings");
  const notifications: LiveNotification[] = [];
  if (!t) return notifications;

  try {
    const oneDayAgo  = new Date(Date.now() -  1 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [recentAll, recentWeek] = await Promise.all([
      t.select({ fields: ["Service", "Submitted At"], filterByFormula: `IS_AFTER({Submitted At}, "${oneDayAgo}")` }).all(),
      t.select({ fields: ["Service", "Submitted At"], filterByFormula: `IS_AFTER({Submitted At}, "${sevenDaysAgo}")` }).all(),
    ]);

    // Today's bookings
    if (recentAll.length > 0) {
      notifications.push({
        id: "today",
        type: "booking",
        icon: "📅",
        message: `${recentAll.length} appointment${recentAll.length > 1 ? "s" : ""} booked today`,
      });
    }

    // Trending service this week
    const counts: Record<string, number> = {};
    for (const r of recentWeek) {
      const svc = String(r.fields["Service"] ?? "");
      if (svc) counts[svc] = (counts[svc] ?? 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      notifications.push({
        id: "trending",
        type: "trending",
        icon: "🔥",
        message: `${top[0]} is trending this week`,
      });
    }

    // Total bookings milestone
    const allRecords = await t.select({ fields: ["Name"] }).all();
    const total = allRecords.length;
    if (total > 0) {
      notifications.push({
        id: "milestone",
        type: "milestone",
        icon: "⭐",
        message: `${total}+ happy clients and counting`,
      });
    }
  } catch {
    // return empty on error
  }

  // Latest gallery item (from Gallery table)
  try {
    const g = table("Gallery");
    if (g) {
      const latest = await g
        .select({ sort: [{ field: "AddedAt", direction: "desc" }], maxRecords: 1, fields: ["Name", "AddedAt"] })
        .firstPage();
      if (latest.length > 0 && latest[0].fields["AddedAt"]) {
        const addedAt = new Date(String(latest[0].fields["AddedAt"]));
        const daysSince = (Date.now() - addedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 14) {
          notifications.push({
            id: "new-design",
            type: "new",
            icon: "✨",
            message: `New design added: ${latest[0].fields["Name"]}`,
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return notifications;
}
