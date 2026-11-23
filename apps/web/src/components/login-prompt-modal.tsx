import { useAuthContext } from "@/contexts/auth-context";
import logoImg from "@assets/healix-logo.png";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionLabel?: string;
}

export default function LoginPromptModal({ isOpen, onClose, actionLabel = "this action" }: LoginPromptModalProps) {
  const { login } = useAuthContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-md"
          style={{ background: "linear-gradient(135deg, #0048b4 0%, #0066ff 100%)" }}
        >
          <img src={logoImg} alt="Healix" className="w-9 h-9 object-contain" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">Sign in to continue</h2>
        <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
          You need to be signed in to {actionLabel}. It only takes a moment.
        </p>

        <button
          onClick={() => { onClose(); login(); }}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all font-medium text-sm text-foreground shadow-sm mb-3"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
