import React from "react";

const Shape = ({ children }) => {
  return (
    <div className="relative w-full h-full min-h-[600px] flex items-center">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 700 850"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* FONDO PRINCIPAL CON LAS CURVAS CORRECTAS */}
        <path
          d="M60 0C26.8629 0 0 26.8629 0 60V850H600C600 816.863 626.863 790 660 790H700V60C700 26.8629 673.137 0 640 0H60Z"
          fill="url(#paint0_linear)"
        />

        {/* EL "MORDISCO" SUPERIOR IZQUIERDO (Curva hacia afuera) */}
        <path
          d="M0 60C0 26.8629 26.8629 0 60 0H0V60Z"
          fill="#ECEEF2" /* Color del fondo de la página */
        />

        <defs>
          <linearGradient
            id="paint0_linear"
            x1="350"
            y1="0"
            x2="350"
            y2="850"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1E0B4B" />
            <stop offset="1" stopColor="#0B0118" />
          </linearGradient>
        </defs>
      </svg>

      {/* CONTENIDO */}
      <div className="relative z-10 w-full px-12 lg:px-20 py-20">
        {children}
      </div>
    </div>
  );
};

export default Shape;
