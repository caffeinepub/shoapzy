import { Button } from "@/components/ui/button";
import { createActorWithConfig } from "@/config";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { UserRole } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  LogIn,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function SetupAdmin() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["setupAdminRole", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!identity) return null;
      try {
        const actor = await createActorWithConfig({
          agentOptions: { identity },
        });
        return await actor.getCallerUserRole();
      } catch {
        return null;
      }
    },
    enabled: !!identity,
  });

  const principalId = identity?.getPrincipal().toString();

  async function handleClaimAdmin() {
    if (!identity) {
      setError("Please log in first.");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const actor = await createActorWithConfig({ agentOptions: { identity } });
      await actor.claimAdminRole();
      await queryClient.invalidateQueries({ queryKey: ["setupAdminRole"] });
      await queryClient.invalidateQueries({ queryKey: ["role"] });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (String(err) ?? "An unexpected error occurred.");
      setError(msg);
    } finally {
      setIsPending(false);
    }
  }

  if (!identity) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow p-10 max-w-md w-full text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#e8f0fe" }}
          >
            <LogIn className="w-7 h-7" style={{ color: "#2874f0" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Login Required
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            You must be logged in to set up an admin account.
          </p>
          <Link to="/login">
            <Button
              data-ocid="setup_admin.login_button"
              className="text-white w-full"
              style={{ background: "#2874f0" }}
            >
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center"
      >
        <Loader2
          data-ocid="setup_admin.loading_state"
          className="w-8 h-8 animate-spin"
          style={{ color: "#2874f0" }}
        />
      </div>
    );
  }

  if (role === UserRole.admin || success) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-2">
            You are an Admin!
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Your account has admin privileges. Head to the dashboard to manage
            the platform.
          </p>
          <Link to="/admin">
            <Button
              data-ocid="setup_admin.admin_dashboard_button"
              className="text-white w-full"
              style={{ background: "#2874f0" }}
            >
              Go to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ background: "#f1f3f6" }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow w-full max-w-md overflow-hidden">
        {/* Blue header */}
        <div
          style={{ background: "#2874f0" }}
          className="px-6 py-5 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="text-white text-lg font-extrabold tracking-tight">
              Shoapzy
            </span>
          </div>
          <h1 className="text-white text-base font-bold">Admin Setup</h1>
          <p className="text-blue-100 text-xs mt-1">
            Claim admin role for your account
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
              Your Principal ID
            </p>
            <p className="text-xs font-mono text-gray-600 break-all">
              {principalId}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">One-time setup:</span> Click below
              to claim the admin role for your account. This should only be done
              once by the platform owner.
            </p>
          </div>

          {error && (
            <div
              data-ocid="setup_admin.error_state"
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            data-ocid="setup_admin.primary_button"
            onClick={handleClaimAdmin}
            disabled={isPending}
            className="w-full text-white py-5 text-base font-semibold disabled:opacity-50"
            style={{ background: "#2874f0" }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming Admin Role...
              </>
            ) : (
              "Claim Admin Role"
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold underline"
              style={{ color: "#2874f0" }}
            >
              Go to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
