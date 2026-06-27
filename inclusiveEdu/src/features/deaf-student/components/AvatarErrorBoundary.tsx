import { Component, type ErrorInfo, type ReactNode } from "react";

type AvatarErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type AvatarErrorBoundaryState = {
  hasError: boolean;
};

export class AvatarErrorBoundary extends Component<
  AvatarErrorBoundaryProps,
  AvatarErrorBoundaryState
> {
  state: AvatarErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[InclusiveEDU][SignAvatar] No se pudo cargar el GLB; usando fallback geométrico.", {
      error,
      info,
    });
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
