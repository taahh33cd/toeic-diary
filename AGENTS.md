<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Testing

Test account: log in via the "Mã học viên" tab with student code `TEST` (no password). Use it for any flow that needs a signed-in user.

# Deploy

Always deploy once a goal is done and verified: push straight to `main` — no PR, no waiting for a preview build (the owner approved this). Vercel deploys `main` to production at https://toeic-dictation-diary.vercel.app; a failed build keeps the previous version live. Then check the change live with the `TEST` account.
