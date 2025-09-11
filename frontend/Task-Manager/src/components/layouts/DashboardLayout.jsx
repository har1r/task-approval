import React, { useContext } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  if (!user) return null; // user belum login

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        {/* Side menu desktop */}
        <aside className="hidden lg:block w-64 border-r border-gray-200/50">
          <SideMenu />
        </aside>

        {/* Konten utama */}
        <main className="flex-1 p-5 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
