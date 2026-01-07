import Cms, { CmsOptions } from "./core/cms.ts";

import checkbox from "./fields/checkbox.ts";
import chooseList from "./fields/choose-list.ts";
import choose from "./fields/choose.ts";
import code from "./fields/code.ts";
import color from "./fields/color.ts";
import currentDatetime from "./fields/current-datetime.ts";
import date from "./fields/date.ts";
import dateTime from "./fields/datetime.ts";
import email from "./fields/email.ts";
import fileList from "./fields/file-list.ts";
import file from "./fields/file.ts";
import hidden from "./fields/hidden.ts";
import list from "./fields/list.ts";
import map from "./fields/map.ts";
import markdown from "./fields/markdown.ts";
import number from "./fields/number.ts";
import objectList from "./fields/object-list.ts";
import object from "./fields/object.ts";
import radio from "./fields/radio.ts";
import relationList from "./fields/relation-list.ts";
import richText from "./fields/rich-text.ts";
import relation from "./fields/relation.ts";
import select from "./fields/select.ts";
import text from "./fields/text.ts";
import textarea from "./fields/textarea.ts";
import time from "./fields/time.ts";
import url from "./fields/url.ts";

export default function (options?: Partial<CmsOptions>): Cms {
  const cms = new Cms(options);

  // Register default fields
  cms.field("checkbox", checkbox);
  cms.field("choose-list", chooseList);
  cms.field("choose", choose);
  cms.field("code", code);
  cms.field("color", color);
  cms.field("current-datetime", currentDatetime);
  cms.field("date", date);
  cms.field("datetime", dateTime);
  cms.field("email", email);
  cms.field("file-list", fileList);
  cms.field("file", file);
  cms.field("hidden", hidden);
  cms.field("list", list);
  cms.field("map", map);
  cms.field("markdown", markdown);
  cms.field("number", number);
  cms.field("object-list", objectList);
  cms.field("object", object);
  cms.field("radio", radio);
  cms.field("relation-list", relationList);
  cms.field("rich-text", richText);
  cms.field("relation", relation);
  cms.field("select", select);
  cms.field("text", text);
  cms.field("textarea", textarea);
  cms.field("time", time);
  cms.field("url", url);

  return cms;
}
