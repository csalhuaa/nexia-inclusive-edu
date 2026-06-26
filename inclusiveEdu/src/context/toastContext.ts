import { createContext } from "react";

export type ToastType = "info" | "success" | "error";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

export type ToastContextValue = {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
