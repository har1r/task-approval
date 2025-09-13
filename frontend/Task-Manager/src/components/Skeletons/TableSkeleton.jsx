import React from "react";

const TableSkeleton = ({number= 5}) => (
  <div className="card animate-pulse" aria-busy="true">
    <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
    <div className="space-y-3">
      {[...Array(number)].map((_, i) => (
        <div key={i} className="h-4 w-full bg-slate-200 rounded" />
      ))}
    </div>
  </div>
);

export default React.memo(TableSkeleton);