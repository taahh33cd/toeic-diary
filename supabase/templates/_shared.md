# Email template variables (Supabase Auth)

Available in all templates:
- `{{ .ConfirmationURL }}` — full URL with token
- `{{ .Token }}` — 6-digit OTP
- `{{ .TokenHash }}` — hashed token
- `{{ .SiteURL }}` — configured site URL
- `{{ .Email }}` — recipient email
- `{{ .Data }}` — custom user metadata (e.g. `{{ .Data.displayName }}`)

Brand palette (warm beige — match /journal):
- bg `#F5EFE6`, paper `#FBF7F2`, ink `#2C1E0F`
- orange `#C4622D`, orange2 `#E8885C`, gold `#B07D1A`
