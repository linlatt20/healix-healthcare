import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Globe, Stethoscope, FileText, AlertCircle, Loader2,
  Hospital, UserCheck, Phone, RefreshCw, Pencil, X, CheckCircle2,
  Siren, Star, ChevronLeft, ArrowRight, Users,
} from "lucide-react";
import { Card, Button, Modal, Input, Label } from "@/components/shared-ui";
import { useAuthContext } from "@/contexts/auth-context";
import LoginPromptModal from "@/components/login-prompt-modal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ── Types ── */
type ClinicAppt = {
  id: number; patientName: string; email?: string; phone?: string;
  clinicName: string; department: string; appointmentDate: string;
  appointmentTime?: string; reason?: string; urgency?: string; status: string; createdAt: string;
  _type: "clinic";
};

type InterpreterBooking = {
  id: number; name: string; email?: string; phone?: string;
  language: string; appointmentDate: string; appointmentTime?: string;
  appointmentType?: string; hospital?: string; notes?: string; status: string;
  interpreterName?: string; interpreterPhone?: string; confirmedAt?: string;
  createdAt: string; _type: "interpreter";
};

type AnyAppt = ClinicAppt | InterpreterBooking;

interface Interpreter {
  id: string; name: string; language: string; rating: number; topik: number;
  patientsAssisted: number; avatar: string; bio: string; availableTimes: string[];
}

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusLabel = (s: string) =>
  s === "pending" ? "📅 Booked" : s === "confirmed" ? "✅ Confirmed" : s === "cancelled" ? "🚫 Cancelled" : s;

/* ── Date helpers ── */
function getUpcomingDays(count = 6) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════
   Interpreter Direct Booking Modal
═══════════════════════════════════════════════════════════════ */
function InterpreterBookingModal({
  isOpen, onClose, onBooked, user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onBooked: () => void;
  user: { firstName?: string; lastName?: string; email?: string } | null;
}) {
  const { isAuthenticated } = useAuthContext();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const [step, setStep] = useState<"list" | "detail">("list");
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<Interpreter | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Booking fields
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bHospital, setBHospital] = useState("");
  const [bNotes, setBNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  const upcomingDays = getUpcomingDays(6);

  useEffect(() => {
    if (isOpen && interpreters.length === 0) {
      setLoadingList(true);
      fetch(`${BASE}/api/interpreters`).then(r => r.json()).then(setInterpreters).finally(() => setLoadingList(false));
    }
    if (isOpen && user) {
      setBName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
      setBEmail(user.email ?? "");
    }
  }, [isOpen, user]);

  const selectInterpreter = (interp: Interpreter) => {
    setSelected(interp);
    setSelectedDate(upcomingDays[0]);
    setSelectedTime("");
    setBioExpanded(false);
    setStep("detail");
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    if (!selected || !selectedDate || !selectedTime) return;
    setBooking(true);
    try {
      await fetch(`${BASE}/api/interpreter/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bName,
          email: bEmail,
          language: selected.language,
          appointmentDate: fmt(selectedDate),
          appointmentTime: selectedTime,
          hospital: bHospital,
          notes: bNotes,
          interpreterName: selected.name,
          interpreterPhone: "",
        }),
      });
      setSuccess(true);
      onBooked();
    } finally {
      setBooking(false);
    }
  };

  const resetAndClose = () => {
    setStep("list");
    setSelected(null);
    setSelectedDate(null);
    setSelectedTime("");
    setBHospital("");
    setBNotes("");
    setSuccess(false);
    onClose();
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={resetAndClose}
      title={step === "list" ? "Choose an Interpreter" : "Interpreter Detail"}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-8 gap-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold">Appointment Booked!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your appointment with <strong>{selected?.name}</strong> on{" "}
              {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
              {selectedTime} has been requested.
            </p>
            <Button onClick={resetAndClose} className="mt-2">Done</Button>
          </motion.div>
        ) : step === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {loadingList ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {interpreters.map(interp => (
                  <button key={interp.id} onClick={() => selectInterpreter(interp)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-white hover:border-primary/40 hover:shadow-md transition-all text-left group">
                    <img src={interp.avatar} alt={interp.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0 bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base">{interp.name}</p>
                      <p className="text-sm text-muted-foreground">{interp.language}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {interp.rating}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" /> Topik {interp.topik}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : selected ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
            {/* Back */}
            <button onClick={() => setStep("list")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to list
            </button>

            {/* Profile card */}
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
              <img src={selected.avatar} alt={selected.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md shrink-0 bg-muted" />
              <div>
                <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">Topik {selected.topik}, Certified Interpreter</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm">{selected.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Assisted {selected.patientsAssisted} patients</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h4 className="font-bold mb-2">About</h4>
              <p className={`text-sm text-muted-foreground leading-relaxed ${!bioExpanded ? "line-clamp-3" : ""}`}>{selected.bio}</p>
              <button onClick={() => setBioExpanded(b => !b)} className="text-sm text-primary font-medium mt-1">
                {bioExpanded ? "Show less" : "Read more"}
              </button>
            </div>

            {/* Date picker */}
            <div>
              <h4 className="font-bold mb-3">Select Date</h4>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {upcomingDays.map(d => {
                  const isSelected = selectedDate && fmt(d) === fmt(selectedDate);
                  return (
                    <button key={fmt(d)} onClick={() => { setSelectedDate(d); setSelectedTime(""); }}
                      className={`flex flex-col items-center px-3 py-2.5 rounded-2xl border-2 transition-all shrink-0 min-w-[58px] ${
                        isSelected ? "bg-primary border-primary text-white shadow-md" : "border-border bg-white text-foreground hover:border-primary/40"
                      }`}>
                      <span className="text-xs font-medium opacity-70">{DAY_ABBR[d.getDay()]}</span>
                      <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <h4 className="font-bold mb-3">Select Time</h4>
                <div className="grid grid-cols-3 gap-2">
                  {selected.availableTimes.map(t => {
                    const isSel = selectedTime === t;
                    return (
                      <button key={t} onClick={() => setSelectedTime(isSel ? "" : t)}
                        className={`py-2.5 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          isSel ? "bg-primary border-primary text-white shadow-md" : "border-border bg-white text-foreground hover:border-primary/40"
                        }`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Patient details */}
            <div className="space-y-3">
              <h4 className="font-bold">Your Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ib-name">Full Name *</Label>
                  <Input id="ib-name" placeholder="Your name" value={bName} onChange={e => setBName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ib-email">Email</Label>
                  <Input id="ib-email" type="email" placeholder="email@example.com" value={bEmail} onChange={e => setBEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ib-hospital">Hospital / Clinic (optional)</Label>
                <Input id="ib-hospital" placeholder="e.g. Asan Medical Center, Seoul" value={bHospital} onChange={e => setBHospital(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ib-notes">Notes (optional)</Label>
                <textarea id="ib-notes" value={bNotes} onChange={e => setBNotes(e.target.value)} rows={2}
                  placeholder="Any special requirements or context..."
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              </div>
            </div>

            {/* Book button */}
            <Button onClick={handleBook}
              disabled={!selectedDate || !selectedTime || !bName.trim() || booking}
              className="w-full h-12 text-base gap-2">
              {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarDays className="w-5 h-5" />}
              Book Appointment
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Modal>
    <LoginPromptModal isOpen={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} actionLabel="book an interpreter" />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Appointments Page
═══════════════════════════════════════════════════════════════ */
const INTERP_LANGS = ["English","Chinese","Japanese","Vietnamese","Thai","Burmese","Mongolian"];

export default function Appointments() {
  const { isAuthenticated, user } = useAuthContext();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginActionLabel, setLoginActionLabel] = useState("book an appointment");

  const [items, setItems] = useState<AnyAppt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"all" | "clinic" | "interpreter">("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Interpreter booking
  const [isInterpOpen, setIsInterpOpen] = useState(false);

  // Hospital booking state
  const [isHospOpen, setIsHospOpen] = useState(false);
  const [hospSuccess, setHospSuccess] = useState(false);
  const [hospLoading, setHospLoading] = useState(false);
  const [hName, setHName] = useState("");
  const [hEmail, setHEmail] = useState("");
  const [hPhone, setHPhone] = useState("");
  const [hClinic, setHClinic] = useState("");
  const [hDept, setHDept] = useState("");
  const [hSelectedDate, setHSelectedDate] = useState<Date | null>(null);
  const [hTime, setHTime] = useState("");
  const [hReason, setHReason] = useState("");
  const [hUrgency, setHUrgency] = useState("normal");
  const [hBookedSlots, setHBookedSlots] = useState<string[]>([]);
  const [hLoadingSlots, setHLoadingSlots] = useState(false);
  const hUpcomingDays = getUpcomingDays(6);

  useEffect(() => {
    if (!hClinic.trim() || !hSelectedDate) { setHBookedSlots([]); return; }
    const dateStr = fmt(hSelectedDate);
    setHLoadingSlots(true);
    fetch(`${BASE}/api/clinic-appointments/booked-slots?clinic=${encodeURIComponent(hClinic)}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => setHBookedSlots(d.bookedSlots || []))
      .catch(() => setHBookedSlots([]))
      .finally(() => setHLoadingSlots(false));
  }, [hClinic, hSelectedDate]);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<InterpreterBooking | null>(null);
  const [eLang, setELang] = useState("");
  const [eDate, setEDate] = useState("");
  const [eTime, setETime] = useState("");
  const [eType, setEType] = useState("");
  const [eHospital, setEHospital] = useState("");
  const [eNotes, setENotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [clinics, interpreters] = await Promise.all([
        fetch(`${BASE}/api/clinic-appointments`).then(r => r.json()),
        fetch(`${BASE}/api/interpreter/bookings`).then(r => r.json()),
      ]);
      const tagged: AnyAppt[] = [
        ...clinics.map((c: any) => ({ ...c, _type: "clinic" as const })),
        ...interpreters.map((i: any) => ({ ...i, _type: "interpreter" as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(tagged);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Pre-fill hospital form with user info
  useEffect(() => {
    if (user) {
      setHName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
      setHEmail(user.email ?? "");
    }
  }, [user]);

  const handleHospitalBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hSelectedDate || !hTime) return;
    setHospLoading(true);
    try {
      await fetch(`${BASE}/api/clinic-appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: hName, email: hEmail, phone: hPhone, clinicName: hClinic, department: hDept, appointmentDate: fmt(hSelectedDate), appointmentTime: hTime, reason: hReason, urgency: hUrgency }),
      });
      setHospSuccess(true);
      await fetchAll();
    } catch { } finally { setHospLoading(false); }
  };

  const resetHosp = () => {
    setIsHospOpen(false); setHospSuccess(false);
    setHClinic(""); setHDept(""); setHSelectedDate(null); setHTime(""); setHReason(""); setHUrgency("normal");
    setHBookedSlots([]);
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(id);
    try {
      await fetch(`${BASE}/api/interpreter/bookings/${id}/cancel`, { method: "PATCH" });
      await fetchAll();
    } finally { setCancellingId(null); }
  };

  const openEdit = (b: InterpreterBooking) => {
    setEditTarget(b);
    setELang(b.language); setEDate(b.appointmentDate);
    setETime(b.appointmentTime || ""); setEType(b.appointmentType || "");
    setEHospital(b.hospital || ""); setENotes(b.notes || "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await fetch(`${BASE}/api/interpreter/bookings/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: eLang, appointmentDate: eDate, appointmentTime: eTime, appointmentType: eType, hospital: eHospital, notes: eNotes }),
      });
      setEditTarget(null);
      await fetchAll();
    } finally { setEditLoading(false); }
  };

  const filtered = tab === "all" ? items : items.filter(i => i._type === tab);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">Appointments</h1>
          <p className="text-muted-foreground text-sm">Your clinic appointments and interpreter booking requests.</p>
        </div>
        <button onClick={() => { setLoading(true); fetchAll(); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-1">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "clinic", "interpreter"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${tab === t ? "bg-primary text-white border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-primary"}`}>
            {t === "all" ? "All" : t === "clinic" ? "Clinic Appointments" : "Interpreter Bookings"}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? "bg-white/20" : "bg-muted"}`}>
              {t === "all" ? items.length : items.filter(i => i._type === t).length}
            </span>
          </button>
        ))}
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-blue-200/60 bg-gradient-to-r from-blue-50/60 via-sky-50/50 to-blue-50/30 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <Hospital className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Book a Hospital Appointment</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Request an appointment at any clinic or hospital in Korea.</p>
            </div>
          </div>
          <Button onClick={() => { if (!isAuthenticated) { setLoginActionLabel("book a hospital appointment"); setLoginPromptOpen(true); } else { setIsHospOpen(true); } }}
            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 gap-2 text-sm">
            <CalendarDays className="w-4 h-4" /> Book Appointment
          </Button>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-blue-50/50 to-accent/5 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Need a Medical Interpreter?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a certified interpreter and book directly for your visit.</p>
            </div>
          </div>
          <Button onClick={() => setIsInterpOpen(true)}
            className="w-full shadow-md shadow-primary/20 gap-2 text-sm">
            <Globe className="w-4 h-4" /> Choose Interpreter
          </Button>
        </div>
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : error ? (
        <Card className="p-10 text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-muted-foreground">Failed to load appointments. Please try again later.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Appointments Yet</h3>
          <p className="text-muted-foreground text-sm">Book a clinic appointment or interpreter service to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, i) => {
            const isInterpreter = item._type === "interpreter";
            const interp = isInterpreter ? (item as InterpreterBooking) : null;
            const isConfirmed = item.status === "confirmed";
            const isPending = item.status === "pending";

            return (
              <motion.div key={`${item._type}-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`overflow-hidden transition-all hover:shadow-lg ${isConfirmed && isInterpreter ? "border-green-200" : item.status === "cancelled" ? "border-red-100 opacity-70" : "hover:border-primary/20"}`}>
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isInterpreter ? "bg-orange-50" : "bg-blue-50"}`}>
                        {isInterpreter ? <Globe className="w-6 h-6 text-orange-500" /> : <Stethoscope className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-foreground text-base">
                            {isInterpreter ? (item as InterpreterBooking).name : (item as ClinicAppt).patientName}
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_CHIP[item.status] ?? STATUS_CHIP.pending}`}>
                            {statusLabel(item.status)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isInterpreter ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                            {isInterpreter ? "Interpreter Booking" : "Clinic Appointment"}
                          </span>
                          {!isInterpreter && (item as ClinicAppt).urgency === "emergency" && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">🚨 Emergency</span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                          {isInterpreter && interp?.interpreterName && (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 shrink-0 text-primary" />
                              <span className="font-medium text-primary">{interp.interpreterName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Hospital className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium text-foreground">
                              {isInterpreter ? (interp?.hospital || "—") : (item as ClinicAppt).clinicName}
                            </span>
                          </div>
                          {!isInterpreter && (
                            <div className="flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                              <span>{(item as ClinicAppt).department}</span>
                            </div>
                          )}
                          {isInterpreter && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span>{interp?.language} interpreter</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.appointmentDate}{item.appointmentTime ? ` at ${item.appointmentTime}` : ""}</span>
                          </div>
                          {!isInterpreter && (item as ClinicAppt).reason && (
                            <div className="flex items-center gap-1.5 sm:col-span-2">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>{(item as ClinicAppt).reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          Booked {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        {isInterpreter && isPending && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5" onClick={() => openEdit(item as InterpreterBooking)}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleCancel(item.id)} disabled={cancellingId === item.id}>
                              {cancellingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isInterpreter && isConfirmed && interp?.interpreterPhone && (
                    <div className="mx-5 mb-5 md:mx-6 md:mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-0.5">Interpreter Assigned</p>
                        <p className="text-sm font-bold text-green-900">{interp.interpreterName}</p>
                        {interp.interpreterPhone && (
                          <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {interp.interpreterPhone}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-green-600">
                        Confirmed {interp.confirmedAt ? new Date(interp.confirmedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interpreter booking modal */}
      <InterpreterBookingModal
        isOpen={isInterpOpen}
        onClose={() => setIsInterpOpen(false)}
        onBooked={fetchAll}
        user={user as any}
      />

      {/* Hospital booking modal */}
      <Modal isOpen={isHospOpen} onClose={resetHosp} title="Book a Hospital Appointment">
        {hospSuccess ? (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold">Appointment Requested!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">Your appointment request has been submitted. The clinic will confirm shortly.</p>
            <Button onClick={resetHosp} className="mt-2">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleHospitalBooking} className="space-y-4">
            <button type="button" onClick={() => setHUrgency(u => u === "emergency" ? "normal" : "emergency")}
              className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all text-left ${hUrgency === "emergency" ? "border-red-400 bg-red-50 text-red-700" : "border-border bg-muted/30 text-muted-foreground hover:border-red-300 hover:bg-red-50/50"}`}>
              <Siren className={`w-5 h-5 shrink-0 ${hUrgency === "emergency" ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-semibold">{hUrgency === "emergency" ? "🚨 Marked as Emergency" : "Mark as Emergency"}</p>
                <p className="text-xs opacity-70">Toggle if you need urgent / same-day care</p>
              </div>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="hb-name">Full Name *</Label>
                <Input id="hb-name" placeholder="Your name" value={hName} onChange={e => setHName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hb-clinic">Hospital / Clinic Name *</Label>
                <Input id="hb-clinic" placeholder="e.g. Asan Medical Center" value={hClinic} onChange={e => setHClinic(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hb-email">Email</Label>
                <Input id="hb-email" type="email" placeholder="email@example.com" value={hEmail} onChange={e => setHEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hb-phone">Phone Number</Label>
                <Input id="hb-phone" placeholder="+82-10-0000-0000" value={hPhone} onChange={e => setHPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hb-dept">Department / Specialty *</Label>
                <Input id="hb-dept" placeholder="e.g. Internal Medicine, Cardiology" value={hDept} onChange={e => setHDept(e.target.value)} required />
              </div>
            </div>
            {/* Date picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Date *</Label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {hUpcomingDays.map((day) => {
                  const selected = hSelectedDate && fmt(day) === fmt(hSelectedDate);
                  return (
                    <button key={fmt(day)} type="button"
                      onClick={() => { setHSelectedDate(day); setHTime(""); }}
                      className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 min-w-[60px] transition-all ${selected ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50 bg-background"}`}>
                      <span className={`text-xs font-medium ${selected ? "text-white/80" : "text-muted-foreground"}`}>
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-lg font-bold">{day.getDate()}</span>
                      <span className={`text-xs ${selected ? "text-white/80" : "text-muted-foreground"}`}>
                        {day.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Time slot grid */}
            {hSelectedDate && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Select Time * {hLoadingSlots && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM","05:00 PM","05:30 PM"].map((slot) => {
                    const booked = hBookedSlots.includes(slot);
                    const active = hTime === slot;
                    return (
                      <button key={slot} type="button" disabled={booked}
                        onClick={() => setHTime(slot)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium border-2 transition-all ${booked ? "border-border bg-muted text-muted-foreground line-through cursor-not-allowed opacity-50" : active ? "border-primary bg-primary text-white" : "border-border hover:border-primary/50 bg-background"}`}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="hb-reason">Symptoms / Reason for Visit</Label>
              <textarea id="hb-reason" value={hReason} onChange={e => setHReason(e.target.value)} rows={3}
                placeholder="Describe your symptoms or reason for the appointment..."
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetHosp}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={hospLoading || !hSelectedDate || !hTime}>
                {hospLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Book Appointment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit interpreter booking modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Interpreter Booking">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="eb-lang">Language</Label>
              <select id="eb-lang" value={eLang} onChange={e => setELang(e.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                {INTERP_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="eb-type">Appointment Type</Label>
              <Input id="eb-type" placeholder="e.g. Hospital Visit" value={eType} onChange={e => setEType(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eb-date">Date *</Label>
              <Input id="eb-date" type="date" value={eDate} onChange={e => setEDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eb-time">Time</Label>
              <Input id="eb-time" type="time" value={eTime} onChange={e => setETime(e.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="eb-hosp">Hospital / Clinic</Label>
              <Input id="eb-hosp" placeholder="e.g. Seoul National University Hospital" value={eHospital} onChange={e => setEHospital(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="eb-notes">Notes</Label>
            <textarea id="eb-notes" value={eNotes} onChange={e => setENotes(e.target.value)} rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={editLoading}>
              {editLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <LoginPromptModal isOpen={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} actionLabel={loginActionLabel} />
    </motion.div>
  );
}
