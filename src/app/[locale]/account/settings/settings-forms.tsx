"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AvatarUploader } from "@/components/avatar-uploader";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
} from "@/app/actions/account";

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_profile_public: boolean;
};

export function SettingsForms({
  profile,
  currentEmail,
  userId,
}: {
  profile: Profile;
  currentEmail: string;
  userId: string;
}) {
  return (
    <div className="space-y-6">
      <ProfileSection profile={profile} userId={userId} />
      <EmailSection currentEmail={currentEmail} />
      <PasswordSection />
      <DangerSection username={profile.username} />
    </div>
  );
}

function SectionShell({
  title,
  subtitle,
  danger,
  children,
}: {
  title: string;
  subtitle?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={
        danger
          ? "p-6 border-[var(--color-accent)]/30"
          : "p-6"
      }
    >
      <div className="mb-5">
        <h3
          className={
            danger
              ? "text-base font-semibold text-[var(--color-accent)]"
              : "text-base font-semibold"
          }
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-foreground-muted)] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </Card>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">
      {children}
    </label>
  );
}

function ProfileSection({
  profile,
  userId,
}: {
  profile: Profile;
  userId: string;
}) {
  const t = useTranslations("account.settings");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [, setAvatarUrl] = useState<string | null>(profile.avatar_url);

  return (
    <SectionShell title={t("profile")} subtitle={t("profileSubtitle")}>
      <form
        action={async (fd) => {
          setSubmitting(true);
          setError(null);
          setSaved(false);
          const res = await updateProfile(fd);
          setSubmitting(false);
          if (res && "error" in res) {
            setError(t(res.error as "errorGeneric"));
          } else {
            setSaved(true);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label>{t("username")}</Label>
          <Input
            name="username"
            defaultValue={profile.username}
            required
            minLength={3}
            maxLength={24}
            pattern="[a-z0-9_]+"
          />
          <p className="text-xs text-[var(--color-foreground-subtle)]">
            {t("usernameHelp")}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>{t("displayName")}</Label>
          <Input
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("bio")}</Label>
          <Textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            maxLength={280}
            placeholder={t("bioPlaceholder")}
            className="min-h-20"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("avatar")}</Label>
          <AvatarUploader
            userId={userId}
            username={profile.username}
            initialUrl={profile.avatar_url}
            onChange={setAvatarUrl}
          />
        </div>

        <label className="flex items-start gap-3 p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] cursor-pointer">
          <input
            type="checkbox"
            name="is_profile_public"
            defaultChecked={profile.is_profile_public}
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)] bg-[var(--color-surface)] accent-[var(--color-accent)]"
          />
          <div className="min-w-0">
            <div className="text-sm font-medium">{t("publicProfile")}</div>
            <p className="text-xs text-[var(--color-foreground-subtle)] mt-0.5">
              {t("publicProfileHint")}
            </p>
          </div>
        </label>

        {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}
        {saved && !error && (
          <p className="text-sm text-[var(--color-success)]">
            {t("profileSaved")}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={submitting}>
            {t("saveProfile")}
          </Button>
        </div>
      </form>
    </SectionShell>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("account.settings");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <SectionShell title={t("email")} subtitle={t("emailSubtitle")}>
      <form
        action={async (fd) => {
          setSubmitting(true);
          setError(null);
          setSent(false);
          const res = await updateEmail(fd);
          setSubmitting(false);
          if (res && "error" in res) {
            setError(t(res.error as "errorGeneric"));
          } else {
            setSent(true);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label>{t("email")}</Label>
          <Input value={currentEmail} disabled readOnly />
        </div>
        <div className="space-y-1.5">
          <Label>{t("newEmail")}</Label>
          <Input name="email" type="email" required autoComplete="email" />
        </div>
        {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}
        {sent && !error && (
          <p className="text-sm text-[var(--color-success)]">{t("emailSent")}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={submitting}>
            {t("saveEmail")}
          </Button>
        </div>
      </form>
    </SectionShell>
  );
}

function PasswordSection() {
  const t = useTranslations("account.settings");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  return (
    <SectionShell title={t("password")} subtitle={t("passwordSubtitle")}>
      <form
        action={async (fd) => {
          setSubmitting(true);
          setError(null);
          setSaved(false);
          if (pw !== pw2) {
            setSubmitting(false);
            setError(t("passwordMismatch"));
            return;
          }
          fd.set("password", pw);
          const res = await updatePassword(fd);
          setSubmitting(false);
          if (res && "error" in res) {
            setError(t(res.error as "errorGeneric"));
          } else {
            setSaved(true);
            setPw("");
            setPw2("");
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label>{t("newPassword")}</Label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("confirmPassword")}</Label>
          <Input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-[var(--color-accent)]">{error}</p>}
        {saved && !error && (
          <p className="text-sm text-[var(--color-success)]">
            {t("passwordSaved")}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={submitting}>
            {t("savePassword")}
          </Button>
        </div>
      </form>
    </SectionShell>
  );
}

function DangerSection({ username }: { username: string }) {
  const t = useTranslations("account.settings");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <SectionShell title={t("danger")} subtitle={t("dangerSubtitle")} danger>
      {!open ? (
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="border-[var(--color-accent)]/40 text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
          >
            {t("deleteAccount")}
          </Button>
        </div>
      ) : (
        <form
          action={async (fd) => {
            setSubmitting(true);
            setError(null);
            fd.set("confirm_username", confirm);
            const res = await deleteAccount(fd);
            if (res && "error" in res) {
              setSubmitting(false);
              setError(t(res.error as "errorGeneric"));
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>
              {t("deleteAccountConfirm")} (<code>{username}</code>)
            </Label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              className="border-[var(--color-accent)]/40"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-accent)]">{error}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              disabled={submitting}
            >
              ✕
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={submitting || confirm.trim().toLowerCase() !== username}
            >
              {submitting ? t("deleting") : t("deleteAccountButton")}
            </Button>
          </div>
        </form>
      )}
    </SectionShell>
  );
}
