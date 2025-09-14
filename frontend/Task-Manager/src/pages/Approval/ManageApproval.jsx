import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useId,
  useRef,
  memo,
} from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-toastify";
import { formatDateId } from "../../utils/formatDateId";

// Row info ringkas & responsif
const InfoRow = memo(({ label, value }) => (
  <div className="sm:grid sm:grid-cols-[18ch_1ch_minmax(0,1fr)] sm:gap-x-2 leading-6">
    {/* Label (di atas pada mobile) */}
    <span className="block text-[13px] sm:text-sm font-medium text-slate-700">
      {label}
    </span>

    {/* Titik dua disembunyikan di mobile */}
    <span className="hidden sm:block text-slate-700">:</span>

    {/* Nilai */}
    <span className="block text-[13px] sm:text-sm text-slate-900 break-words min-w-0 sm:min-w-[8rem] mt-0.5 sm:mt-0">
      {value ?? "-"}
    </span>
  </div>
));
InfoRow.displayName = "InfoRow";

// Tombol aksi (approve/reject)
const ActionButton = memo(
  ({ action, loadingAction, onClick, children, color = "green" }) => {
    const isLoading = loadingAction === action;
    const base =
      "px-4 py-2 rounded text-white disabled:opacity-50 focus:outline-none focus-visible:ring w-full sm:w-auto";
    const colorCls =
      color === "red"
        ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400"
        : "bg-green-600 hover:bg-green-700 focus-visible:ring-green-400";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`${base} ${colorCls}`}
      >
        {isLoading
          ? action === "approved"
            ? "Menyetujui..."
            : "Menolak..."
          : children}
      </button>
    );
  }
);
ActionButton.displayName = "ActionButton";

const ManageApproval = ({ taskId, onSuccess, onClose }) => {
  const [note, setNote] = useState("");
  const [loadingAction, setLoadingAction] = useState(""); // "approved" | "rejected" | ""
  const [task, setTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(true);

  const noteId = useId();
  const abortRef = useRef(null);

  const stageLabel = {
    diinput: "Diinput",
    ditata: "Ditata",
    diteliti: "Diteliti",
    diarsipkan: "Diarsipkan",
    dikirim: "Dikirim",
    selesai: "Selesai",
  };

  const formatTitle = useCallback(
    (t) =>
      String(t || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    []
  );

  // Fetch task detail (abort-safe)
  useEffect(() => {
    if (!taskId) return;

    const ctrl = new AbortController();
    abortRef.current?.abort(); // batalkan request sebelumnya
    abortRef.current = ctrl;

    const run = async () => {
      try {
        setLoadingTask(true);
        const res = await axiosInstance.get(
          API_PATHS.TASK.GET_TASK_BY_ID(taskId),
          { signal: ctrl.signal }
        );
        setTask(res.data);
      } catch (err) {
        // Jika dibatalkan, abaikan
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED")
          return;
        toast.error(
          err?.response?.data?.message || "Gagal memuat data permohonan"
        );
        onClose?.();
      } finally {
        setLoadingTask(false);
      }
    };

    run();
    return () => ctrl.abort();
  }, [taskId, onClose]);

  const createdAt = useMemo(
    () => (task?.createdAt ? formatDateId(task.createdAt) : "-"),
    [task?.createdAt]
  );

  const handleApproval = useCallback(
    async (action) => {
      if (!["approved", "rejected"].includes(action)) {
        toast.error("Tindakan tidak valid");
        return;
      }
      if (loadingAction) return; // cegah double click

      setLoadingAction(action);
      try {
        const res = await axiosInstance.patch(
          API_PATHS.TASK.APPROVE_TASK(taskId),
          { action, note }
        );
        toast.success(res?.data?.message || `Task berhasil di-${action}`);
        onSuccess?.();
        onClose?.();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Gagal memperbarui approval"
        );
      } finally {
        setLoadingAction("");
      }
    },
    [loadingAction, note, onClose, onSuccess, taskId]
  );

  if (loadingTask) {
    // Skeleton ringkas & responsif
    return (
      <div className="space-y-5 p-1 sm:p-0">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-[70%] max-w-xs bg-slate-200 rounded animate-pulse"
            />
          ))}
        </div>
        <div>
          <div className="h-4 w-28 bg-slate-200 rounded mb-2 animate-pulse" />
          <div className="h-24 sm:h-20 w-full bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-full sm:w-28 bg-slate-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!task) return null;

  const stageText =
    (task.currentStage && String(task.currentStage).toLowerCase()) || "";
  const stageNice = stageLabel[stageText] || formatTitle(task.currentStage);

  return (
    <div className="space-y-5">
      <h3
        id="approval-title"
        className="text-base sm:text-lg font-semibold text-slate-800"
      >
        Approval Permohonan
      </h3>

      {/* Informasi Task */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 sm:p-5 text-sm space-y-2 sm:space-y-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InfoRow label="Nopel" value={task.mainData?.nopel ?? "-"} />
          <InfoRow label="NOP" value={task.mainData?.nop ?? "-"} />
          <InfoRow
            label="Nama"
            value={task.additionalData?.[0]?.newName ?? "-"}
          />
          <InfoRow
            label="Jenis Permohonan"
            value={formatTitle(task.title)}
          />
          <InfoRow label="Tanggal Diajukan" value={createdAt} />
          <InfoRow label="Tahapan Saat Ini" value={stageNice} />
        </div>
      </div>

      {/* Catatan */}
      <div>
        <label
          htmlFor={noteId}
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Catatan (Opsional)
        </label>
        <textarea
          id={noteId}
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 text-[13px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-24"
          placeholder="Masukkan catatan jika diperlukan..."
        />
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring w-full sm:w-auto"
        >
          Batal
        </button>
        <ActionButton
          action="rejected"
          loadingAction={loadingAction}
          onClick={() => handleApproval("rejected")}
          color="red"
        >
          Tolak
        </ActionButton>
        <ActionButton
          action="approved"
          loadingAction={loadingAction}
          onClick={() => handleApproval("approved")}
          color="green"
        >
          Setujui
        </ActionButton>
      </div>
    </div>
  );
};

export default ManageApproval;

// import React, { useState, useEffect, useMemo, useCallback, useId, useRef, memo } from "react";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import { toast } from "react-toastify";
// import { formatDateId } from "../../utils/formatDateId";

// // Row info ringkas
// const InfoRow = memo(({ label, value }) => (
//   <div className="grid grid-cols-[18ch_1ch_1fr] gap-x-2 leading-6">
//     <span className="font-medium text-slate-700 text-left">{label}</span>
//     <span className="text-slate-700">:</span>
//     <span className="text-slate-900 break-words">{value || "-"}</span>
//   </div>
// ));

// // Tombol aksi (approve/reject)
// const ActionButton = memo(({ action, loadingAction, onClick, children, color = "green" }) => {
//   const isLoading = loadingAction === action;
//   const base =
//     "px-4 py-2 rounded text-white disabled:opacity-50 focus:outline-none focus-visible:ring";
//   const colorCls = color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700";
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={isLoading}
//       aria-busy={isLoading}
//       className={`${base} ${colorCls}`}
//     >
//       {isLoading ? (action === "approved" ? "Menyetujui..." : "Menolak...") : children}
//     </button>
//   );
// });

// const ManageApproval = ({ taskId, onSuccess, onClose }) => {
//   const [note, setNote] = useState("");
//   const [loadingAction, setLoadingAction] = useState(""); // "approved" | "rejected" | ""
//   const [task, setTask] = useState(null);
//   const [loadingTask, setLoadingTask] = useState(true);

//   const noteId = useId();
//   const abortRef = useRef(null);

//   const formatTitle = useCallback(
//     (t) =>
//       String(t || "")
//         .replace(/_/g, " ")
//         .replace(/\b\w/g, (c) => c.toUpperCase()),
//     []
//   );

//   // Fetch task detail (abort-safe)
//   useEffect(() => {
//     if (!taskId) return;

//     const ctrl = new AbortController();
//     abortRef.current?.abort(); // batalkan request sebelumnya
//     abortRef.current = ctrl;

//     const run = async () => {
//       try {
//         setLoadingTask(true);
//         const res = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(taskId), {
//           signal: ctrl.signal,
//         });
//         setTask(res.data);
//       } catch (err) {
//         // Jika dibatalkan, abaikan
//         if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
//         toast.error(err?.response?.data?.message || "Gagal memuat data permohonan");
//         onClose?.();
//       } finally {
//         setLoadingTask(false);
//       }
//     };

//     run();
//     return () => ctrl.abort();
//   }, [taskId, onClose]);

//   const createdAt = useMemo(() => formatDateId(task?.createdAt), [task?.createdAt]);

//   const handleApproval = useCallback(
//     async (action) => {
//       if (!["approved", "rejected"].includes(action)) {
//         toast.error("Tindakan tidak valid");
//         return;
//       }
//       if (loadingAction) return; // cegah double click

//       setLoadingAction(action);
//       try {
//         const res = await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), { action, note });
//         toast.success(res?.data?.message || `Task berhasil di-${action}`);
//         onSuccess?.();
//         onClose?.();
//       } catch (err) {
//         toast.error(err?.response?.data?.message || "Gagal memperbarui approval");
//       } finally {
//         setLoadingAction("");
//       }
//     },
//     [loadingAction, note, onClose, onSuccess, taskId]
//   );

//   if (loadingTask) {
//     // Skeleton ringkas & jelas
//     return (
//       <div className="space-y-5">
//         <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
//         <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div key={i} className="h-4 w-[70%] bg-slate-200 rounded animate-pulse" />
//           ))}
//         </div>
//         <div>
//           <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
//           <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
//         </div>
//         <div className="flex justify-end gap-2">
//           {Array.from({ length: 3 }).map((_, i) => (
//             <div key={i} className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (!task) return null;

//   return (
//     <div className="space-y-5">
//       <h3 id="approval-title" className="text-lg font-semibold text-slate-800">
//         Approval Permohonan
//       </h3>

//       {/* Informasi Task */}
//       <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-sm space-y-1">
//         <InfoRow label="Nopel" value={task.mainData?.nopel} />
//         <InfoRow label="NOP" value={task.mainData?.nop} />
//         <InfoRow label="Nama" value={task.additionalData?.[0]?.newName} />
//         <InfoRow label="Jenis Permohonan" value={formatTitle(task.title)} />
//         <InfoRow label="Tanggal Diajukan" value={createdAt} />
//         <InfoRow label="Tahapan Saat Ini" value={task.currentStage} />
//       </div>

//       {/* Catatan */}
//       <div>
//         <label htmlFor={noteId} className="block text-sm font-medium text-slate-700 mb-1">
//           Catatan (Opsional)
//         </label>
//         <textarea
//           id={noteId}
//           rows={3}
//           value={note}
//           onChange={(e) => setNote(e.target.value)}
//           className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           placeholder="Masukkan catatan jika diperlukan..."
//         />
//       </div>

//       {/* Tombol Aksi */}
//       <div className="flex justify-end gap-2 pt-2">
//         <button
//           type="button"
//           onClick={onClose}
//           className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring"
//         >
//           Batal
//         </button>
//         <ActionButton
//           action="rejected"
//           loadingAction={loadingAction}
//           onClick={() => handleApproval("rejected")}
//           color="red"
//         >
//           Tolak
//         </ActionButton>
//         <ActionButton
//           action="approved"
//           loadingAction={loadingAction}
//           onClick={() => handleApproval("approved")}
//           color="green"
//         >
//           Setujui
//         </ActionButton>
//       </div>
//     </div>
//   );
// };

// export default ManageApproval;