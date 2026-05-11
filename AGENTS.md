# Agent Instructions

## Package Manager

This project uses PNPM.

- Prefer `pnpm` for install, add, remove, and script commands.
- Do not use `npm` or `yarn` unless the user explicitly asks for them.
- When suggesting commands, provide PNPM equivalents.

## Project Overview

- This repository is the VuePress documentation site for "React 技术揭秘".
- Main documentation content lives in `docs/`.
- VuePress is configured through the existing project files; follow current structure and naming.
- Generated or dependency folders such as `node_modules/`, `.wrangler/`, and build output should not be edited by hand.

## Common Commands

- Install dependencies: `pnpm install`
- Start local docs server: `pnpm start`
- Build docs: `pnpm build`
- Legacy GitHub/Gitee Pages deploy script: `pnpm deploy`

## Cloudflare Deploy

This project deploys to the Cloudflare Pages project `just-react-docs`.

Use this flow when the user asks to upload, publish, or deploy the docs to Cloudflare:

1. Build the VuePress site:

   ```sh
   pnpm build
   ```

2. Deploy the generated static output:

   ```sh
   pnpm dlx wrangler pages deploy docs/.vuepress/dist --project-name just-react-docs
   ```

3. Verify the deployment URL returned by Wrangler:

   ```sh
   curl -I <deployment-url>
   ```

Successful verification should return `HTTP/2 200`.

Notes:

- The static output directory is `docs/.vuepress/dist`.
- Wrangler may warn about uncommitted git changes; this does not block deployment.
- Prefer Cloudflare Pages deployment over the legacy `pnpm deploy` script unless the user explicitly asks for the old GitHub/Gitee Pages flow.
- Use `pnpm`, not `npm` or `yarn`, for project commands.

## Editing Guidelines

- Keep changes focused on the requested documentation or build behavior.
- Preserve existing Chinese wording style when editing docs.
- Prefer small, readable Markdown changes over broad rewrites.
- Do not reformat unrelated files.
- Be careful with existing scripts that reference legacy commands; update them only when the task requires it.

## Verification

Before considering work complete, run the most relevant available check:

- For documentation-only edits, review the changed Markdown and run `pnpm build` when the change could affect VuePress rendering.
- For dependency or script changes, run `pnpm install` if lockfile updates are needed, then run the relevant `pnpm` script.
- If a verification command cannot be run, report why and describe the residual risk.
