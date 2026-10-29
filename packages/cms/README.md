# @lumeland/cms

A CMS to edit the content of sites.

It works great with Lume but it can be used for any other static site generator.

## Usage

```js
// cms.ts
import createCms from "@lumeland/cms";

const cms = createCms();

// Configuration here

export default cms;
```

### Setup with Lume

```ts
// _config.ts

import lumeCms from "@lumeland/plugin-cms";
import cms from "./cms.ts";

site.use(lumeCms({ cms }));
```

### Setup standalone

```ts
import cms from "./cms.ts";

const app = cms.init();

app.serve();
```
