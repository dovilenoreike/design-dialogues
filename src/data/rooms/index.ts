import { ChefHat, Sofa, Bath, Bed, LucideIcon } from "lucide-react";

export interface Room {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const rooms: Room[] = [
  { id: "kitchen", name: "Kitchen", icon: ChefHat },
  { id: "living-room", name: "Living Room", icon: Sofa },
  { id: "bedroom", name: "Bedroom", icon: Bed },
  { id: "bathroom", name: "Bathroom", icon: Bath },
];

export function getRoomById(id: string): Room | undefined {
  return rooms.find((room) => room.id === id);
}

export function getRoomByName(name: string): Room | undefined {
  return rooms.find((room) => room.name === name);
}
