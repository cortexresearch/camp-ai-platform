"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { signup, login, logout, getCurrentUser, requestPasswordReset, resetPassword, type UserRole } from "./auth";
import { pool } from "./db";
import { getEpisodes, episodeCode, type EpisodeStatus } from "./season";

const UPLOAD_DIR = "/data/uploads";
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MAX_HTML_DEMO_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function saveImageUpload(file: File, label = "Image"): Promise<string> {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) throw new Error(`${label} must be a PNG, JPG, WEBP, or GIF image.`);
  if (file.size > MAX_SCREENSHOT_BYTES) throw new Error(`${label} must be under 5MB.`);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return filename;
}

// Best-effort screenshot of a build's demo URL, used when the builder didn't
// upload one themselves. Never throws — a failed capture just leaves the
// screenshot blank, same as if nothing had been provided.
async function captureScreenshot(demoUrl: string): Promise<string | null> {
  try {
    const api = `https://api.microlink.io/?url=${encodeURIComponent(demoUrl)}&screenshot=true&meta=false`;
    const res = await fetch(api, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const json = await res.json();
    const shotUrl = json?.data?.screenshot?.url;
    if (!shotUrl) return null;

    const imgRes = await fetch(shotUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) return null;
    const bytes = Buffer.from(await imgRes.arrayBuffer());

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}.png`;
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
    return filename;
  } catch {
    return null;
  }
}

async function saveHtmlDemo(file: File): Promise<string> {
  const looksLikeHtml = file.name.toLowerCase().endsWith(".html") && (file.type === "" || file.type === "text/html");
  if (!looksLikeHtml) throw new Error("Static demo must be a single .html file.");
  if (file.size > MAX_HTML_DEMO_BYTES) throw new Error("Static demo HTML must be under 2MB.");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.html`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return filename;
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "builder") as UserRole;
  const handle = String(formData.get("handle") ?? "");

  const result = await signup(name, email, password, role, handle);
  if ("error" in result) redirect(`/signup?error=${encodeURIComponent(result.error)}`);
  redirect("/submit");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await login(email, password);
  if ("error" in result) redirect(`/login?error=${encodeURIComponent(result.error)}`);
  redirect("/submit");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    try {
      await requestPasswordReset(email);
    } catch (err) {
      console.error("password reset request failed", err);
    }
  }
  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 8) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("New passwords don't match.")}`);
  }

  const result = await resetPassword(token, newPassword);
  if ("error" in result) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/login?success=${encodeURIComponent("Password reset. Log in with your new password.")}`);
}

function parseMobileFriendly(value: FormDataEntryValue | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function submitBuildAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const howItWorks = String(formData.get("how_it_works") ?? "").trim();
  const modelsUsed = String(formData.get("models_used") ?? "").trim();
  const tokenCost = String(formData.get("token_cost") ?? "").trim();
  const promptsIssues = String(formData.get("prompts_issues") ?? "").trim();
  const demoUrl = String(formData.get("demo_url") ?? "").trim();
  const repoUrl = String(formData.get("repo_url") ?? "").trim();
  const episodeNumber = Number(formData.get("episode_number") ?? "");
  const screenshot = formData.get("screenshot");
  const htmlDemo = formData.get("html_demo");
  const mobileFriendly = parseMobileFriendly(formData.get("mobile_friendly"));

  if (!title || !howItWorks || !modelsUsed || !promptsIssues) {
    redirect("/submit?error=" + encodeURIComponent("Fill in what you made, how it works, models used, and your prompts/issues."));
  }

  const episodes = await getEpisodes();
  const episode = episodes.find((e) => e.number === episodeNumber);
  if (!episode) redirect("/submit?error=" + encodeURIComponent("Choose a valid episode."));

  let screenshotPath = "";
  if (screenshot instanceof File && screenshot.size > 0) {
    try {
      screenshotPath = await saveImageUpload(screenshot, "Screenshot");
    } catch (err) {
      redirect("/submit?error=" + encodeURIComponent(err instanceof Error ? err.message : "Could not save screenshot."));
    }
  } else if (demoUrl) {
    screenshotPath = (await captureScreenshot(demoUrl)) ?? "";
  }

  let htmlDemoPath = "";
  if (htmlDemo instanceof File && htmlDemo.size > 0) {
    try {
      htmlDemoPath = await saveHtmlDemo(htmlDemo);
    } catch (err) {
      redirect("/submit?error=" + encodeURIComponent(err instanceof Error ? err.message : "Could not save static demo."));
    }
  }

  const inserted = await pool.query<{ id: string }>(
    `insert into builds (user_id, episode, title, how_it_works, models_used, token_cost, prompts_issues, demo_url, repo_url, screenshot_path, html_demo_path, mobile_friendly)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning id`,
    [user!.id, episodeCode(episode!), title, howItWorks, modelsUsed, tokenCost, promptsIssues, demoUrl, repoUrl, screenshotPath, htmlDemoPath, mobileFriendly]
  );

  await pool.query(
    `insert into portfolio_items (user_id, build_id, title, url, description) values ($1, $2, $3, $4, $5)`,
    [user!.id, inserted.rows[0].id, title, demoUrl || `/builds/${inserted.rows[0].id}`, howItWorks]
  );

  revalidatePath("/builds");
  revalidatePath(`/u/${user!.handle}`);
  redirect("/builds?submitted=1");
}

export async function updateBuildAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const buildId = String(formData.get("build_id") ?? "");
  const existing = await pool.query<{ user_id: string; screenshot_path: string; html_demo_path: string }>(
    `select user_id, screenshot_path, html_demo_path from builds where id = $1`,
    [buildId]
  );
  const build = existing.rows[0];
  if (!build || build.user_id !== user!.id) redirect("/builds");

  const title = String(formData.get("title") ?? "").trim();
  const howItWorks = String(formData.get("how_it_works") ?? "").trim();
  const modelsUsed = String(formData.get("models_used") ?? "").trim();
  const tokenCost = String(formData.get("token_cost") ?? "").trim();
  const promptsIssues = String(formData.get("prompts_issues") ?? "").trim();
  const demoUrl = String(formData.get("demo_url") ?? "").trim();
  const repoUrl = String(formData.get("repo_url") ?? "").trim();
  const episodeNumber = Number(formData.get("episode_number") ?? "");
  const screenshot = formData.get("screenshot");
  const htmlDemo = formData.get("html_demo");
  const mobileFriendly = parseMobileFriendly(formData.get("mobile_friendly"));

  if (!title || !howItWorks || !modelsUsed || !promptsIssues) {
    redirect(`/builds/${buildId}/edit?error=` + encodeURIComponent("Fill in what you made, how it works, models used, and your prompts/issues."));
  }

  const episodes = await getEpisodes();
  const episode = episodes.find((e) => e.number === episodeNumber);
  if (!episode) redirect(`/builds/${buildId}/edit?error=` + encodeURIComponent("Choose a valid episode."));

  let screenshotPath = build.screenshot_path;
  if (screenshot instanceof File && screenshot.size > 0) {
    try {
      screenshotPath = await saveImageUpload(screenshot, "Screenshot");
    } catch (err) {
      redirect(`/builds/${buildId}/edit?error=` + encodeURIComponent(err instanceof Error ? err.message : "Could not save screenshot."));
    }
  }

  let htmlDemoPath = build.html_demo_path;
  if (htmlDemo instanceof File && htmlDemo.size > 0) {
    try {
      htmlDemoPath = await saveHtmlDemo(htmlDemo);
    } catch (err) {
      redirect(`/builds/${buildId}/edit?error=` + encodeURIComponent(err instanceof Error ? err.message : "Could not save static demo."));
    }
  }

  await pool.query(
    `update builds set episode = $1, title = $2, how_it_works = $3, models_used = $4, token_cost = $5,
            prompts_issues = $6, demo_url = $7, repo_url = $8, screenshot_path = $9, html_demo_path = $10, mobile_friendly = $11
     where id = $12`,
    [episodeCode(episode!), title, howItWorks, modelsUsed, tokenCost, promptsIssues, demoUrl, repoUrl, screenshotPath, htmlDemoPath, mobileFriendly, buildId]
  );

  await pool.query(
    `insert into portfolio_items (user_id, build_id, title, url, description) values ($1, $2, $3, $4, $5)
     on conflict (build_id) where build_id is not null
     do update set title = excluded.title, url = excluded.url, description = excluded.description`,
    [user!.id, buildId, title, demoUrl || `/builds/${buildId}`, howItWorks]
  );

  revalidatePath("/builds");
  revalidatePath(`/builds/${buildId}/edit`);
  revalidatePath(`/u/${user!.handle}`);
  redirect("/builds?updated=1");
}

const RATING_CATEGORIES = ["name", "pitch", "product", "ui"] as const;
const RATING_EDIT_WINDOW_MINUTES = 10;

export async function rateAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildId = String(formData.get("build_id") ?? "");
  const category = String(formData.get("category") ?? "");
  const stars = Number(formData.get("stars") ?? "");
  if (!user) redirect("/login");
  if (!buildId || !RATING_CATEGORIES.includes(category as (typeof RATING_CATEGORIES)[number])) return;
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return;

  // Votes can be changed within RATING_EDIT_WINDOW of the original cast, timed
  // from the original created_at (not extended by the edit itself).
  await pool.query(
    `insert into ratings (build_id, user_id, category, stars) values ($1, $2, $3, $4)
     on conflict (build_id, user_id, category) do update
     set stars = excluded.stars
     where ratings.created_at > now() - interval '${RATING_EDIT_WINDOW_MINUTES} minutes'`,
    [buildId, user!.id, category, stars]
  );

  revalidatePath("/builds");
  revalidatePath(`/builds/${buildId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/");
}

const MAX_COMMENT_LENGTH = 2000;

export async function addCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  const buildId = String(formData.get("build_id") ?? "");
  if (!user) redirect("/login");
  if (!buildId) return;

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/builds/${buildId}?error=${encodeURIComponent("Comment can't be empty.")}`);
  if (body.length > MAX_COMMENT_LENGTH) {
    redirect(`/builds/${buildId}?error=${encodeURIComponent(`Comment must be under ${MAX_COMMENT_LENGTH} characters.`)}`);
  }

  await pool.query(
    `insert into comments (build_id, user_id, body) values ($1, $2, $3)`,
    [buildId, user!.id, body]
  );

  revalidatePath(`/builds/${buildId}`);
  redirect(`/builds/${buildId}`);
}

export async function deleteCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const commentId = String(formData.get("comment_id") ?? "");
  if (!commentId) return;

  const existing = await pool.query<{ build_id: string; user_id: string }>(
    `select build_id, user_id from comments where id = $1`,
    [commentId]
  );
  const comment = existing.rows[0];
  if (!comment) return;
  if (comment.user_id !== user!.id && !user!.is_admin) return;

  await pool.query(`delete from comments where id = $1`, [commentId]);

  revalidatePath(`/builds/${comment.build_id}`);
}

async function deleteUpload(filename: string) {
  if (!filename) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // already gone or never existed — nothing to clean up
  }
}

export async function removeHtmlDemoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const buildId = String(formData.get("build_id") ?? "");
  const existing = await pool.query<{ user_id: string; html_demo_path: string }>(
    `select user_id, html_demo_path from builds where id = $1`,
    [buildId]
  );
  const build = existing.rows[0];
  if (!build || build.user_id !== user!.id) redirect("/builds");

  await deleteUpload(build.html_demo_path);
  await pool.query(`update builds set html_demo_path = '' where id = $1`, [buildId]);

  revalidatePath("/builds");
  revalidatePath(`/builds/${buildId}`);
  revalidatePath(`/builds/${buildId}/edit`);
  redirect(`/builds/${buildId}/edit?updated=1`);
}

export async function deleteBuildAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const buildId = String(formData.get("build_id") ?? "");
  const existing = await pool.query<{ user_id: string; screenshot_path: string; html_demo_path: string }>(
    `select user_id, screenshot_path, html_demo_path from builds where id = $1`,
    [buildId]
  );
  const build = existing.rows[0];
  if (!build || build.user_id !== user!.id) redirect("/builds");

  await pool.query(`delete from builds where id = $1`, [buildId]);
  await deleteUpload(build.screenshot_path);
  await deleteUpload(build.html_demo_path);

  revalidatePath("/builds");
  revalidatePath("/leaderboard");
  revalidatePath("/");
  revalidatePath(`/u/${user!.handle}`);
  redirect("/builds?deleted=1");
}

export async function addPortfolioItemAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) redirect(`/u/${user!.handle}?error=${encodeURIComponent("Give your work a title.")}`);

  await pool.query(
    `insert into portfolio_items (user_id, title, url, description) values ($1, $2, $3, $4)`,
    [user!.id, title, url, description]
  );

  revalidatePath(`/u/${user!.handle}`);
  redirect(`/u/${user!.handle}`);
}

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const avatar = formData.get("avatar");

  if (!name) redirect(`/u/${user!.handle}?error=${encodeURIComponent("Enter your name.")}`);
  if (!/^[a-z0-9-]{3,24}$/.test(handle)) {
    redirect(`/u/${user!.handle}?error=${encodeURIComponent("Handle must be 3-24 characters: lowercase letters, numbers, and hyphens only.")}`);
  }

  if (handle !== user!.handle) {
    const existingHandle = await pool.query("select id from users where handle = $1", [handle]);
    if (existingHandle.rowCount) {
      redirect(`/u/${user!.handle}?error=${encodeURIComponent("That handle is taken. Try another.")}`);
    }
  }

  const existing = await pool.query<{ avatar_path: string }>("select avatar_path from users where id = $1", [user!.id]);
  let avatarPath = existing.rows[0]?.avatar_path ?? "";
  if (avatar instanceof File && avatar.size > 0) {
    try {
      const newAvatarPath = await saveImageUpload(avatar, "Photo");
      await deleteUpload(avatarPath);
      avatarPath = newAvatarPath;
    } catch (err) {
      redirect(`/u/${user!.handle}?error=${encodeURIComponent(err instanceof Error ? err.message : "Could not save photo.")}`);
    }
  }

  await pool.query(`update users set name = $1, handle = $2, avatar_path = $3 where id = $4`, [name, handle, avatarPath, user!.id]);

  revalidatePath(`/u/${user!.handle}`);
  revalidatePath(`/u/${handle}`);
  revalidatePath("/builds");
  redirect(`/u/${handle}`);
}

function usernameToUrl(input: string, base: string): string {
  let handle = input.trim();
  if (!handle) return "";
  const urlMatch = handle.match(/^https?:\/\/[^/]+\/(.+)$/i);
  if (urlMatch) handle = urlMatch[1];
  handle = handle.replace(/^@/, "").split(/[/?#]/)[0];
  return handle ? `${base}${handle}` : "";
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 8) {
    redirect(`/u/${user!.handle}?error=${encodeURIComponent("New password must be at least 8 characters.")}`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`/u/${user!.handle}?error=${encodeURIComponent("New passwords don't match.")}`);
  }

  const result = await pool.query<{ password_hash: string }>(
    "select password_hash from users where id = $1",
    [user!.id]
  );
  const ok = result.rows[0] && (await bcrypt.compare(currentPassword, result.rows[0].password_hash));
  if (!ok) redirect(`/u/${user!.handle}?error=${encodeURIComponent("Current password is incorrect.")}`);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query("update users set password_hash = $1 where id = $2", [passwordHash, user!.id]);

  redirect(`/u/${user!.handle}?success=${encodeURIComponent("Password updated.")}`);
}

export async function updateProfileSocialsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const xUrl = usernameToUrl(String(formData.get("x_username") ?? ""), "https://x.com/");
  const githubUrl = usernameToUrl(String(formData.get("github_username") ?? ""), "https://github.com/");
  const websiteUrl = String(formData.get("website_url") ?? "").trim();

  await pool.query(
    `update users set x_url = $1, github_url = $2, website_url = $3 where id = $4`,
    [xUrl, githubUrl, websiteUrl, user!.id]
  );

  revalidatePath(`/u/${user!.handle}`);
  redirect(`/u/${user!.handle}`);
}

export async function deletePortfolioItemAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) return;

  await pool.query(`delete from portfolio_items where id = $1 and user_id = $2`, [itemId, user!.id]);

  revalidatePath(`/u/${user!.handle}`);
}

const PARTNER_INTERESTS = ["sponsorship", "prizes", "tool-placement", "other"];

export async function submitPartnerInquiryAction(formData: FormData) {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const interest = String(formData.get("interest") ?? "other");
  const message = String(formData.get("message") ?? "").trim();

  if (!companyName || !contactName || !email) {
    redirect("/partnership?error=" + encodeURIComponent("Give us a company name, contact name, and email."));
  }
  if (!PARTNER_INTERESTS.includes(interest)) {
    redirect("/partnership?error=" + encodeURIComponent("Choose a valid interest."));
  }

  await pool.query(
    `insert into partner_inquiries (company_name, contact_name, email, website_url, interest, message)
     values ($1, $2, $3, $4, $5, $6)`,
    [companyName, contactName, email, websiteUrl, interest, message]
  );

  revalidatePath("/admin/partners");
  redirect("/partnership?submitted=1");
}

export async function updatePartnerInquiryStatusAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["new", "contacted", "closed"].includes(status)) redirect("/admin/partners");

  await pool.query(`update partner_inquiries set status = $1 where id = $2`, [status, id]);

  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}

const EPISODE_STATUSES: EpisodeStatus[] = ["complete", "live", "upcoming"];

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) redirect("/login");
  return user;
}

// Episode go-live times are always Central (matches TONIGHT in season.ts) —
// the admin's <input type="datetime-local"> value is naive local wall-clock
// text, so it's interpreted as Central rather than the admin's own timezone.
function parseLiveAt(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}:00-05:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function createEpisodeAction(formData: FormData) {
  await requireAdmin();

  const number = Number(formData.get("number") ?? "");
  const theme = String(formData.get("theme") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const status = String(formData.get("status") ?? "upcoming") as EpisodeStatus;
  const xSpacesUrl = String(formData.get("x_spaces_url") ?? "").trim();
  const liveAt = parseLiveAt(formData.get("live_at"));

  if (!number || !theme || !EPISODE_STATUSES.includes(status)) {
    redirect("/admin/episodes?error=" + encodeURIComponent("Give the episode a number, theme, and valid status."));
  }

  if (status === "live") {
    await pool.query(`update episodes set status = 'complete' where status = 'live'`);
  }

  await pool.query(
    `insert into episodes (number, theme, brief, status, x_spaces_url, live_at) values ($1, $2, $3, $4, $5, $6)
     on conflict (number) do update set theme = excluded.theme, brief = excluded.brief, status = excluded.status, x_spaces_url = excluded.x_spaces_url, live_at = excluded.live_at`,
    [number, theme, brief, status, xSpacesUrl, liveAt]
  );

  revalidatePath("/admin/episodes");
  revalidatePath("/season");
  revalidatePath("/");
  revalidatePath("/submit");
  redirect("/admin/episodes");
}

export async function updateEpisodeAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const theme = String(formData.get("theme") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const status = String(formData.get("status") ?? "") as EpisodeStatus;
  const xSpacesUrl = String(formData.get("x_spaces_url") ?? "").trim();
  const liveAt = parseLiveAt(formData.get("live_at"));

  if (!id || !theme || !EPISODE_STATUSES.includes(status)) {
    redirect("/admin/episodes?error=" + encodeURIComponent("Give the episode a theme and valid status."));
  }

  if (status === "live") {
    await pool.query(`update episodes set status = 'complete' where status = 'live' and id != $1`, [id]);
  }

  await pool.query(
    `update episodes set theme = $1, brief = $2, status = $3, x_spaces_url = $4, live_at = $5 where id = $6`,
    [theme, brief, status, xSpacesUrl, liveAt, id]
  );

  revalidatePath("/admin/episodes");
  revalidatePath("/season");
  revalidatePath("/");
  revalidatePath("/submit");
  redirect("/admin/episodes");
}
