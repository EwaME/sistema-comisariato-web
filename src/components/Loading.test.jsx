import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// DotLottie usa canvas/WebAssembly, que jsdom no implementa: se sustituye por un stub
vi.mock("@lottiefiles/dotlottie-react", () => ({
  DotLottieReact: ({ loop, autoplay }) => (
    <div
      data-testid="animacion"
      data-loop={String(loop)}
      data-autoplay={String(autoplay)}
    />
  ),
}));

import Loading from "./Loading";

describe("<Loading />", () => {
  it("renderiza la animación en bucle y con reproducción automática", () => {
    render(<Loading />);

    const animacion = screen.getByTestId("animacion");
    expect(animacion).toBeInTheDocument();
    expect(animacion).toHaveAttribute("data-loop", "true");
    expect(animacion).toHaveAttribute("data-autoplay", "true");
  });

  it("ocupa toda la pantalla y centra el contenido", () => {
    const { container } = render(<Loading />);

    expect(container.firstChild).toHaveStyle({
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    });
  });
});
