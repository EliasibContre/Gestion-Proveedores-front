// src/pages/provider/components/CalendarSimple.jsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";

function parseLocalDate(value) {
  if (!value) return null;

  const raw = String(value).trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateISO(value) {
  const d = parseLocalDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("es-MX");
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function CalendarSimple({ events = [], onOpenPlan, onOpenUpload }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(null);

  const { days, title } = useMemo(() => {
    const mStart = startOfMonth(cursor);
    const mEnd = endOfMonth(cursor);

    const gridStart = new Date(mStart);
    gridStart.setDate(mStart.getDate() - mStart.getDay());

    const gridEnd = new Date(mEnd);
    gridEnd.setDate(mEnd.getDate() + (6 - mEnd.getDay()));

    const out = [];

    for (
      let current = new Date(gridStart);
      current <= gridEnd;
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
    ) {
      out.push(new Date(current));
    }

    const monthName = cursor.toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });

    return { days: out, title: monthName };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map();

    for (const e of events) {
      const key = String(e.date || "").slice(0, 10);
      if (!key) continue;

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }

    for (const [k, list] of map.entries()) {
      list.sort((a, b) => {
        if (a.kind === b.kind) return 0;
        if (a.kind === "CIERRE") return -1;
        if (b.kind === "CIERRE") return 1;
        return 0;
      });
      map.set(k, list);
    }

    return map;
  }, [events]);

  const today = new Date();
  const todayISO = toISO(today);

  const selectedList = selected ? eventsByDay.get(selected) || [] : [];

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Calendario</p>
          <h2 className="text-lg font-bold capitalize text-darkBlue">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border p-2 hover:bg-gray-50"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="rounded-xl border p-2 hover:bg-gray-50"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          Cierre
        </span>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Pago programado
        </span>
        <span className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
          Pagada (tenue)
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
          <div key={d} className="px-2 py-1 font-semibold text-gray-500">
            {d}
          </div>
        ))}

        {days.map((d) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = iso === todayISO;

          const list = eventsByDay.get(iso) || [];
          const hasClose = list.some((e) => e.kind === "CIERRE");
          const hasPay = list.some((e) => e.kind === "PAGO");

          return (
            <button
              key={iso}
              onClick={() => setSelected(iso)}
              className={[
                "relative min-h-[72px] rounded-xl border p-2 text-left transition hover:bg-gray-50",
                !inMonth ? "opacity-50" : "",
                selected === iso ? "border-midBlue ring-2 ring-midBlue" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-semibold ${
                    isToday ? "text-midBlue" : "text-gray-700"
                  }`}
                >
                  {d.getDate()}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold text-midBlue">HOY</span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {hasClose && (
                  <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    Cierre
                  </span>
                )}
                {hasPay && (
                  <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    Pago
                  </span>
                )}
                {list.length === 0 && (
                  <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                    —
                  </span>
                )}
              </div>

              {list.length > 0 && (
                <span className="absolute right-2 top-2 text-[10px] font-bold text-gray-400">
                  {list.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-darkBlue">
              Eventos del día{" "}
              <span className="text-sm text-gray-500">
                ({formatDateISO(selected)})
              </span>
            </p>
            <button
              className="rounded-xl border px-3 py-1 text-xs hover:bg-gray-50"
              onClick={() => setSelected(null)}
            >
              Cerrar
            </button>
          </div>

          {selectedList.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No hay eventos este día.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {selectedList.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {e.kind === "CIERRE"
                        ? "Cierre parcialidad"
                        : "Pago parcialidad"}{" "}
                      #{e.parcialidadNumero}
                    </p>

                    <p className="text-xs text-gray-500">
                      Plan: <b className="text-gray-700">{e.planOC}</b>
                    </p>

                    <div className="mt-2">
                      <StatusBadge status={e.estado} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold hover:bg-gray-200"
                      onClick={() => onOpenPlan?.(e.planId)}
                    >
                      Ver plan
                    </button>

                    {e.cta === "SUBIR" && (
                      <button
                        className="rounded-xl bg-midBlue px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                        onClick={() => onOpenUpload?.(e.planId, e.parcialidadId)}
                      >
                        Subir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}