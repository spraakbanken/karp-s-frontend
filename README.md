# karplabb frontend

Karplabb - Språkbankens datapubliceringsplattform

## Developer documentation

Initial:

Sharepoint > Språkbanken > Documents > Plattformar > karp-s > development.docx

## Tools/framework

Vue.js 3 with TypeScript

IDE Setup: [VSCode](https://code.visualstudio.com/) + Vue - official extension. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

Customize configuration: See [Vite Configuration Reference](https://vite.dev/config/).

## Workflow

### Build and deploy

Increment version number in package.json.

```sh
npm run build:production
```

Upload:

```sh
rsync --delete --exclude ".htaccess" -r dist/ <user>@k2.spraakdata.gu.se:/var/www/html_sb/karplabb
```

### Compile and Hot-Reload for Development

```sh
npm run dev:localdev
```

### Update

```sh
npm update
```

### Project Setup

```sh
npm install
```

### Type-Check, Compile and Minify for Production

```sh
npm run build:production
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Backend
