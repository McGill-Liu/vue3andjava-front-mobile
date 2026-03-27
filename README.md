# Points Mall Mobile

This project is a uni-app mini program built with Vue 3.

## Preferred workflow

- Open the project in HBuilderX
- Run to WeChat Developer Tools from HBuilderX
- Use HBuilderX as the primary build and debug entry

## Project structure

- `App.vue`: global app shell and shared styles
- `main.js`: uni-app Vue 3 entry using `createSSRApp`
- `pages.json`: page routing config
- `manifest.json`: app config
- `src/pages`: page views
- `src/components`: shared components
- `src/utils`: request, auth, cart helpers

## Notes

- This project keeps the business flow for login, guest browse, product list, cart, orders, address, and profile.
- The codebase is being normalized to a clean uni-app Vue 3 structure for HBuilderX-first development.
