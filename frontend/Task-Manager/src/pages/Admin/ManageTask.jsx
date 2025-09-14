import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import TaskFilter from "../../components/filters/TaskFilter";
const TaskTable = React.lazy(() => import("../../components/tabels/TaskTable"));
import Pagination from "../../components/ui/Pagination";
import ApprovalModal from "../../components/modals/ApprovalModal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

import TableSkeleton from "../../components/Skeletons/TableSkeleton";

/* ---------- Skeleton lokal (khusus tabel) ---------- */
// const TableSkeleton = ({ rows = 6 }) => (
//   <div className="overflow-x-auto">
//     <table className="min-w-full text-sm">
//       <thead className="sticky top-0 bg-slate-100 text-slate-800">
//         <tr>
//           {Array.from({ length: 9 }).map((_, i) => (
//             <th key={i} className="border-b px-3 py-2 text-left">
//               <div className="h-3 w-24 rounded bg-slate-200" />
//             </th>
//           ))}
//         </tr>
//       </thead>
//       <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
//         {Array.from({ length: rows }).map((_, r) => (
//           <tr key={r} className="[&>td]:border-b">
//             {Array.from({ length: 9 }).map((__, c) => (
//               <td key={c} className="px-3 py-2">
//                 <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
//               </td>
//             ))}
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// );
/* --------------------------------------------------- */

const ManageTasks = () => {
  // data utama
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);

  // pagination & filter
  const [page, setPage] = useState(1);
  const limit = 10;
  const [filters, setFilters] = useState({
    nopel: "",
    title: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    order: "desc",
  });

  // selection
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // modal approval
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // loading & abort (fetch)
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef(null);

  // loading & abort (export)
  const [exporting, setExporting] = useState(false);
  const exportCtrlRef = useRef(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Number(total) / limit)),
    [total]
  );

  // fetcher stabil
  const fetchTasks = useCallback(
    async (p, f) => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      setLoading(true);
      try {
        const res = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
          params: { page: p, limit, ...f },
          signal: ctrl.signal,
        });
        const data = res?.data || {};
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setTotal(Number(data.total || 0));
        setSelectedTaskIds([]); // reset seleksi ketika data berubah
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          toast.error("Gagal mengambil data");
        }
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // initial & re-fetch saat page/filters berubah
  useEffect(() => {
    fetchTasks(page, filters);
    return () => {
      ctrlRef.current?.abort();
      exportCtrlRef.current?.abort();
    };
  }, [page, filters, fetchTasks]);

  // checkbox handlers
  const onToggleRow = useCallback((id) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);
  const onToggleAll = useCallback(
    (checked) => setSelectedTaskIds(checked ? tasks.map((t) => t._id) : []),
    [tasks]
  );

  // approval & delete
  const openApprovalModal = useCallback((id) => {
    setSelectedTaskId(id);
    setShowApprovalModal(true);
  }, []);
  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Yakin ingin menghapus permohonan ini?")) return;
      try {
        await axiosInstance.delete(API_PATHS.TASK.DELETE_TASK(id));
        toast.success("Berhasil menghapus permohonan");
        fetchTasks(page, filters); // refresh
      } catch {
        toast.error("Gagal menghapus permohonan");
      }
    },
    [fetchTasks, page, filters]
  );

  // ——— Helper: unduh blob dengan nama file yang aman ———
  const downloadBlob = (blob, filenameFallback = "download.bin") => {
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFallback;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // ——— Ekspor rekom (bulk/single) ———
  const handleExport = useCallback(async (ids) => {
    if (!ids || ids.length === 0) {
      toast("Pilih minimal 1 permohonan untuk diunduh.", { icon: "ℹ️" });
      return;
    }

    // Batalkan eksport sebelumnya jika masih jalan
    exportCtrlRef.current?.abort();
    const ctrl = new AbortController();
    exportCtrlRef.current = ctrl;

    setExporting(true);
    try {
      const res = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
        { taskIds: ids }, // body
        {
          responseType: "blob",
          signal: ctrl.signal,
        }
      );

      // Tentukan nama file dari header
      const cd =
        res.headers?.["content-disposition"] ||
        res.headers?.get?.("content-disposition");
      let filename = "";
      if (cd) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
          cd
        );
        filename = decodeURIComponent(match?.[1] || match?.[2] || "");
      }
      // Fallback nama file berdasarkan content-type & timestamp
      if (!filename) {
        const ct =
          res.headers?.["content-type"] ||
          res.headers?.get?.("content-type") ||
          "";
        const ts = new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\..+/, "");
        filename = ct.includes("zip")
          ? `rekom-bulk-${ts}.zip`
          : `rekom-${ids.length > 1 ? "bulk-" : ""}${ts}.pdf`;
      }

      downloadBlob(res.data, filename);
      toast.success("Unduhan dimulai.");
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        // dibatalkan—diamkan
      } else if (
        err?.response?.data &&
        err.response.headers?.["content-type"]?.includes("application/json")
      ) {
        // Jika backend kirim error JSON (mis. validasi)
        try {
          const text = await err.response.data.text?.();
          const msg = JSON.parse(text)?.message || "Gagal mengunduh rekom.";
          toast.error(msg);
        } catch {
          toast.error("Gagal mengunduh rekom.");
        }
      } else {
        toast.error("Gagal mengunduh rekom.");
      }
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="mt-5">
        {/* Filter */}
        <TaskFilter
          filters={filters}
          setFilters={setFilters}
          loading={loading}
          onFilterSubmit={() => {
            setPage(1);
            fetchTasks(1, filters);
          }}
          onFilterReset={() => {
            const reset = {
              nopel: "",
              title: "",
              startDate: "",
              endDate: "",
              order: "desc",
            };
            setFilters(reset);
            setPage(1);
            fetchTasks(1, reset);
          }}
        />

        {/* Tabel */}
        <Suspense fallback={<TableSkeleton rows={10} cols={9}/>}>
          <div className="relative mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {loading && (
                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
            )}
            {tasks.length > 0 ? (
              <>
                <TaskTable
                  tasks={tasks}
                  selectedTaskIds={selectedTaskIds}
                  onToggleRow={onToggleRow}
                  onToggleAll={onToggleAll}
                  handleDelete={handleDelete}
                  openApprovalModal={openApprovalModal}
                  page={page}
                  limit={limit}
                  // === NEW: Export props ===
                  onExport={handleExport}
                  exporting={exporting}
                  showExportButton={true}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  disabled={loading}
                  onPageChange={(next) => {
                    const clamped = Math.max(1, Math.min(totalPages, next));
                    if (clamped !== page) setPage(clamped);
                  }}
                />
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data yang bisa dtampilkan.
              </div>
            )}
          </div>
        </Suspense>

        {/* Modal Approval */}
        {showApprovalModal && (
          <ApprovalModal
            taskId={selectedTaskId}
            onClose={() => setShowApprovalModal(false)}
            onSuccess={() => {
              fetchTasks(page, filters);
              setShowApprovalModal(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageTasks;
