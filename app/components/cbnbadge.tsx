// ── CBN Badge ────────────────────────────────────────────
export const CBNBadge = () => (
  <div className="flex items-center justify-center gap-2 mt-3">
    <img
      src="/cbn.png"
      alt="Central Bank of Nigeria"
      className="h-6 w-auto object-contain"
    />
    <p className="text-[11px] text-gray-500 text-center">
      Our banking partners are licensed by the{" "}
      <span className="font-semibold text-gray-700">CBN</span>
    </p>
  </div>
);
