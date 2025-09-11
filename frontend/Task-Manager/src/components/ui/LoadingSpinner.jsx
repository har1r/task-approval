import React from "react";

const SIZE_MAP = {
  sm: "w-5 h-5 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
  xl: "w-16 h-16 border-4",
};

const COLOR_MAP = {
  primary: "border-t-indigo-600 border-indigo-300",
  slate: "border-t-slate-600 border-slate-300",
  white: "border-t-white border-white/40",
};

const LoadingSpinner = ({
  size = "md",       // 'sm' | 'md' | 'lg' | 'xl'
  color = "primary", // 'primary' | 'slate' | 'white'
  fullscreen = false,
  label = "Loading…",
}) => {
  const sizeCls = SIZE_MAP[size] || SIZE_MAP.md;
  const colorCls = COLOR_MAP[color] || COLOR_MAP.primary;

  const containerCls = fullscreen
    ? "min-h-screen flex items-center justify-center"
    : "flex items-center justify-center py-6";

  return (
    <div className={containerCls} role="status" aria-live="polite" aria-busy="true">
      <div
        className={`rounded-full animate-spin ${sizeCls} border-solid ${colorCls}`}
        style={{ borderRightColor: "transparent", borderBottomColor: "transparent" }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

//higher-order component (HOC) di React yang dipakai untuk mencegah komponen merender ulang tanpa perlu.
//karena kalau parent component render ulang, semua child juga ikut render ulang (walau props-nya sama).
export default React.memo(LoadingSpinner);

// import React from "react";

// /**
//  * LoadingSpinner
//  * -----------------
//  * Komponen spinner loading yang bisa dipakai di seluruh aplikasi.
//  * Bisa digunakan saat: 
//  * - Memuat halaman (lazy load)
//  * - Menunggu data dari API
//  * - Saat user context masih loading
//  */

// const LoadingSpinner = ({ size = 16, color = "blue" }) => {
//   // Tailwind class size, bisa diubah sesuai props
//   const spinnerSize = `w-${size} h-${size} border-4`;

//   return (
//     <div className="flex items-center justify-center h-screen">
//       <div
//         className={`${spinnerSize} border-${color}-500 border-dashed rounded-full animate-spin`}
//       ></div>
//     </div>
//   );
// };

// export default LoadingSpinner;

