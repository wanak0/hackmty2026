import { Component, type ReactNode } from "react";

/** Keep navigation and the request input usable if a generated component is malformed. */
export class ScreenBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <div className="error-banner" role="alert">
          No pudimos mostrar esta respuesta. Vuelve al inicio o escribe tu
          solicitud de otra forma.
        </div>
      );
    return this.props.children;
  }
}
