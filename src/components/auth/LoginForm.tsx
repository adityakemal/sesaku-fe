import React from "react";

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1">
        <label
          className="text-[12px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@cubybot.net"
          className="w-full h-12 px-4 rounded-xl text-[14px] transition-all"
          style={{
            border: "1px solid var(--border-visible)",
            background: "var(--black)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
      </div>

      <div className="space-y-1">
        <label
          className="text-[12px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full h-12 px-4 rounded-xl text-[14px] transition-all"
          style={{
            border: "1px solid var(--border-visible)",
            background: "var(--black)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <p
          className="text-[12px] text-center"
          style={{ color: "var(--accent)" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
        style={{
          background: "var(--accent)",
          color: "white",
          border: "none",
          fontSize: "14px",
        }}
      >
        {loading ? "Masuk..." : "Masuk"}
      </button>
    </form>
  );
};