import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Skeleton } from "boneyard-js/react";
import { loginWithGoogle } from "@/api/authApi";
import { useTheme } from "@/hooks/useTheme";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: { theme: string; size: string },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const navigate = useNavigate();
  const { darkMode, toggle: toggleTheme } = useTheme();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleInitialized = useRef(false);

  const googleMutation = useMutation({
    mutationFn: (credential: string) => loginWithGoogle(credential),
    onSuccess: () => {
      navigate("/");
    },
  });

  const googleCallbackRef = useRef(googleMutation.mutate);
  googleCallbackRef.current = googleMutation.mutate;

  const handleGoogleCredential = useCallback(
    (response: { credential: string }) => {
      googleCallbackRef.current(response.credential);
    },
    [],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const tryInit = () => {
      if (cancelled || !window.google?.accounts) {
        if (!cancelled) timeout = setTimeout(tryInit, 200);
        return;
      }
      if (googleInitialized.current) return;
      googleInitialized.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
        });
      }
    };

    tryInit();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
      googleInitialized.current = false;
    };
  }, [handleGoogleCredential]);

  return (
    <Skeleton
      name="page-login"
      loading={googleMutation.isPending}
      fallback={<LoginBoneyardFallback />}
      fixture={<LoginBoneyardFallback />}
      animate="shimmer"
      transition={180}
    >
    <div className="flex items-center justify-center p-4 inset-0 fixed w-full">
      <div
        className="w-full max-w-sm p-8  shadow-2xl space-y-8"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
      >
        <div className="text-center space-y-2 relative">
          <button
            onClick={toggleTheme}
            className="absolute -top-2 -right-2 w-9 h-9 flex items-center justify-center rounded-lg"
            style={{
              border: "1px solid var(--border-visible)",
              color: "var(--text-secondary)",
              background: "var(--surface)",
            }}
          >
            {darkMode ? "☀" : "☾"}
          </button>
          <h1
            className="text-4xl font-bold font-display"
            style={{ color: "var(--text-display)" }}
          >
            sesaKu
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Kelola pengeluaranmu dengan cerdas.
          </p>
        </div>

        {!GOOGLE_CLIENT_ID && (
          <div className="text-center py-4">
            <p className="text-[13px]" style={{ color: "var(--warning)" }}>
              Google Client ID belum dikonfigurasi.
            </p>
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--text-disabled)" }}
            >
              Set VITE_GOOGLE_CLIENT_ID di .env
            </p>
          </div>
        )}

        {GOOGLE_CLIENT_ID && (
          <div ref={googleBtnRef} className="flex justify-center" />
        )}

        <div className="pt-4 text-center">
          <p className="text-[11px]" style={{ color: "var(--text-disabled)" }}>
            © 2026 sesaKu. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    </Skeleton>
  );
}

function LoginBoneyardFallback() {
  return (
    <div className="flex items-center justify-center p-4 inset-0 fixed w-full" aria-hidden="true">
      <div
        className="w-full max-w-sm p-8 shadow-2xl space-y-8"
        style={{ background: "var(--surface)", border: "1px solid var(--border-visible)" }}
      >
        <div className="space-y-3">
          <div className="h-10 w-32 mx-auto rounded-lg" style={{ background: "var(--surface-raised)" }} />
          <div className="h-4 w-56 mx-auto rounded-lg" style={{ background: "var(--surface-raised)" }} />
        </div>
        <div className="h-11 w-full rounded-lg" style={{ background: "var(--surface-raised)" }} />
        <div className="h-3 w-40 mx-auto rounded-lg" style={{ background: "var(--surface-raised)" }} />
      </div>
    </div>
  );
}
