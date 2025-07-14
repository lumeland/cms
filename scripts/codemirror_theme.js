import {HighlightStyle, syntaxHighlighting} from "@codemirror/language"
import {tags as t} from "@lezer/highlight"

const l = {
  a: "hsl(10, 70%, 40%)",
  b: "hsl(155, 70%, 30%)",
  d: "hsl(220, 20%, 30%)",
  e: "hsl(200, 90%, 50%)",
  f: "hsl(220, 20%, 40%)",
  g: "hsl(10, 70%, 50%)",
  h: "hsl(240, 90%, 60%)",
}

export const lightHighlightStyle = HighlightStyle.define([
  {
    tag: t.keyword,
    color: l.h
  },
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: l.a
  },
  {
    tag: [t.function(t.variableName), t.labelName, t.definition(t.name), t.separator],
    color: l.e
  },
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: l.g
  },
  {
    tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
    color: l.chalky
  },
  {
    tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: l.b
  },
  {
    tag: [t.meta, t.comment],
    color: l.f
  },
  {
    tag: t.strong,
    fontWeight: "bold"
  },
  {
    tag: t.emphasis,
    fontStyle: "italic"
  },
  {
    tag: t.strikethrough,
    textDecoration: "line-through"
  },
  {
    tag: t.link,
    color: l.f,
    textDecoration: "underline"
  },
  {
    tag: t.heading,
    fontWeight: "bold",
    color: l.a
  },
  {
    tag: [t.atom, t.bool, t.special(t.variableName), t.processingInstruction, t.string, t.inserted],
    color: l.g
  },
  {
    tag: t.invalid,
    color: l.d
  },
]);

const d = {
  a: "hsl(60, 50%, 80%)",
  b: "hsl(155, 75%, 40%)",
  d: "hsl(220, 20%, 80%)",
  e: "hsl(200, 90%, 60%)",
  f: "hsl(220, 20%, 60%)",
  g: "hsl(10, 50%, 70%)",
  h: "hsl(240, 90%, 80%)",
}

export const darkHighlightStyle = HighlightStyle.define([
  {
    tag: t.keyword,
    color: d.h
  },
  {
    tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
    color: d.a
  },
  {
    tag: [t.function(t.variableName), t.labelName, t.definition(t.name), t.separator],
    color: d.e
  },
  {
    tag: [t.color, t.constant(t.name), t.standard(t.name)],
    color: d.g
  },
  {
    tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
    color: d.chalky
  },
  {
    tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: d.b
  },
  {
    tag: [t.meta, t.comment],
    color: d.f
  },
  {
    tag: t.strong,
    fontWeight: "bold"
  },
  {
    tag: t.emphasis,
    fontStyle: "italic"
  },
  {
    tag: t.strikethrough,
    textDecoration: "line-through"
  },
  {
    tag: t.link,
    color: d.f,
    textDecoration: "underline"
  },
  {
    tag: t.heading,
    fontWeight: "bold",
    color: d.a
  },
  {
    tag: [t.atom, t.bool, t.special(t.variableName), t.processingInstruction, t.string, t.inserted],
    color: d.g
  },
  {
    tag: t.invalid,
    color: d.d
  },
]);

export default {
  dark: {
    extension: syntaxHighlighting(darkHighlightStyle),
    name: "dark",
  },
  light: {
    extension: syntaxHighlighting(lightHighlightStyle),
    name: "light",
  },
}
