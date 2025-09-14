import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStageProgress from "../../components/cards/TaskStageProgress";
import { formatDateId } from "../../utils/formatDateId";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

// --- helpers ---
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
    <span className="text-slate-900 break-words">{children ?? "-"}</span>
  </div>
);

const SectionCard = ({ title, children, className = "" }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {title ? (
      <header className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </header>
    ) : null}
    <div className="p-5">{children}</div>
  </section>
);

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
          setTask(null); // ✅ perbaikan
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-indigo-400/30 blur opacity-60" />
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
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
                Tahap: {stageLabel[String(currentStage)?.toLowerCase()] || formatTitle(currentStage)}
              </span>
            </div>
          </div>
        </div>

        {/* Kartu besar: progress kiri (w-fit + divider), konten kanan mepet */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 p-4 md:grid-cols-[auto_1fr] md:gap-6 md:p-5 md:items-stretch">
            {/* Progress column */}
            <aside
              className="
                flex justify-center md:justify-end md:self-stretch md:pr-4
                md:border-r md:border-slate-200
              "
              aria-label="Progress Tahapan"
            >
              <div className="w-fit">
                <TaskStageProgress task={task} orientation="vertical" />
              </div>
            </aside>

            {/* Right column */}
            <div className="space-y-6">
              <SectionCard title="Data Utama" className="!mt-0">
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
                            {item.landWide != null && item.landWide !== "" ? `${item.landWide} m²` : "-"}
                          </InfoRow>
                          <InfoRow label="Luas Bangunan">
                            {item.buildingWide != null && item.buildingWide !== "" ? `${item.buildingWide} m²` : "-"}
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
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-[1] bg-slate-100 text-slate-800">
                      <tr>
                        <th className="border-b px-3 py-2 text-left">Tahapan</th>
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