// src/pages/Admin/ExportSummary.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Pagination from "../../components/ui/Pagination";

import TableSkeleton from "../../components/Skeletons/TableSkeleton";

/* ----------------------------- Helpers ----------------------------- */
const titleCase = (s = "") =>
  String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const buildExportNumber = (num, year = new Date().getFullYear()) =>
  num ? `973/${num}-UPT.PD.WIL.IV/${year}` : "-";
const onlyDigits = (v) => String(v || "").replace(/[^\d]/g, "");

const EmptyState = ({ children = "Tidak ada data" }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
    {children}
  </div>
);

/* --------------------------- Main Component ------------------------ */
const ExportSummary = () => {
  // server pagination & data (per-task)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // server will confirm; default 5
  const [totalTasks, setTotalTasks] = useState(0);
  const [tasks, setTasks] = useState([]);

  // loading daftar (list) & loading khusus filter
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);

  // server-side filter: pisahkan draft vs applied
  const [exportNumber, setExportNumber] = useState("");             // draft (input)
  const [appliedExportNumber, setAppliedExportNumber] = useState(""); // dipakai fetch

  const ctrlRef = useRef(null);
  const totalPages = Math.max(
    1,
    Math.ceil(Number(totalTasks || 0) / Number(limit || 5))
  );

  const fetchTasks = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setLoading(true);
    try {
      const params = { page }; // limit dipakukan 5 oleh server
      const q = onlyDigits(appliedExportNumber);
      if (q) params.exportNumber = q;

      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_SUMMARY, {
        params,
        signal: ctrl.signal,
      });

      const data = res?.data || {};
      setPage(Number(data.page || page));
      setLimit(Number(data.limit || 5)); // server returns 5
      setTotalTasks(Number(data.totalTasks || 0));
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        toast.error(
          err?.response?.data?.message || "Gagal mengambil data pengantar."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [page, appliedExportNumber]);

  useEffect(() => {
    fetchTasks();
    return () => ctrlRef.current?.abort();
  }, [fetchTasks]);

  // Matikan flag filtering ketika fetch selesai
  useEffect(() => {
    if (!loading && filtering) setFiltering(false);
  }, [loading, filtering]);

  // form handlers: kirim filter ke server hanya saat submit/reset
  const onSubmit = (e) => {
    e.preventDefault();
    setFiltering(true);
    setPage(1); // reset halaman saat filter berubah
    setAppliedExportNumber(onlyDigits(exportNumber));
    // fetch akan dipicu oleh useEffect (dependency appliedExportNumber/page)
  };

  const onReset = () => {
    setFiltering(true);
    setExportNumber("");
    setAppliedExportNumber("");
    setPage(1);
    // fetch akan dipicu oleh useEffect
  };

  const handlePageChange = (next) => {
    if (loading) return;
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (clamped !== page) setPage(clamped); // ini memicu loading list, bukan filtering
  };

  // nomor baris global
  const startNo = useMemo(() => (page - 1) * limit, [page, limit]);

  return (
    <DashboardLayout activeMenu="Riwayat Pengantar">
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
          {/* Header */}
          <header className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                  Riwayat Pengantar PDF
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Daftar pengantar yang telah diterbitkan.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchTasks}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                title="Muat ulang"
              >
                Muat Ulang
              </button>
            </div>
          </header>

          {/* Filter Bar (server-side) */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur p-3 md:p-4">
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
            >
              <fieldset disabled={filtering} className="contents">
                <div className="flex-1 min-w-[240px]">
                  <label
                    htmlFor="exportNumber"
                    className="mb-1 block text-sm font-medium text-slate-800"
                  >
                    Cari nomor pengantar
                  </label>
                  <input
                    id="exportNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 123"
                    value={exportNumber}
                    onChange={(e) => setExportNumber(onlyDigits(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {filtering ? "Memfilter…" : "Filter"}
                  </button>
                  <button
                    type="button"
                    onClick={onReset}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={filtering}
                  >
                    Reset
                  </button>
                </div>
              </fieldset>
            </form>
          </section>

          {/* Table (per task) */}
          <Suspense fallback={<TableSkeleton number={10} />}>
            <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {loading && (
                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              {tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100/80 backdrop-blur text-slate-800">
                      <tr>
                        <th className="border-b px-3 py-2 text-left font-semibold">No</th>
                        <th className="border-b px-3 py-2 text-left font-semibold">NOPEL</th>
                        <th className="border-b px-3 py-2 text-left font-semibold">NOP</th>
                        <th className="border-b px-3 py-2 text-left font-semibold">Nama Pemohon</th>
                        <th className="border-b px-3 py-2 text-left font-semibold">Jenis</th>
                        <th className="border-b px-3 py-2 text-left font-semibold">No. Pengantar</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
                      {tasks.map((t, idx) => {
                        const main = t?.mainData || {};
                        const name = t?.additionalData?.[0]?.newName || "-";
                        return (
                          <tr key={t._id} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="border-b px-3 py-2">{startNo + idx + 1}</td>
                            <td className="border-b px-3 py-2">{main?.nopel || "-"}</td>
                            <td className="border-b px-3 py-2">{main?.nop || "-"}</td>
                            <td className="border-b px-3 py-2">
                              <span className="line-clamp-1" title={name}>{name}</span>
                            </td>
                            <td className="border-b px-3 py-2 capitalize">
                              <span className="line-clamp-1">{titleCase(t?.title || "")}</span>
                            </td>
                            <td className="border-b px-3 py-2 font-medium">
                              {buildExportNumber(t?.exportNumber, t?.exportYear)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState>Belum ada data yang bisa ditampilkan.</EmptyState>
              )}
            </section>

            {/* Pagination (server-driven) */}
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disabled={loading}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportSummary;

// // src/pages/Admin/ExportSummary.jsx
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   Suspense,
// } from "react";
// import { toast } from "react-toastify";

// import DashboardLayout from "../../components/layouts/DashboardLayout";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import Pagination from "../../components/ui/Pagination";

// import TableSkeleton from "../../components/Skeletons/TableSkeleton";

// /* ----------------------------- Helpers ----------------------------- */
// const titleCase = (s = "") =>
//   String(s)
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (c) => c.toUpperCase());
// const buildExportNumber = (num, year = new Date().getFullYear()) =>
//   num ? `973/${num}-UPT.PD.WIL.IV/${year}` : "-";
// const onlyDigits = (v) => String(v || "").replace(/[^\d]/g, "");

// const EmptyState = ({ children = "Tidak ada data" }) => (
//   <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
//     {children}
//   </div>
// );

// /* --------------------------- Main Component ------------------------ */
// const ExportSummary = () => {
//   // server pagination & data (per-task)
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(10); // server will confirm; default 5
//   const [totalTasks, setTotalTasks] = useState(0);
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // server-side filter
//   const [exportNumber, setExportNumber] = useState("");

//   const ctrlRef = useRef(null);
//   const totalPages = Math.max(
//     1,
//     Math.ceil(Number(totalTasks || 0) / Number(limit || 5))
//   );

//   const fetchTasks = useCallback(async () => {
//     ctrlRef.current?.abort();
//     const ctrl = new AbortController();
//     ctrlRef.current = ctrl;

//     setLoading(true);
//     try {
//       const params = { page }; // limit dipakukan 5 oleh server
//       const q = onlyDigits(exportNumber);
//       if (q) params.exportNumber = q;

//       // ⬇️ GANTI ke path endpoint barumu
//       const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_SUMMARY, {
//         params,
//         signal: ctrl.signal,
//       });

//       const data = res?.data || {};
//       setPage(Number(data.page || page));
//       setLimit(Number(data.limit || 5)); // server returns 5
//       setTotalTasks(Number(data.totalTasks || 0));
//       setTasks(Array.isArray(data.tasks) ? data.tasks : []);
//     } catch (err) {
//       if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
//         toast.error(
//           err?.response?.data?.message || "Gagal mengambil data pengantar."
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [page, exportNumber]);

//   useEffect(() => {
//     fetchTasks();
//     return () => ctrlRef.current?.abort();
//   }, [fetchTasks]);

//   // form handlers: kirim filter ke server
//   const onSubmit = (e) => {
//     e.preventDefault();
//     setPage(1); // reset halaman saat filter berubah
//     setExportNumber((v) => onlyDigits(v));
//   };
//   const onReset = () => {
//     setExportNumber("");
//     setPage(1);
//   };

//   const handlePageChange = (next) => {
//     if (loading) return;
//     const clamped = Math.max(1, Math.min(totalPages, next));
//     if (clamped !== page) setPage(clamped);
//   };

//   // nomor baris global
//   const startNo = useMemo(() => (page - 1) * limit, [page, limit]);

//   return (
//     <DashboardLayout activeMenu="Riwayat Pengantar">
//       <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
//         <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
//           {/* Header */}
//           <header className="mb-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
//                   Riwayat Pengantar PDF
//                 </h1>
//                 <p className="mt-1 text-sm text-slate-600">
//                   Daftar pengantar yang telah diterbitkan.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={fetchTasks}
//                 disabled={loading}
//                 className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
//                 title="Muat ulang"
//               >
//                 Muat Ulang
//               </button>
//             </div>
//           </header>

//           {/* Filter Bar (server-side) */}
//           <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur p-3 md:p-4">
//             <form
//               onSubmit={onSubmit}
//               className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
//             >
//               <div className="flex-1 min-w-[240px]">
//                 <label
//                   htmlFor="exportNumber"
//                   className="mb-1 block text-sm font-medium text-slate-800"
//                 >
//                   Cari nomor pengantar
//                 </label>
//                 <input
//                   id="exportNumber"
//                   type="text"
//                   inputMode="numeric"
//                   placeholder="Contoh: 123"
//                   value={exportNumber}
//                   onChange={(e) => setExportNumber(onlyDigits(e.target.value))}
//                   className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
//                 />
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   type="submit"
//                   className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
//                 >
//                   Filter
//                 </button>
//                 <button
//                   type="button"
//                   onClick={onReset}
//                   className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
//                 >
//                   Reset
//                 </button>
//               </div>
//             </form>
//           </section>

//           {/* Table (per task) */}
//           <Suspense fallback={<TableSkeleton rows={10} cols={6}/>}>
//             <section className="relative mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
//               {loading && (
//                 <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-[1px]">
//                   <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
//                 </div>
//               )}
//               {tasks > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full text-sm">
//                     <thead className="sticky top-0 bg-slate-100/80 backdrop-blur text-slate-800">
//                       <tr>
//                         <th className="border-b px-3 py-2 text-left font-semibold">
//                           No
//                         </th>
//                         <th className="border-b px-3 py-2 text-left font-semibold">
//                           NOPEL
//                         </th>
//                         <th className="border-b px-3 py-2 text-left font-semibold">
//                           NOP
//                         </th>
//                         <th className="border-b px-3 py-2 text-left font-semibold">
//                           Nama Pemohon
//                         </th>
//                         <th className="border-b px-3 py-2 text-left font-semibold">
//                           Jenis
//                         </th>
//                         <th className="border-b px-3 py-2 text-left font-semibold">
//                           No. Pengantar
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
//                       {tasks.map((t, idx) => {
//                         const main = t?.mainData || {};
//                         const name = t?.additionalData?.[0]?.newName || "-";
//                         return (
//                           <tr
//                             key={t._id}
//                             className="hover:bg-indigo-50/40 transition-colors"
//                           >
//                             <td className="border-b px-3 py-2">
//                               {startNo + idx + 1}
//                             </td>
//                             <td className="border-b px-3 py-2">
//                               {main?.nopel || "-"}
//                             </td>
//                             <td className="border-b px-3 py-2">
//                               {main?.nop || "-"}
//                             </td>
//                             <td className="border-b px-3 py-2">
//                               <span className="line-clamp-1" title={name}>
//                                 {name}
//                               </span>
//                             </td>
//                             <td className="border-b px-3 py-2 capitalize">
//                               <span className="line-clamp-1">
//                                 {titleCase(t?.title || "")}
//                               </span>
//                             </td>
//                             <td className="border-b px-3 py-2 font-medium">
//                               {buildExportNumber(t?.exportNumber, t?.exportYear)}
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="py-8 text-center text-sm text-slate-500">
//                   Belum ada data yang bisa dtampilkan.
//                 </div>
//               )}
//             </section>
//             {/* Pagination (server-driven) */}
//             <div className="mt-4">
//               <Pagination
//                 page={page}
//                 totalPages={totalPages}
//                 onPageChange={handlePageChange}
//                 disabled={loading}
//               />
//             </div>
//           </Suspense>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default ExportSummary;
