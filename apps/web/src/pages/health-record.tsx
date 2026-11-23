import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, Button, Badge, Modal, Input, Label } from "@/components/shared-ui";
import { Edit3, HeartPulse, Activity, AlertCircle, FileText, Droplet, Calendar, Save, Camera, Loader2 } from "lucide-react";
import { useGetHealthRecord, useUpdateHealthRecord, useGetVisits, useAddVisit } from "@workspace/api-client-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/auth-context";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function HealthRecord() {
  const { user } = useAuthContext();
  const { data: record, isLoading: loadingRecord } = useGetHealthRecord();
  const { data: visits, isLoading: loadingVisits } = useGetVisits();

  const updateMutation = useUpdateHealthRecord();
  const visitMutation = useAddVisit();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);

  // Profile picture upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const size = 300;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        // Crop center square then draw
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setPhotoPreview(dataUrl);
        uploadPhoto(dataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadPhoto = async (dataUrl: string) => {
    setPhotoUploading(true);
    try {
      await fetch(`${BASE}/api/auth/profile-image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      // Refresh auth user without full page reload
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } finally {
      setPhotoUploading(false);
    }
  };
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [isAllergyOpen, setIsAllergyOpen] = useState(false);
  const [newAllergen, setNewAllergen] = useState("");
  const [newSeverity, setNewSeverity] = useState("mild");

  // Profile form state
  const [fName, setFName] = useState("");
  const [fNationality, setFNationality] = useState("");
  const [fDob, setFDob] = useState("");
  const [fBlood, setFBlood] = useState("");
  const [fHeight, setFHeight] = useState("");
  const [fWeight, setFWeight] = useState("");
  const [fNhis, setFNhis] = useState("");

  // Vitals form state
  const [fBp, setFBp] = useState("");
  const [fHr, setFHr] = useState("");
  const [fTemp, setFTemp] = useState("");
  const [fSpo2, setFSpo2] = useState("");

  // Visit form state
  const [vClinic, setVClinic] = useState("");
  const [vDept, setVDept] = useState("");
  const [vDate, setVDate] = useState("");
  const [vDiag, setVDiag] = useState("");
  const [vCost, setVCost] = useState("0");

  const profile = record || {
    id: 0,
    fullName: "John Doe",
    nationality: "United States",
    dateOfBirth: "1990-01-01",
    bloodType: "O+",
    height: 180,
    weight: 75,
    bmi: 23.1,
    allergies: [] as { id: number; allergen: string; severity: string }[],
    vitals: { bloodPressure: "120/80", heartRate: 72, temperature: 36.6, oxygenSaturation: 98 },
    nhisNumber: "1234-5678-9012",
  };

  const openEditProfile = () => {
    setFName(profile.fullName || "");
    setFNationality((profile as any).nationality || "");
    setFDob((profile as any).dateOfBirth || "");
    setFBlood((profile as any).bloodType || "");
    setFHeight(String(profile.height || ""));
    setFWeight(String(profile.weight || ""));
    setFNhis((profile as any).nhisNumber || "");
    setIsEditOpen(true);
  };

  const openEditVitals = () => {
    const v = (profile as any).vitals || {};
    setFBp(v.bloodPressure || "");
    setFHr(String(v.heartRate || ""));
    setFTemp(String(v.temperature || ""));
    setFSpo2(String(v.oxygenSaturation || ""));
    setIsVitalsOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(fHeight);
    const w = parseFloat(fWeight);
    updateMutation.mutate({
      data: {
        fullName: fName,
        nationality: fNationality,
        dateOfBirth: fDob,
        bloodType: fBlood,
        height: isNaN(h) ? undefined : h,
        weight: isNaN(w) ? undefined : w,
        nhisNumber: fNhis,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/health-record"] });
        setIsEditOpen(false);
      }
    });
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      data: {
        vitals: {
          bloodPressure: fBp,
          heartRate: fHr ? Number(fHr) : undefined,
          temperature: fTemp ? parseFloat(fTemp) : undefined,
          oxygenSaturation: fSpo2 ? Number(fSpo2) : undefined,
        }
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/health-record"] });
        setIsVitalsOpen(false);
      }
    });
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergen.trim()) return;
    const existing: any[] = Array.isArray(profile.allergies) ? profile.allergies : [];
    const normalized = existing.map((a: any) =>
      typeof a === "string" ? { id: Date.now() + Math.random(), allergen: a, severity: "unknown" } : a
    );
    const updated = [...normalized, { id: Date.now(), allergen: newAllergen.trim(), severity: newSeverity }];
    updateMutation.mutate({ data: { allergies: updated } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/health-record"] });
        setIsAllergyOpen(false);
        setNewAllergen("");
        setNewSeverity("mild");
      }
    });
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    visitMutation.mutate({
      data: { clinicName: vClinic, department: vDept, date: vDate, diagnosis: vDiag, cost: Number(vCost) || 0 }
    }, {
      onSuccess: () => {
        setIsVisitOpen(false);
        setVClinic(""); setVDept(""); setVDate(""); setVDiag(""); setVCost("0");
        queryClient.invalidateQueries({ queryKey: ["/api/health-record/visits"] });
      }
    });
  };

  if (loadingRecord) {
    return <div className="p-12 text-center animate-pulse text-lg text-muted-foreground">Loading Health Profile...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-6xl mx-auto pb-12">

      {/* Header Card */}
      <Card className="p-8 bg-gradient-to-br from-primary to-blue-800 text-white overflow-hidden relative border-0">
        <div className="absolute right-0 top-0 opacity-10 scale-150">
          <HeartPulse className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative shrink-0 group">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md p-1 border-2 border-white/30 overflow-hidden flex items-center justify-center">
              {(photoPreview || user?.profileImageUrl) ? (
                <img src={photoPreview || user!.profileImageUrl!} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white text-4xl font-bold select-none">
                  {profile.fullName
                    ? profile.fullName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
                    : "?"}
                </span>
              )}
            </div>
            {/* Camera edit overlay */}
            <button onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Change profile photo">
              {photoUploading
                ? <Loader2 className="w-7 h-7 text-white animate-spin" />
                : <><Camera className="w-7 h-7 text-white" /><span className="text-white text-xs font-medium">Change</span></>
              }
            </button>
            {/* Small camera badge */}
            <button onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-primary hover:bg-primary hover:text-white transition-colors group-hover:opacity-0"
              title="Change profile photo">
              {photoUploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Camera className="w-4 h-4 text-primary" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{profile.fullName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-white/80">
                  <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                    <GlobeIcon className="w-4 h-4" /> {(profile as any).nationality || "N/A"}
                  </span>
                  <span className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                    <Calendar className="w-4 h-4" /> {formatDate((profile as any).dateOfBirth)}
                  </span>
                  <span className="flex items-center gap-1 bg-rose-500/30 text-rose-100 px-3 py-1 rounded-full text-sm font-medium border border-rose-400/30">
                    <Droplet className="w-4 h-4 fill-current" /> Type {(profile as any).bloodType || "?"}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={openEditProfile}>
                <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Height</div>
                <div className="font-bold text-xl">{profile.height || "--"} <span className="text-sm font-normal text-white/70">cm</span></div>
              </div>
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Weight</div>
                <div className="font-bold text-xl">{profile.weight || "--"} <span className="text-sm font-normal text-white/70">kg</span></div>
              </div>
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">BMI</div>
                <div className="font-bold text-xl">{(profile as any).bmi || "--"}</div>
              </div>
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">NHIS No.</div>
                <div className="font-bold font-mono text-base">{(profile as any).nhisNumber || "Unregistered"}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6 md:col-span-1">
          {/* Vitals */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Current Vitals</h3>
              <Button size="sm" variant="outline" onClick={openEditVitals}>
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Blood Pressure", value: (profile as any).vitals?.bloodPressure || "--" },
                { label: "Heart Rate", value: (profile as any).vitals?.heartRate ? `${(profile as any).vitals.heartRate} bpm` : "--" },
                { label: "Temperature", value: (profile as any).vitals?.temperature ? `${(profile as any).vitals.temperature}°C` : "--" },
                { label: "Oxygen (SpO2)", value: (profile as any).vitals?.oxygenSaturation ? `${(profile as any).vitals.oxygenSaturation}%` : "--" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                  <span className="text-muted-foreground text-sm font-medium">{label}</span>
                  <span className="font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Allergies */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-500" /> Allergies</h3>
              <Button size="sm" variant="outline" onClick={() => setIsAllergyOpen(true)} className="border-rose-200 text-rose-600 hover:bg-rose-50">
                + Add
              </Button>
            </div>
            {profile.allergies && profile.allergies.length > 0 ? (
              <div className="space-y-3">
                {profile.allergies.map((a: any, idx: number) => {
                  const allergen = typeof a === "string" ? a : a.allergen;
                  const severity = typeof a === "string" ? null : a.severity;
                  return (
                    <div key={a.id ?? idx} className="flex justify-between items-center p-3 border border-rose-100 bg-rose-50/50 rounded-xl">
                      <span className="font-semibold text-rose-900">{allergen}</span>
                      {severity && (
                        <Badge variant={severity === "severe" ? "danger" : "outline"}>
                          {severity}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">No known allergies</p>
            )}
          </Card>
        </div>

        {/* Right Column (Visits) */}
        <div className="md:col-span-2">
          <Card className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Medical History</h3>
              <Button size="sm" variant="outline" onClick={() => setIsVisitOpen(true)}>Add Visit</Button>
            </div>
            <div className="flex-1 space-y-4">
              {loadingVisits ? (
                <div className="animate-pulse space-y-4">{[1, 2].map(i => <div key={i} className="h-24 bg-muted/50 rounded-xl" />)}</div>
              ) : visits && visits.length > 0 ? (
                visits.map((v: any) => (
                  <div key={v.id} className="relative pl-6 pb-6 border-l-2 border-border last:border-0 last:pb-0">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                    <div className="bg-card border border-border shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-foreground">{v.clinicName}</h4>
                          <div className="flex gap-2 items-center mt-1">
                            <Badge variant="secondary" className="text-xs">{v.department}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(v.date)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-foreground">{formatCurrency(v.cost)}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Total Cost</div>
                        </div>
                      </div>
                      {v.diagnosis && (
                        <p className="text-sm text-foreground/80 bg-muted/30 p-3 rounded-lg border border-border/50">
                          <span className="font-semibold mr-1">Diagnosis:</span> {v.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>No hospital visits recorded.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <Label className="mb-1 block">Full Name</Label>
            <Input value={fName} onChange={e => setFName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Nationality</Label>
              <Input value={fNationality} onChange={e => setFNationality(e.target.value)} placeholder="United States" />
            </div>
            <div>
              <Label className="mb-1 block">Date of Birth</Label>
              <Input type="date" value={fDob} onChange={e => setFDob(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="mb-1 block">Blood Type</Label>
              <Input value={fBlood} onChange={e => setFBlood(e.target.value)} placeholder="O+" />
            </div>
            <div>
              <Label className="mb-1 block">Height (cm)</Label>
              <Input type="number" value={fHeight} onChange={e => setFHeight(e.target.value)} placeholder="180" />
            </div>
            <div>
              <Label className="mb-1 block">Weight (kg)</Label>
              <Input type="number" value={fWeight} onChange={e => setFWeight(e.target.value)} placeholder="75" />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">NHIS Number</Label>
            <Input value={fNhis} onChange={e => setFNhis(e.target.value)} placeholder="1234-5678-9012" />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Modal>

      {/* Edit Vitals Modal */}
      <Modal isOpen={isVitalsOpen} onClose={() => setIsVitalsOpen(false)} title="Update Vitals">
        <form onSubmit={handleSaveVitals} className="space-y-4">
          <div>
            <Label className="mb-1 block">Blood Pressure (e.g. 120/80)</Label>
            <Input value={fBp} onChange={e => setFBp(e.target.value)} placeholder="120/80" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="mb-1 block">Heart Rate (bpm)</Label>
              <Input type="number" value={fHr} onChange={e => setFHr(e.target.value)} placeholder="72" />
            </div>
            <div>
              <Label className="mb-1 block">Temperature (°C)</Label>
              <Input type="number" step="0.1" value={fTemp} onChange={e => setFTemp(e.target.value)} placeholder="36.6" />
            </div>
            <div>
              <Label className="mb-1 block">SpO2 (%)</Label>
              <Input type="number" value={fSpo2} onChange={e => setFSpo2(e.target.value)} placeholder="98" />
            </div>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Vitals"}
          </Button>
        </form>
      </Modal>

      {/* Add Allergy Modal */}
      <Modal isOpen={isAllergyOpen} onClose={() => setIsAllergyOpen(false)} title="Add Allergy">
        <form onSubmit={handleAddAllergy} className="space-y-4">
          <div>
            <Label className="mb-1 block">Allergen Name <span className="text-destructive">*</span></Label>
            <Input
              value={newAllergen}
              onChange={e => setNewAllergen(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts, Latex"
              required
            />
          </div>
          <div>
            <Label className="mb-1 block">Severity</Label>
            <select
              value={newSeverity}
              onChange={e => setNewSeverity(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-2 bg-rose-600 hover:bg-rose-700" disabled={updateMutation.isPending || !newAllergen.trim()}>
            {updateMutation.isPending ? "Saving..." : "Add Allergy"}
          </Button>
        </form>
      </Modal>

      {/* Add Visit Modal */}
      <Modal isOpen={isVisitOpen} onClose={() => setIsVisitOpen(false)} title="Record a Visit">
        <form onSubmit={handleAddVisit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Clinic / Hospital Name</Label>
              <Input required value={vClinic} onChange={e => setVClinic(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Date</Label>
              <Input type="date" required value={vDate} onChange={e => setVDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Department</Label>
            <Input required value={vDept} onChange={e => setVDept(e.target.value)} placeholder="E.g., Internal Medicine" />
          </div>
          <div>
            <Label className="mb-1 block">Diagnosis / Reason for visit</Label>
            <Input value={vDiag} onChange={e => setVDiag(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Total Cost (KRW)</Label>
            <Input type="number" value={vCost} onChange={e => setVCost(e.target.value)} />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={visitMutation.isPending}>
            {visitMutation.isPending ? "Saving..." : "Save Record"}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
