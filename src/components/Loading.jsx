import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loadingAnimation from "../assets/loading.lottie";
const Loading = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
      }}
    >
      <DotLottieReact
        src={loadingAnimation}
        loop
        autoplay
        style={{ width: "300px", height: "300px" }}
      />
    </div>
  );
};

export default Loading;
