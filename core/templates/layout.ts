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
  const { basePath } = options;
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
        "lume_cms/": "${asset(basePath, "/")}"
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
    <button class="buttonIcon" id="themeButton" type="button" aria-label="toggle-theme"><u-icon name="theme"></u-icon></button>
    <button class="button is-tertiary" id="logoutButton" type="button" aria-label="logout">Logout</button>
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
      .addEventListener('click', function () {
        const logoutUrl = '${getPath("logout")}'; 
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
