import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Input, Select, Badge, Modal, Textarea, Label } from "@/components/shared-ui";
import { Search, MapPin, Star, Clock, Phone, Stethoscope, Sparkles, CalendarDays, CheckCircle2, User, FileText, Navigation, Loader2, ExternalLink, X, LocateFixed } from "lucide-react";
import { useGetClinics, useRecommendClinic } from "@workspace/api-client-react";
import { useAuthContext } from "@/contexts/auth-context";
import LoginPromptModal from "@/components/login-prompt-modal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type NearbyHospital = {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  tags: Record<string, string>;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type ClinicItem = { id: number; name: string; nameKorean?: string | null; address: string; departments: string[]; openHours?: string | null; rating?: number | null; hasNhis?: boolean | null; languages?: string[] | null };

export default function Clinics() {
  const { isAuthenticated } = useAuthContext();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [district, setDistrict] = useState("");
  const [language, setLanguage] = useState("");
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [symptoms, setSymptoms] = useState("");

  // Clinic appointment booking state
  const [bookingClinic, setBookingClinic] = useState<ClinicItem | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bPhone, setBPhone] = useState("");
  const [bDept, setBDept] = useState("");
  const [bDate, setBDate] = useState("");
  const [bTime, setBTime] = useState("");
  const [bReason, setBReason] = useState("");

  // Find Nearest Hospital state
  const [nearestOpen, setNearestOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [nearbyList, setNearbyList] = useState<NearbyHospital[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const findNearest = () => {
    setNearestOpen(true);
    setGeoError(null);
    setGeoLoading(true);
    setNearbyList([]);
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserCoords({ lat, lon });
        try {
          const query = `[out:json][timeout:15];(node["amenity"~"hospital|clinic"](around:5000,${lat},${lon});way["amenity"~"hospital|clinic"](around:5000,${lat},${lon}););out center;`;
          const resp = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          const data = await resp.json();
          const results: NearbyHospital[] = (data.elements as any[])
            .map((el: any) => {
              const elLat = el.type === "node" ? el.lat : el.center?.lat;
              const elLon = el.type === "node" ? el.lon : el.center?.lon;
              if (!elLat || !elLon) return null;
              const name = el.tags?.name || el.tags?.["name:en"] || "Unnamed Hospital";
              return { id: el.id, name, lat: elLat, lon: elLon, distanceKm: haversineKm(lat, lon, elLat, elLon), tags: el.tags || {} };
            })
            .filter(Boolean)
            .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
            .slice(0, 15) as NearbyHospital[];
          setNearbyList(results);
          if (results.length === 0) setGeoError("No hospitals found within 5 km. Try a different location.");
        } catch {
          setGeoError("Could not fetch nearby hospitals. Please check your connection.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        if (err.code === 1) setGeoError("Location access denied. Please allow location access in your browser.");
        else setGeoError("Unable to determine your location. Please try again.");
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const { data: clinics, isLoading } = useGetClinics({
    query: search || undefined,
    department: department || undefined,
    district: district || undefined,
    language: language || undefined,
  });

  const recommendMutation = useRecommendClinic();

  const handleSymptomSearch = () => {
    if (!symptoms.trim()) return;
    recommendMutation.mutate({ data: { symptoms, language: "English" } }, {
      onSuccess: (data) => {
        if (data.recommendedDepartments?.[0]) setDepartment(data.recommendedDepartments[0].department);
        setIsSymptomModalOpen(false);
      }
    });
  };

  const openBooking = (clinic: ClinicItem) => {
    if (!isAuthenticated) { setLoginPromptOpen(true); return; }
    setBookingClinic(clinic);
    setBDept(clinic.departments[0] || "");
    setBookingSuccess(false);
  };

  const resetBooking = () => {
    setBookingClinic(null);
    setBookingSuccess(false);
    setBName(""); setBEmail(""); setBPhone(""); setBDept("");
    setBDate(""); setBTime(""); setBReason("");
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingClinic) return;
    setBookingLoading(true);
    try {
      await fetch(`${BASE}/api/clinic-appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: bName, email: bEmail, phone: bPhone,
          clinicName: bookingClinic.name, department: bDept,
          appointmentDate: bDate, appointmentTime: bTime, reason: bReason,
        }),
      });
      setBookingSuccess(true);
    } catch {
      /* silent */
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Clinic Finder</h1>
          <p className="text-lg text-muted-foreground">Find English-speaking doctors and specialized clinics.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={findNearest} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
            <LocateFixed className="w-4 h-4" /> Find Nearest
          </Button>
          <Button onClick={() => setIsSymptomModalOpen(true)} className="bg-gradient-to-r from-accent to-primary hover:opacity-90 shadow-lg shadow-primary/20 gap-2 border-0">
            <Sparkles className="w-4 h-4 text-yellow-200" /> Find by Symptoms
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-card/80 backdrop-blur-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search clinic name..." className="pl-10 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-white">
            <option value="">All Departments</option>
            {["Internal Medicine","Dermatology","Dentistry","Ophthalmology","Orthopedics","ENT"].map(d => <option key={d}>{d}</option>)}
          </Select>
          <Select value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-white">
            <option value="">All Districts (Seoul)</option>
            <option value="Gangnam">Gangnam-gu</option>
            <option value="Itaewon">Itaewon (Yongsan)</option>
            <option value="Mapo">Mapo-gu</option>
            <option value="Jongno">Jongno-gu</option>
          </Select>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white">
            <option value="">Any Language</option>
            <option value="English">English</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3,4,5,6].map(i => <Card key={i} className="p-6 h-64 animate-pulse bg-muted/40" />)
        ) : clinics?.length ? (
          clinics.map((clinic, idx) => (
            <motion.div key={clinic.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
              <Card className="p-6 h-full flex flex-col hover:border-primary/50 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{clinic.name}</h3>
                    {clinic.nameKorean && <p className="text-sm text-muted-foreground">{clinic.nameKorean}</p>}
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" /> {clinic.rating || "4.5"}
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-start gap-2 text-sm text-foreground/80">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{clinic.address}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-foreground/80">
                    <Stethoscope className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {clinic.departments.map(d => <Badge key={d} variant="secondary" className="px-2 py-0 text-xs">{d}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-foreground/80">
                    <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span>{clinic.openHours || "09:00 - 18:00 (Mon-Fri)"}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex gap-2 shrink-0">
                    {clinic.hasNhis && <Badge variant="success" className="text-[10px]">NHIS</Badge>}
                    {clinic.languages?.includes("English") && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">ENG</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="gap-1.5 text-primary hover:bg-primary/10">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </Button>
                    <Button size="sm" className="gap-1.5 shadow-sm shadow-primary/20" onClick={() => openBooking(clinic as ClinicItem)}>
                      <CalendarDays className="w-3.5 h-3.5" /> Book
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No clinics found matching your criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setDepartment(""); setDistrict(""); setLanguage(""); }}>Clear Filters</Button>
          </div>
        )}
      </div>

      {/* Find Nearest Hospital Modal */}
      <Modal isOpen={nearestOpen} onClose={() => setNearestOpen(false)} title="Nearest Hospitals">
        <div className="space-y-4">
          {geoLoading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <LocateFixed className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Finding hospitals near you…</p>
                <p className="text-xs text-muted-foreground mt-1">Please allow location access if prompted</p>
              </div>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : geoError ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground opacity-30" />
              <p className="text-red-600 font-medium text-sm">{geoError}</p>
              <Button onClick={findNearest} variant="outline" className="gap-2">
                <LocateFixed className="w-4 h-4" /> Try Again
              </Button>
            </div>
          ) : (
            <>
              {userCoords && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-sm">
                  <Navigation className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Showing hospitals within <span className="font-semibold text-foreground">5 km</span> of your location, sorted by distance</span>
                </div>
              )}
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {nearbyList.map((hosp, idx) => {
                  const amenity = hosp.tags.amenity || "hospital";
                  const isHospital = amenity === "hospital";
                  const englishName = hosp.tags["name:en"] || hosp.tags["name:latin"];
                  const phone = hosp.tags.phone || hosp.tags["contact:phone"];
                  const emergency = hosp.tags.emergency === "yes";
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${hosp.lat},${hosp.lon}`;
                  return (
                    <motion.div key={hosp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                      <div className={`rounded-xl border p-4 flex gap-3 hover:border-primary/40 transition-colors ${isHospital ? "border-blue-200/60 bg-blue-50/30" : "border-border bg-card"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isHospital ? "bg-blue-100" : "bg-primary/10"}`}>
                          <span className="text-lg">{isHospital ? "🏥" : "🏨"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-foreground text-sm leading-snug truncate max-w-[220px]">{hosp.name}</p>
                              {englishName && englishName !== hosp.name && (
                                <p className="text-xs text-muted-foreground">{englishName}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {hosp.distanceKm < 1 ? `${Math.round(hosp.distanceKm * 1000)} m` : `${hosp.distanceKm.toFixed(1)} km`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {emergency && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">🚨 Emergency</span>}
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${isHospital ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{amenity}</span>
                            {phone && (
                              <a href={`tel:${phone}`} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                                <Phone className="w-2.5 h-2.5" />{phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 flex flex-col items-center justify-center gap-1 w-12 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary transition-colors border border-primary/10">
                          <Navigation className="w-4 h-4" />
                          <span className="text-[9px] font-semibold">Map</span>
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {nearbyList.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">Data from OpenStreetMap contributors · <button onClick={findNearest} className="text-primary hover:underline">Refresh</button></p>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Symptom Modal */}
      <Modal isOpen={isSymptomModalOpen} onClose={() => setIsSymptomModalOpen(false)} title="AI Symptom Matcher">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Describe your symptoms and Healix AI will recommend the appropriate department and filter clinics for you.</p>
          <Textarea placeholder="E.g., I've been experiencing a sharp pain in my lower right abdomen since last night…" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="min-h-[150px]" />
          <Button className="w-full" size="lg" onClick={handleSymptomSearch} disabled={!symptoms.trim() || recommendMutation.isPending}>
            {recommendMutation.isPending ? "Analyzing..." : "Find Relevant Clinics"}
          </Button>
        </div>
      </Modal>

      {/* Book Appointment Modal */}
      <Modal isOpen={!!bookingClinic} onClose={resetBooking} title="Book an Appointment">
        {bookingSuccess ? (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold">Appointment Requested!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your appointment request at <span className="font-semibold text-foreground">{bookingClinic?.name}</span> has been submitted. The clinic will confirm your booking.
            </p>
            <Button onClick={resetBooking} className="mt-2">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-4">
            {/* Clinic info header */}
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking at</p>
                <p className="text-sm font-semibold text-foreground">{bookingClinic?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="a-name">Patient Name *</Label>
                <Input id="a-name" placeholder="Full name" value={bName} onChange={e => setBName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-dept">Department *</Label>
                <select
                  id="a-dept"
                  value={bDept}
                  onChange={e => setBDept(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                >
                  {(bookingClinic?.departments ?? []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-date">Date *</Label>
                <Input id="a-date" type="date" value={bDate} onChange={e => setBDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-time">Preferred Time</Label>
                <Input id="a-time" type="time" value={bTime} onChange={e => setBTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-email">Email</Label>
                <Input id="a-email" type="email" placeholder="email@example.com" value={bEmail} onChange={e => setBEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-phone">Phone Number</Label>
                <Input id="a-phone" placeholder="+82-10-0000-0000" value={bPhone} onChange={e => setBPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="a-reason">Reason for Visit</Label>
              <textarea
                id="a-reason"
                value={bReason}
                onChange={e => setBReason(e.target.value)}
                rows={3}
                placeholder="Briefly describe your symptoms or reason for the visit…"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetBooking} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={bookingLoading} className="flex-1">
                {bookingLoading ? "Booking..." : "Confirm Appointment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <LoginPromptModal
        isOpen={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        actionLabel="book a clinic appointment"
      />

    </motion.div>
  );
}
