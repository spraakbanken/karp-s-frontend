# karplabb frontend

Karplabb - Språkbankens datapubliceringsplattform

## Developer documentation

Initial:

Sharepoint > Språkbanken > Documents > Plattformar > karp-s > development.docx

### SSL in development

For SB-Auth to allow authentication requests, the frontend must be served under spraakbanken.gu.se (, and HTTPS must be enabled).

- Point the hostname karplabb.spraakbanken.gu.se to localhost. On a Linux system, you can do this by editing /etc/hosts: `127.0.0.1	localhost	karplabb.spraakbanken.gu.se`
- Create certificate files with `mkcert`: `mkcert "*.spraakbanken.gu.se"`
  - and refer to them in `.env.localdev`:
  ```
  # Enable SSL in development
  DEV_HTTPS_KEY=../ssl_local_certiciates/spraakbanken.gu.se+1-key.pem
  DEV_HTTPS_CERT=../ssl_local_certiciates/spraakbanken.gu.se+1.pem
  ```
- Add to `vite.config.ts`:
  ```
   server: {
    allowedHosts: ['karplabb.spraakbanken.gu.se'],
  },
  ```
- Optionally, configure `server https` and visit the app using `https://...`

- access locally: `http://karplabb.spraakbanken.gu.se:5173/karplabb/`

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
