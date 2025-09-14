import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStageProgress from "../../components/cards/TaskStageProgress";
import { formatDateId } from "../../utils/formatDateId";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

/* ----------------------------- Helpers ----------------------------- */
const formatTitle = (str = "") =>
  String(str).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateTimeId = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
};

const stageLabel = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

const StatusChip = ({ status }) => {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
        </svg>
        Disetujui
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.3 5.71L12 12.01l-6.29-6.3L4.3 7.12 10.59 13.4l-6.3 6.3 1.42 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z" />
        </svg>
        Ditolak
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 7v5l4 2 .9-1.8-3.4-1.7V7z" />
      </svg>
      Menunggu
    </span>
  );
};

const InfoRow = ({ label, children }) => (
  <div className="grid grid-cols-[140px_1ch_1fr] gap-x-2 text-sm">
    <span className="font-medium text-slate-700">{label}</span>
    <span className="text-slate-400">:</span>
    <span className="break-words text-slate-900">{children ?? "-"}</span>
  </div>
);

/* SectionCard selalu patuh container */
const SectionCard = ({ title, children, className = "" }) => (
  <section
    className={`w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    {title ? (
      <header className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </header>
    ) : null}
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

/* --------------------------- Main Page ----------------------------- */
const TaskDetailPublic = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const response = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(id), {
          signal: ctrl.signal,
        });
        setTask(response.data || null);
      } catch (error) {
        if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
          console.error("Gagal mengambil data task:", error);
          setTask(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
    return () => abortRef.current?.abort();
  }, [id]);

  const approvals = useMemo(() => task?.approvals ?? [], [task]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Task tidak ditemukan</h2>
          <p className="text-sm text-slate-600">
            Pastikan tautan yang Anda buka benar atau hubungi admin.
          </p>
        </div>
      </div>
    );
  }

  const { mainData = {}, additionalData = [], title, createdAt, currentStage } = task;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:py-10 sm:px-4">
      {/* container */}
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-indigo-400/30 opacity-60 blur" />
                  <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-sm ring-1 ring-white/10">
                    <span className="text-[14px] font-extrabold">P</span>
                  </div>
                </div>
                <h1 className="truncate text-lg font-semibold text-slate-900">
                  Detail Permohonan — <span className="capitalize">{formatTitle(title)}</span>
                </h1>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Dibuat: <span className="font-medium text-slate-700">{formatDateId(createdAt)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2 2 7l10 5 10-5-10-5zm0 7L2 14l10 5 10-5-10-5z" />
                </svg>
                Tahap: {stageLabel[String(currentStage)?.toLowerCase()] || formatTitle(currentStage)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress + Content */}
        <section className="w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Mobile progress */}
          <div className="block border-b border-slate-200 p-4 sm:hidden">
            <TaskStageProgress task={task} orientation="horizontal" />
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr] md:items-start md:gap-6 md:p-5">
            {/* Desktop progress */}
            <aside className="hidden md:flex md:justify-end md:self-stretch md:pr-4 md:border-r md:border-slate-200">
              <div className="w-fit">
                <TaskStageProgress task={task} orientation="vertical" />
              </div>
            </aside>

            {/* Right column */}
            <div className="space-y-6">
              <SectionCard title="Data Subjek Pajak Baru">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <InfoRow label="NOPEL">{mainData.nopel}</InfoRow>
                    <InfoRow label="NOP">{mainData.nop}</InfoRow>
                    <InfoRow label="Nama Lama">{mainData.oldName}</InfoRow>
                    <InfoRow label="Alamat">{mainData.address}</InfoRow>
                  </div>
                  <div className="space-y-2">
                    <InfoRow label="Kelurahan">{mainData.village}</InfoRow>
                    <InfoRow label="Kecamatan">{mainData.subdistrict}</InfoRow>
                    <InfoRow label="Permohonan">{formatTitle(title)}</InfoRow>
                    <InfoRow label="Tanggal Dibuat">{formatDateId(createdAt)}</InfoRow>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Data Tambahan">
                {additionalData.length > 0 ? (
                  <div className="grid gap-4">
                    {additionalData.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm"
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoRow label="Nama Baru">{item.newName}</InfoRow>
                          <InfoRow label="Nomor Sertifikat">{item.certificate || "-"}</InfoRow>
                          <InfoRow label="Luas Tanah">
                            {item.landWide ? `${item.landWide} m²` : "-"}
                          </InfoRow>
                          <InfoRow label="Luas Bangunan">
                            {item.buildingWide ? `${item.buildingWide} m²` : "-"}
                          </InfoRow>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-slate-500">Tidak ada data tambahan.</p>
                )}
              </SectionCard>

              <SectionCard title="Riwayat Persetujuan" className="!p-0">
                <div className="w-full overflow-x-auto">
                  <table className="min-w-[720px] sm:min-w-[900px] text-sm">
                    <thead className="sticky top-0 z-[1] bg-slate-100 text-slate-800">
                      <tr>
                        <th className="border-b px-3 py-2 text-left">Stage</th>
                        <th className="border-b px-3 py-2 text-left">Status</th>
                        <th className="border-b px-3 py-2 text-left">Waktu</th>
                        <th className="border-b px-3 py-2 text-left">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
                      {approvals.length > 0 ? (
                        approvals.map((a, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/40">
                            <td className="border-b px-3 py-2">
                              {stageLabel[a.stage] || formatTitle(a.stage)}
                            </td>
                            <td className="border-b px-3 py-2">
                              <StatusChip status={a.status} />
                            </td>
                            <td className="border-b px-3 py-2">
                              {a.approvedAt ? formatDateTimeId(a.approvedAt) : "-"}
                            </td>
                            <td className="border-b px-3 py-2">{a.note || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center italic text-slate-500">
                            Belum ada data approval.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TaskDetailPublic;



// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { useParams } from "react-router-dom";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import TaskStageProgress from "../../components/cards/TaskStageProgress";
// import { formatDateId } from "../../utils/formatDateId";
// import LoadingSpinner from "../../components/ui/LoadingSpinner";

// // --- helpers ---
// const formatTitle = (str = "") =>
//   String(str).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// const formatDateTimeId = (value) => {
//   if (!value) return "-";
//   const date = value instanceof Date ? value : new Date(value);
//   return new Intl.DateTimeFormat("id-ID", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//     timeZone: "Asia/Jakarta",
//   }).format(date);
// };

// const stageLabel = {
//   diinput: "Diinput",
//   ditata: "Ditata",
//   diteliti: "Diteliti",
//   diarsipkan: "Diarsipkan",
//   dikirim: "Dikirim",
//   selesai: "Selesai",
// };

// // Baris info dengan kolon sejajar
// const InfoRow = ({ label, children }) => (
//   <div className="grid grid-cols-[150px_1ch_1fr] gap-x-2">
//     <span className="font-medium">{label}</span>
//     <span>:</span>
//     <span className="break-words">{children ?? "-"}</span>
//   </div>
// );

// const TaskDetailPublic = () => {
//   const { id } = useParams();
//   const [task, setTask] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const abortRef = useRef(null);

//   useEffect(() => {
//     const fetchTask = async () => {
//       setLoading(true);
//       abortRef.current?.abort();
//       const ctrl = new AbortController();
//       abortRef.current = ctrl;

//       try {
//         const response = await axiosInstance.get(
//           API_PATHS.TASK.GET_TASK_BY_ID(id),
//           { signal: ctrl.signal }
//         );
//         setTask(response.data || null);
//       } catch (error) {
//         // Biarkan "Task tidak ditemukan" tampil jika gagal selain cancel
//         if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
//           console.error("Gagal mengambil data task:", error);
//           setTask(null);
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTask();
//     return () => abortRef.current?.abort();
//   }, [id]);

//   const approvals = useMemo(() => task?.approvals ?? [], [task]);

//   // === Loading (full-screen center, konsisten dengan komponen lain)
//   if (loading) {
//     return (
//       <div className="min-h-screen grid place-items-center">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   // === Not found (kartu pesan sederhana, konsisten)
//   if (!task) {
//     return (
//       <div className="min-h-screen bg-gray-100 py-12 px-4">
//         <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
//           <h2 className="text-xl font-semibold text-black-600 mb-2">
//             Task tidak ditemukan
//           </h2>
//           <p className="text-sm text-slate-600">
//             Pastikan tautan yang Anda buka benar atau hubungi admin.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const { mainData = {}, additionalData = [], title, createdAt } = task;

//   return (
//     <div className="min-h-screen bg-gray-100 py-12 px-4">
//       <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8">
//         <h1 className="text-3xl font-bold text-center mb-10 text-slate-800">
//           Detail Permohonan
//         </h1>

//         {/* Progress Tahapan */}
//         <div className="mb-8">
//           <TaskStageProgress task={task} />
//         </div>

//         {/* Informasi Utama */}
//         <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">
//           Data Subjek Pajak Baru
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           {/* Kolom kiri */}
//           <div className="space-y-2">
//             <InfoRow label="Nopel">{mainData.nopel}</InfoRow>
//             <InfoRow label="NOP">{mainData.nop}</InfoRow>
//             <InfoRow label="Nama Lama">{mainData.oldName}</InfoRow>
//             <InfoRow label="Alamat">{mainData.address}</InfoRow>
//           </div>

//           {/* Kolom kanan */}
//           <div className="space-y-2">
//             <InfoRow label="Kelurahan">{mainData.village}</InfoRow>
//             <InfoRow label="Kecamatan">{mainData.subdistrict}</InfoRow>
//             <InfoRow label="Permohonan">{formatTitle(title)}</InfoRow>
//             <InfoRow label="Tanggal Dibuat">{formatDateId(createdAt)}</InfoRow>
//           </div>
//         </div>

//         {/* Data Tambahan */}
//         <div className="mb-10">
//           {additionalData.length > 0 ? (
//             <div className="grid gap-5">
//               {additionalData.map((item, index) => (
//                 <div
//                   key={index}
//                   className="border border-slate-300 rounded-md p-4 bg-slate-50 shadow-sm"
//                 >
//                   <div className="space-y-2">
//                     <InfoRow label="Nama Baru">{item.newName}</InfoRow>
//                     <InfoRow label="Luas Tanah">
//                       {item.landWide != null && item.landWide !== ""
//                         ? `${item.landWide} m²`
//                         : "-"}
//                     </InfoRow>
//                     <InfoRow label="Luas Bangunan">
//                       {item.buildingWide != null && item.buildingWide !== ""
//                         ? `${item.buildingWide} m²`
//                         : "-"}
//                     </InfoRow>
//                     <InfoRow label="Nomor Sertifikat">
//                       {item.certificate || "-"}
//                     </InfoRow>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="italic text-slate-500">Tidak ada data tambahan.</p>
//           )}
//         </div>

//         {/* Riwayat Approval */}
//         <div>
//           <h2 className="text-xl font-semibold mb-4 text-slate-800 border-b pb-2">
//             Riwayat Persetujuan
//           </h2>
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm text-left border">
//               <thead className="bg-slate-100">
//                 <tr>
//                   <th className="px-4 py-2 border">Stage</th>
//                   <th className="px-4 py-2 border">Status</th>
//                   <th className="px-4 py-2 border">Waktu</th>
//                   <th className="px-4 py-2 border">Catatan</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {approvals.length > 0 ? (
//                   approvals.map((a, idx) => (
//                     <tr key={idx} className="hover:bg-slate-50">
//                       <td className="px-4 py-2 border">
//                         {stageLabel[a.stage] || formatTitle(a.stage)}
//                       </td>
//                       <td className="px-4 py-2 border">
//                         {a.status === "approved" ? (
//                           <span className="text-green-600 font-medium">Disetujui</span>
//                         ) : a.status === "rejected" ? (
//                           <span className="text-red-600 font-medium">Ditolak</span>
//                         ) : (
//                           <span className="text-yellow-600 font-medium">Menunggu</span>
//                         )}
//                       </td>
//                       <td className="px-4 py-2 border">
//                         {a.approvedAt ? formatDateTimeId(a.approvedAt) : "-"}
//                       </td>
//                       <td className="px-4 py-2 border">{a.note || "-"}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={4} className="text-center italic text-slate-500 py-3">
//                       Belum ada data approval.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TaskDetailPublic;
