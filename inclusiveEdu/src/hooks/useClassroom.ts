import { useContext } from "react";
import { ClassroomContext } from "@/context/classroomContext";

export function useClassroom() {
  const ctx = useContext(ClassroomContext);
  if (!ctx) {
    throw new Error("useClassroom debe usarse dentro de ClassroomProvider");
  }
  return ctx;
}
