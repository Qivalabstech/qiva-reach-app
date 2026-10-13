# Supabase email templates

These are pasted into Supabase (Authentication, Emails, Templates). Supabase sends **Confirm sign up** to new users and **Magic link** to returning users, so both use the same text.

| Template | Subject | File |
|---|---|---|
| Magic link or OTP | Your sign-in link | `magic-link.html` |
| Confirm sign up | Your sign-in link | `confirm-sign-up.html` |

The link is `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. `RedirectTo` is the address the app passes when asking for the link (`/auth/callback` on the site the user was on), so it works on localhost and on the live site, and the link opens in any browser or device. `/auth/callback` accepts the `token_hash` form.

## Originals (to roll back)
Magic link, subject "Your sign-in link":
```html
<h2>Your sign-in link</h2>

<p>Follow the link below to sign in. This link expires shortly and can only be used once.</p>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
```
Confirm sign up, subject "Confirm your email address":
```html
<h2>Confirm your email address</h2>

<p>Follow the link below to confirm this email address and finish signing up.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email address</a></p>
```
Note: `{{ .ConfirmationURL }}` only works in the same browser that asked for the link.

Changed 14 Oct 2026 by the CTO, with Razam Sir's approval. The sender is `no-reply@mail.qivareach.com` through Resend (custom SMTP in Supabase).
