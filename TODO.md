# TODO

Defects and ideas seen on the way, one line each with a date. Fixed items are removed.

- 02.11.2026 demo: the demo app does not dogfood AppShell and AgentDock for its own chrome (D14 does not require it); switch when the dock is stable.
- 02.11.2026 fake engine: no `updateOrder`, no `deleteFile`, jobs have no `error` field; WorkflowStatus and FileUpload demos work around it.
- 02.11.2026 livewire upstream: findings in DeepThought "govengers-ui-build-lessons" are being fixed on livewire branch `fix/ui-findings`; re-vendor `demo/src/api/` afterwards (D40) and drop the SearchTable and FileUpload workarounds.
- 02.11.2026 messages: `ui.step` and `ui.stepOf` carry the same text; keep one.
- 16.11.2026 LoginPage: `change` is required even when the app has no change-password route; make it optional and hide the state.
- 16.11.2026 govengers/auth: `IdentityResponse` carries no impersonation end; ImpersonationBanner needs the app to add `impersonationEndsAt`.
