import React from "react";

const STEPS = ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"];
const LABELS = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

const toLabel = (s) =>
  LABELS[s] ??
  String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function TaskStageProgress({ task, steps = STEPS }) {
  if (!task) return null;

  // indeks tahap
  const baseActiveIdx = Math.max(steps.indexOf(task.currentStage), -1);
  const doneIdx       = steps.indexOf("selesai");
  const sentIdx       = steps.indexOf("dikirim");
  const rejectedIdx   = task.rejectedStage ? steps.indexOf(task.rejectedStage) : -1;

  // cek "dikirim sudah approved?" dari riwayat approval jika tersedia
  const approvals = Array.isArray(task?.approvals) ? task.approvals : [];
  const sentApproved = approvals.some(
    (a) => a?.stage === "dikirim" && a?.status === "approved"
  );

  // Tentukan activeIdx & completedIdx (untuk badge hijau) berdasar kasus
  let activeIdx = baseActiveIdx;
  let completedIdx;

  if (rejectedIdx > -1) {
    // jika ditolak → completed berhenti sebelum tahap rejected
    completedIdx = rejectedIdx - 1;
  } else if (sentApproved || baseActiveIdx === doneIdx) {
    // jika "dikirim" sudah approved → anggap semua selesai (selesai completed)
    completedIdx = doneIdx;
    activeIdx = -1; // tidak ada current (semua sudah complete)
  } else {
    // normal → completed sampai sebelum current
    completedIdx = baseActiveIdx - 1;
  }

  // Batas konektor hijau:
  // - jika rejected ⇒ limit = rejectedIdx
  // - else jika ada current ⇒ limit = activeIdx (hijau masuk ke current, berhenti setelahnya)
  // - else (mis. sudah selesai) ⇒ limit = completedIdx (semua sampai completed)
  const limitIdx =
    rejectedIdx > -1
      ? rejectedIdx
      : activeIdx > -1
      ? activeIdx
      : completedIdx;

  return (
    <div className="mb-6">
      <div className="flex items-start" role="list" aria-label="Progress tahapan">
        {steps.map((stage, i) => {
          const isRejected  = i === rejectedIdx;
          const isCurrent   = i === activeIdx && !isRejected; // current hanya ada jika belum selesai/reject
          const isCompleted = i <= completedIdx;              // badge ceklis untuk semua sebelum/termasuk completedIdx

          // konektor: hijau sampai "limitIdx"
          const leftGreen  = i > 0 && i <= limitIdx;
          const rightGreen = i < limitIdx;

          // warna border bullet
          const bulletBorder = isRejected
            ? "border-rose-500"
            : isCompleted
            ? "border-emerald-500"
            : isCurrent
            ? "border-yellow-300"
            : "border-slate-300";

          // warna angka
          const numberColor = isRejected
            ? "text-rose-600"
            : isCompleted
            ? "text-emerald-600"
            : isCurrent
            ? "text-yellow-300"
            : "text-slate-400";

          return (
            <div key={stage} className="flex flex-1 flex-col items-center" role="listitem">
              {/* konektor + bullet */}
              <div className="relative flex h-14 w-full items-center justify-center">
                {/* Konektor kiri */}
                {i > 0 && (
                  <div
                    aria-hidden
                    className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-1 rounded-full ${
                      leftGreen
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                        : "bg-slate-300"
                    }`}
                  />
                )}
                {/* Konektor kanan */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full ${
                      rightGreen
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                        : "bg-slate-300"
                    }`}
                  />
                )}

                {/* Bullet */}
                <div
                  className={[
                    "relative z-10 grid h-12 w-12 place-items-center rounded-full border-4 bg-white transition-transform",
                    bulletBorder,
                    isCompleted || isRejected ? "shadow-sm" : "",
                    isCompleted ? "shadow-emerald-200" : "",
                    // current: ring & ping pindah ke badge, jadi ring bisa dihapus atau dibiarkan halus
                    isCurrent ? "ring-4 ring-yellow-200/60" : "",
                  ].join(" ")}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={toLabel(stage)}
                  title={toLabel(stage)}
                >
                  {/* Angka */}
                  <span className={`text-sm font-bold leading-none ${numberColor}`}>{i + 1}</span>

                  {/* Completed → ceklis hijau */}
                  {isCompleted && !isRejected && (
                    <span
                      className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
                      aria-hidden
                      title="Selesai"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                        <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
                      </svg>
                    </span>
                  )}

                  {/* Current → jam + ping kuning */}
                  {isCurrent && !isRejected && (
                    <>
                      <span
                        className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-yellow-300/70 animate-ping"
                        aria-hidden
                      />
                      <span
                        className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-yellow-300 text-white ring-2 ring-white"
                        aria-hidden
                        title="Menunggu / Diproses"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75Zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.26 8.26 0 0 1 12 20.25Zm.75-13.5h-1.5v6l5 3 .75-1.23-4.25-2.55Z" />
                        </svg>
                      </span>
                    </>
                  )}

                  {/* Rejected → silang merah */}
                  {isRejected && (
                    <span
                      className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white"
                      aria-hidden
                      title="Ditolak"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                        <path d="M18.3 5.71 12 12.01 5.71 5.71 4.3 7.12l6.29 6.28-6.3 6.3 1.42 1.41 6.3-6.3 6.29 6.3 1.41-1.41-6.29-6.3 6.29-6.29z" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Label */}
              <p
                className={[
                  "mt-2 text-center text-xs md:text-sm font-semibold",
                  isRejected
                    ? "text-rose-600"
                    : isCompleted
                    ? "text-emerald-700"
                    : isCurrent
                    ? "text-yellow-300"
                    : "text-slate-600",
                ].join(" ")}
              >
                {toLabel(stage)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// import React from "react";

// const STEPS = ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"];
// const LABELS = {
//   diinput: "Diinput",
//   ditata: "Ditata",
//   diteliti: "Diteliti",
//   diarsipkan: "Diarsipkan",
//   dikirim: "Dikirim",
//   selesai: "Selesai",
// };
// const toLabel = (s) =>
//   LABELS[s] ??
//   String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// /**
//  * Garis konektor dibuat per-node:
//  * - setengah ke kiri (center prev → center node)
//  * - setengah ke kanan (center node → center next)
//  * Hasilnya garis tampak NYAMBUNG mulus tepat di tengah lingkaran.
//  */
// export default function TaskStageProgress({ task, steps = STEPS }) {
//   if (!task) return null;

//   const activeIdx = Math.max(steps.indexOf(task.currentStage), -1);
//   const rejectedIdx = task.rejectedStage ? steps.indexOf(task.rejectedStage) : -1;

//   // progress terakhir yg hijau (kalau rejected, stop sebelum tahap rejected)
//   let progressIdx = activeIdx;
//   if (rejectedIdx > -1) progressIdx = Math.min(progressIdx, rejectedIdx - 1);

//   return (
//     <div className="mb-8">
//       <div className="flex items-start" role="list" aria-label="Progress tahapan">
//         {steps.map((stage, i) => {
//           const isRejected = i === rejectedIdx;
//           const isCompleted = i <= progressIdx; // node ini sudah dilewati/hijau
//           const isCurrent = i === activeIdx && !isRejected;

//           const bulletCls = isRejected
//             ? "bg-red-500 border-red-500 text-white"
//             : isCompleted
//             ? "bg-green-500 border-green-500 text-white"
//             : "bg-white border-gray-300 text-gray-400";

//           // warna konektor (kiri/kanan) per node:
//           // kiri hijau jika (i-1) <= progressIdx
//           const leftGreen = i > 0 && i - 1 <= progressIdx;
//           // kanan hijau jika i <= progressIdx
//           const rightGreen = i < steps.length - 1 && i <= progressIdx;

//           return (
//             <div key={stage} className="flex-1 flex flex-col items-center" role="listitem">
//               {/* area node + connector (tinggi disamakan dgn diameter circle: h-12) */}
//               <div className="relative w-full h-12 flex items-center justify-center">
//                 {/* left half connector */}
//                 {i > 0 && (
//                   <div
//                     className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-1 rounded-full ${
//                       leftGreen ? "bg-green-500" : "bg-gray-300"
//                     }`}
//                     aria-hidden
//                   />
//                 )}

//                 {/* right half connector */}
//                 {i < steps.length - 1 && (
//                   <div
//                     className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full ${
//                       rightGreen ? "bg-green-500" : "bg-gray-300"
//                     }`}
//                     aria-hidden
//                   />
//                 )}

//                 {/* bullet */}
//                 <div
//                   className={`relative z-10 w-12 h-12 rounded-full border-4 grid place-items-center transition-transform ${
//                     (isRejected || isCompleted) ? "scale-110" : ""
//                   } ${bulletCls} ${isCurrent ? "ring-2 ring-indigo-300" : ""}`}
//                   aria-current={isCurrent ? "step" : undefined}
//                   aria-label={toLabel(stage)}
//                   title={toLabel(stage)}
//                 >
//                   <span className="text-sm font-bold">{i + 1}</span>
//                 </div>
//               </div>

//               {/* label */}
//               <p className="mt-2 text-xs md:text-sm font-semibold text-center">
//                 {toLabel(stage)}
//               </p>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
