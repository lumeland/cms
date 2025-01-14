import { asset, getPath } from "../utils/path.ts";
import { getCurrentVersion } from "../utils/env.ts";
import type { CMSContent } from "../../types.ts";

interface Props {
  options: CMSContent;
  jsImports: string[];
  extraHead?: string;
  content?: string;
}

export default function template(
  { options, jsImports, content, extraHead }: Props,
) {
  const { basePath, auth } = options;
  return `
<!DOCTYPE html>
<html lang="en" data-baseassets="${asset(basePath)}" data-baseurls="${
    getPath(basePath)
  }">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lume CMS</title>
  <link rel="stylesheet" href="${asset(basePath, "/styles.css")}">
  <link rel="icon" href="${
    asset(basePath, "/favicon.ico")
  }" type="image/x-icon">
  <script type="importmap">
    {
      "imports": {
        "lume_cms/": "${asset(basePath, "/")}",
        "dom": "https://cdn.jsdelivr.net/gh/oscarotero/dom@0.1.5/dom.js",
        "std/": "https://cdn.jsdelivr.net/gh/oscarotero/std@1.1.3/",
        "cropper": "https://cdn.jsdelivr.net/npm/cropperjs@2.0.0-rc.2/dist/cropper.esm.js"
      }
    }
  </script>
  <script>
    const darkLightModeStorageKey = '__lume_cms__user_theme';
    const contemporaryTheme = localStorage.getItem(darkLightModeStorageKey);
    if (contemporaryTheme) document.documentElement.setAttribute('data-theme', contemporaryTheme);
  </script>
<script type="module">
import "lume_cms/components/ui.js";
${jsImports.map((file) => `import "${file}";`).join("\n")}
</script>
${extraHead ?? ""}
</head>
<body>
  <div class="app">
    ${content}
  </div>
  <footer class="app-footer">
    <p>
      Powered by <a href="https://lume.land/cms/">LumeCMS ${getCurrentVersion()}</a>
    </p>
    <button class="buttonIcon" id="themeButton" type="button" aria-label="toggle-theme">
      <u-icon>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 26C10.4444 26 6 21.5556 6 16C6 10.4444 10.4444 6 16 6C21.5556 6 26 10.4444 26 16C26 21.5556 21.5556 26 16 26ZM16 24.9394C20.9747 24.9394 24.9394 20.9747 24.9394 16C24.9394 11.0253 20.9747 7.06061 16 7.06061V24.9394Z"/>
      </svg>
      </u-icon>
    </button>
    ${
    auth
      ? `<button class="button is-tertiary" id="logoutButton" type="button" aria-label="logout">Logout</button>`
      : ""
  }
  </footer>
  <script type="module">
    document.querySelector('#themeButton')
      .addEventListener('click', function() {
        if (localStorage.getItem(darkLightModeStorageKey) == 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem(darkLightModeStorageKey);
        } else {        
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem(darkLightModeStorageKey, 'dark');
        }
      }, false);

    document.querySelector('#logoutButton')
      ?.addEventListener('click', function () {
        const logoutUrl = '${getPath(basePath, "logout")}'; 
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open('POST', logoutUrl, true, 'logout');
        xmlHttp.send();
        document.body.innerHTML = '<p class="emptyState">Logged out</p>';
      }, false);
  </script>
</body>
</html>
    `;
}
