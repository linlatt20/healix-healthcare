import React, { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Modal, Input, Label } from "@/components/shared-ui";
import { Languages, MessageSquare, MapPin, ShieldCheck, ArrowRight, Activity, Thermometer, UserCircle, CalendarDays, UserCheck, CheckCircle2, Users, Droplet, HeartPulse, Edit3 } from "lucide-react";
import { useGetHealthRecord } from "@workspace/api-client-react";
import { useAuthContext } from "@/contexts/auth-context";
import LoginPromptModal from "@/components/login-prompt-modal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Home() {
  const { isAuthenticated, login } = useAuthContext();
  const { data: healthRecord, isLoading } = useGetHealthRecord();

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bLang, setBLang] = useState("Korean");
  const [bDate, setBDate] = useState("");
  const [bTime, setBTime] = useState("");
  const [bType, setBType] = useState("Hospital Visit");
  const [bHospital, setBHospital] = useState("");
  const [bNotes, setBNotes] = useState("");

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await fetch(`${BASE}/api/interpreter/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bName, email: bEmail, phone: bPhone, language: bLang,
          appointmentDate: bDate, appointmentTime: bTime,
          appointmentType: bType, hospital: bHospital, notes: bNotes,
        }),
      });
      setBookingSuccess(true);
    } catch {
      /* silent */
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBooking = () => {
    setBookingSuccess(false); setIsBookingOpen(false);
    setBName(""); setBEmail(""); setBPhone(""); setBLang("Korean");
    setBDate(""); setBTime(""); setBType("Hospital Visit"); setBHospital(""); setBNotes("");
  };

  const QUICK_LINKS = [
    { title: "Real-time Translation", desc: "Live interpreter for conversations", icon: Languages, href: "/chatbot?tab=translate", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Symptom Checker", desc: "Chat with AI to assess urgency", icon: MessageSquare, href: "/chatbot", color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Find a Clinic", desc: "Locate English-speaking doctors", icon: MapPin, href: "/clinics", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "NHIS Calculator", desc: "Estimate your hospital bills", icon: ShieldCheck, href: "/insurance", color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-dark text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-40">
          <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Medical background" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-4">
            Care Without{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-200 drop-shadow-[0_0_20px_rgba(125,211,252,0.6)] italic">
                Borders
              </span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-sky-300 to-cyan-200 rounded-full opacity-70" />
            </span>
          </h2>
          <p className="text-sm md:text-base text-white/80 mb-8 max-w-xl">
            Navigating the Korean healthcare system shouldn't be stressful.<br className="hidden md:block" />{" "}
            Find clinics, understand insurance and get complete medical guidance in your language.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/chatbot">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20">Consult with Healix AI</Button>
            </Link>
            <Link href="/clinics">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Find a Clinic
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Section Header */}
      <div className="text-center pt-2">
        <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Everything you need in one place
        </h3>
        <p className="text-muted-foreground text-xs md:text-sm max-w-xl mx-auto">
          We bridge the language and cultural gap so you can focus on getting better.
        </p>
      </div>
      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {QUICK_LINKS.map((item, idx) => (
          <Link key={idx} href={item.href}>
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-lg shadow-black/5 cursor-pointer h-full flex flex-col transition-all hover:shadow-xl hover:border-primary/30 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-auto">{item.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
      {/* Book an Interpreter Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-blue-50/50 to-accent/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <UserCheck className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-display font-bold text-foreground mb-1">Need a Human Interpreter?</h3>
          <p className="text-sm text-muted-foreground">Book a certified medical interpreter for your hospital or clinic appointment in Korea.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link href="/appointments">
            <Button size="lg" className="shadow-md shadow-primary/20">
              <Users className="w-4 h-4 mr-2" /> View Interpreters
            </Button>
          </Link>
        </div>
      </div>

      {/* Mini Health Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">Your Health Overview</h2>
          <Link href="/health-record">
            <Button variant="ghost" className="text-primary gap-2">
              Full Record <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {isAuthenticated && isLoading ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
          </div>
        ) : !isAuthenticated ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center bg-muted/30">
            <UserCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground mb-2">No Records Yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">Log in to view your personal health overview, track your vitals, and get personalized clinic recommendations.</p>
            <Button onClick={login}>Log in to view</Button>
          </Card>
        ) : (() => {
          const r = healthRecord as any;
          const hasData = r && (r.fullName || r.bloodType || r.height || r.weight || r.vitals?.bloodPressure || r.vitals?.heartRate || r.vitals?.temperature);
          if (!hasData) {
            return (
              <Card className="p-10 text-center flex flex-col items-center justify-center bg-muted/30">
                <UserCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-foreground mb-2">No Records Yet</h3>
                <p className="text-muted-foreground max-w-md mb-6">Add your health details to get personalized clinic recommendations and keep track of your vitals.</p>
                <Link href="/health-record"><Button>Edit Health Data</Button></Link>
              </Card>
            );
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Blood Type */}
              {r.bloodType && (
                <Card className="p-5 bg-gradient-to-br from-red-50 to-rose-50/30 border-red-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-red-600/70">Blood Type</div>
                    <div className="text-2xl font-bold text-red-900">{r.bloodType}</div>
                  </div>
                </Card>
              )}
              {/* Height & Weight */}
              {(r.height || r.weight) && (
                <Card className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-emerald-600/70">Height / Weight</div>
                    <div className="text-xl font-bold text-emerald-900">
                      {[r.height && `${r.height} cm`, r.weight && `${r.weight} kg`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </Card>
              )}
              {/* Blood Pressure */}
              {r.vitals?.bloodPressure && (
                <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 border-blue-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-600/70">Blood Pressure</div>
                    <div className="text-2xl font-bold text-blue-900">{r.vitals.bloodPressure}</div>
                  </div>
                </Card>
              )}
              {/* Heart Rate */}
              {r.vitals?.heartRate && (
                <Card className="p-5 bg-gradient-to-br from-pink-50 to-fuchsia-50/30 border-pink-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center shrink-0">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-pink-600/70">Heart Rate</div>
                    <div className="text-2xl font-bold text-pink-900">{r.vitals.heartRate} <span className="text-sm font-normal">bpm</span></div>
                  </div>
                </Card>
              )}
              {/* Temperature */}
              {r.vitals?.temperature && (
                <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50/30 border-orange-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-orange-600/70">Temperature</div>
                    <div className="text-2xl font-bold text-orange-900">{r.vitals.temperature}°C</div>
                  </div>
                </Card>
              )}
              {/* Allergies */}
              {Array.isArray(r.allergies) && r.allergies.length > 0 && (
                <Card className="p-5 bg-gradient-to-br from-yellow-50 to-lime-50/30 border-yellow-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-yellow-700/70">Allergies</div>
                    <div className="text-2xl font-bold text-yellow-900">{r.allergies.length} <span className="text-sm font-normal">on record</span></div>
                  </div>
                </Card>
              )}
              {/* Edit button card */}
              <Link href="/health-record">
                <Card className="p-5 flex flex-col justify-center items-center text-center border-dashed border-2 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors h-full min-h-[90px]">
                  <Edit3 className="w-5 h-5 text-primary mb-1" />
                  <div className="text-sm font-semibold text-primary">Edit Health Data</div>
                </Card>
              </Link>
            </div>
          );
        })()}
      </div>
    </motion.div>

    {/* Book Interpreter Modal */}
    <Modal isOpen={isBookingOpen} onClose={resetBooking} title="Book a Medical Interpreter">
      {bookingSuccess ? (
        <div className="flex flex-col items-center py-8 gap-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <h3 className="text-xl font-bold">Booking Confirmed!</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your interpreter has been requested. We'll contact you to confirm the details before your appointment.
          </p>
          <Button onClick={resetBooking} className="mt-2">Done</Button>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="b-name">Full Name *</Label>
              <Input id="b-name" placeholder="Your name" value={bName} onChange={e => setBName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-lang">Language Needed *</Label>
              <select
                id="b-lang"
                value={bLang}
                onChange={e => setBLang(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {["English","Chinese","Japanese","Vietnamese","Thai","Burmese","Mongolian"].map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-email">Email</Label>
              <Input id="b-email" type="email" placeholder="email@example.com" value={bEmail} onChange={e => setBEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-phone">Phone Number</Label>
              <Input id="b-phone" placeholder="+82-10-0000-0000" value={bPhone} onChange={e => setBPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-date">Appointment Date *</Label>
              <Input id="b-date" type="date" value={bDate} onChange={e => setBDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-time">Appointment Time</Label>
              <Input id="b-time" type="time" value={bTime} onChange={e => setBTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-type">Appointment Type</Label>
              <select
                id="b-type"
                value={bType}
                onChange={e => setBType(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {["Hospital Visit","Doctor Consultation","Emergency","Lab Test","Surgery Consultation","Pharmacy","Other"].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="b-hospital">Hospital / Clinic</Label>
              <Input id="b-hospital" placeholder="e.g. Seoul National University Hospital" value={bHospital} onChange={e => setBHospital(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="b-notes">Additional Notes</Label>
            <textarea
              id="b-notes"
              value={bNotes}
              onChange={e => setBNotes(e.target.value)}
              rows={3}
              placeholder="Any specific requirements or medical context..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetBooking} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={bookingLoading} className="flex-1">
              {bookingLoading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      )}
    </Modal>

    <LoginPromptModal isOpen={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} />
    </>
  );
}
