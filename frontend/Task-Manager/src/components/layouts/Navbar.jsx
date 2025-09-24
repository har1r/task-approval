import React, { useEffect, useState, useCallback } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";

const Navbar = () => {
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  const toggleMenu = useCallback(() => setOpenMobileMenu((v) => !v), []);
  const closeMenu = useCallback(() => setOpenMobileMenu(false), []);

  // Lock scroll ketika menu mobile dibuka + tutup dengan ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    if (openMobileMenu) {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [openMobileMenu, closeMenu]);

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Brand lockup: monogram + PETRA */}
        <div className="group inline-flex items-center gap-3">
          {/* logo */}
          <div className="relative inline-grid size-10 place-items-center">
            {/* bg hanya pada lingkaran dalam */}
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              {/* atur persentase agar pas dgn lingkaran dalam logo (coba 68–74%) */}
              <span className="rounded-full bg-indigo-600" style={{ width: '72%', height: '70%' }} />
            </span>

            <img
              src="/favicon-32x32.png"
              alt="Logo SIPETRA"
              className="size-full block object-contain select-none"
            />
          </div>

          {/* Wordmark PETRA */}
          <div className="leading-tight">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-700 bg-clip-text text-transparent text-lg font-extrabold tracking-[0.18em]">
              SIPETRA
            </div>
            <div className="text-[11px] font-medium text-slate-500/90">
              Sistem Infromasi Pelayanan Efektif Terpantau & Rapi
            </div>
          </div>
        </div>

        {/* Tombol menu mobile */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
          onClick={toggleMenu}
          aria-label={openMobileMenu ? "Tutup menu" : "Buka menu"}
          aria-controls="mobile-sidebar"
          aria-expanded={openMobileMenu}
        >
          {openMobileMenu ? (
            <HiOutlineX className="h-6 w-6" />
          ) : (
            <HiOutlineMenu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile side menu (overlay) */}
      {openMobileMenu && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={closeMenu}
            aria-hidden="true"
          />
          {/* panel */}
          <div
            id="mobile-sidebar"
            className="w-72 max-w-[80%] translate-x-0 bg-white shadow-xl ring-1 ring-slate-200 transition-transform duration-200 ease-out"
          >
            <SideMenu isMobile onClose={closeMenu} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default React.memo(Navbar);

// import React, { useState } from "react";
// import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
// import SideMenu from "./SideMenu";

// const Navbar = () => {
//   const [openMobileMenu, setOpenMobileMenu] = useState(false);

//   return (
//     <nav className="flex items-center justify-between bg-white border-b border-gray-200/50 py-4 px-6 sticky top-0 z-40">
//       <h1 className="text-lg font-medium text-black">Task Manager</h1>

//       {/* Toggle menu mobile */}
//       <button
//         className="lg:hidden text-black"
//         onClick={() => setOpenMobileMenu(!openMobileMenu)}
//       >
//         {openMobileMenu ? <HiOutlineX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
//       </button>

//       {/* Mobile side menu */}
//       {openMobileMenu && (
//         <div className="fixed inset-0 z-50 flex">
//           <div className="bg-black/30 flex-1" onClick={() => setOpenMobileMenu(false)} />
//           <div className="w-64 bg-white border-r border-gray-200/50 shadow-lg">
//             <SideMenu isMobile onClose={() => setOpenMobileMenu(false)} />
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;
