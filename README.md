# karp-s-frontend

Karp-S - Språkbankens datapubliceringsplattform

## Developer documentation

Initial:

Sharepoint > Språkbanken > Documents > Plattformar > karp-s > development.docx

### Tools/framework

Vue.js 3 with TypeScript

IDE Setup: [VSCode](https://code.visualstudio.com/) + Vue - official extension. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

Customize configuration: See [Vite Configuration Reference](https://vite.dev/config/).

### Backend

- /dev redirectar alltid till den senaste och ska gå att använda lokalt (https://spraakbanken4.it.gu.se/karps/dev/)

- när ni deployar frontenden, använd den med en git-commit-id i namnet, inte dev, då kommer den deployade frontenden att fortsätta fungera även om jag lägger upp en ny backend (https://spraakbanken4.it.gu.se/karps/443fe07/ just nu)

- bara /karp-s försvinner (efter att ni uppdaterat frontenden att inte använda den)

## Deploy

Build:

- `npm run build:production`

Upload:

- `rsync --delete --exclude ".htaccess" -r dist/ <user>@k2.spraakdata.gu.se:/var/www/html_sb/karp-s`

## Vue info from installation

Project Setup

```sh
npm install
```

Compile and Hot-Reload for Development

```sh
npm run dev
```

Type-Check, Compile and Minify for Production

```sh
npm run build
```

Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
