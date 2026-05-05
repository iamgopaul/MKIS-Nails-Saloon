export interface Service {
  name: string;
  description: string;
  duration: string;
  price: string;
  icon: string;
}

export const services: Service[] = [
  {
    name: "Classic Manicure",
    description: "Shape, buff, cuticle care, and your choice of polish.",
    duration: "45 min",
    price: "$25",
    icon: "💅",
  },
  {
    name: "Gel Manicure",
    description: "Long-lasting gel polish with UV cure for a flawless finish.",
    duration: "60 min",
    price: "$40",
    icon: "✨",
  },
  {
    name: "Acrylic Full Set",
    description: "Full acrylic extension set in your chosen shape and length.",
    duration: "90 min",
    price: "$65",
    icon: "💎",
  },
  {
    name: "Nail Art (Add-on)",
    description: "Custom designs per nail — flowers, gems, gradients, and more.",
    duration: "+30 min",
    price: "From $5/nail",
    icon: "🌸",
  },
  {
    name: "Classic Pedicure",
    description: "Soak, exfoliate, shape, and polish for beautiful feet.",
    duration: "60 min",
    price: "$35",
    icon: "🦶",
  },
  {
    name: "Gel Pedicure",
    description: "All the classic pedi steps with a long-lasting gel finish.",
    duration: "75 min",
    price: "$50",
    icon: "🌟",
  },
];
