# karp-s-frontend

Karp-S - Språkbankens datapubliceringsplattform

## Developer documentation

Sharepoint > Språkbanken > Documents > Plattformar > karp-s > development.docx

## Tools/framework

Vue.js 3 with TypeScript

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + Vue - official extension.

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Type-Check, Compile and Minify for Production

```sh
npm run build
```

#### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

#### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
