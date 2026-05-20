import { posix, SEPARATOR } from "../../deps/std.ts";

/**
 * Normalize the name of a file or directory
 */
export function normalizeName(name: string): string;
export function normalizeName(name?: string | null): undefined;
export function normalizeName(name?: string | null): string | undefined {
  if (!name) {
    return;
  }

  if (SEPARATOR !== "/") {
    name = name.replaceAll(SEPARATOR, "/");
  }

  name = posix.join("/", name).substring(1);
  return name || undefined;
}

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */
export function normalizePath(...paths: string[]) {
  let path = posix.join(...paths);

  if (SEPARATOR !== "/") {
    path = path.replaceAll(SEPARATOR, "/");

    // Is absolute Windows path (C:/...)
    if (path.includes(":/")) {
      return (path !== "/" && path.endsWith("/")) ? path.slice(0, -1) : path;
    }
  }

  path = posix.join("/", path);

  return (path !== "/" && path.endsWith("/")) ? path.slice(0, -1) : path;
}

export function getPath(basePath: string, ...parts: string[]) {
  return posix.join(
    basePath,
    ...parts
      .filter((part) => typeof part === "string")
      .map((part) => encodeURIComponent(part)),
  );
}

const staticUrl = new URL(import.meta.resolve("../../static/"));

export function asset(basePath: string, url = "") {
  if (staticUrl.protocol === "file:") {
    return posix.join(basePath, url);
  }

  return new URL(
    posix.join(staticUrl.pathname, url),
    staticUrl,
  ).toString();
}

/**
 * Return the relative path from `from` to `to` and ensure it starts with a dot.
 *
 * @example Usage
 * ```ts
 * const path = getRelativePath("/data/foobar", "/data/foobar/asset.jpg");
 * assertEquals(path, "./asset.jpg");
 * ```
 */
export function getRelativePath(
  from?: string,
  to?: string,
): string | undefined {
  if (!from || !to) return;
  const relativePath = posix.relative(from, to);
  return relativePath.startsWith("./") || relativePath.startsWith("../")
    ? relativePath
    : `./${relativePath}`;
}

const fileExtensions = new Map([
  [".apl", "APL"],
  [".asn1", "ASN.1"],
  [".asn", "ASN.1"],
  [".conf", "Nginx"],
  [".bf", "Brainfuck"],
  [".c", "C"],
  [".h", "C"],
  [".cs", "C#"],
  [".cpp", "C++"],
  [".cc", "C++"],
  [".cxx", "C++"],
  [".hpp", "C++"],
  [".hh", "C++"],
  [".hxx", "C++"],
  [".cmake", "CMake"],
  [".cql", "CQL"],
  [".css", "CSS"],
  [".clj", "Clojure"],
  [".cljs", "ClojureScript"],
  [".gss", "Closure Stylesheets (GSS)"],
  [".cob", "Cobol"],
  [".cbl", "Cobol"],
  [".coffee", "CoffeeScript"],
  [".lisp", "Common Lisp"],
  [".lsp", "Common Lisp"],
  [".cl", "Common Lisp"],
  [".cr", "Crystal"],
  [".cyp", "Cypher"],
  [".cypher", "Cypher"],
  [".pyx", "Cython"],
  [".pxd", "Cython"],
  [".pxi", "Cython"],
  [".d", "D"],
  [".dtd", "DTD"],
  [".dart", "Dart"],
  ["Dockerfile", "Dockerfile"],
  [".dylan", "Dylan"],
  [".lid", "Dylan"],
  [".ebnf", "EBNF"],
  [".ecl", "ECL"],
  [".e", "Eiffel"],
  [".elm", "Elm"],
  [".erl", "Erlang"],
  [".hrl", "Erlang"],
  [".esper", "Esper"],
  [".fs", "F#"],
  [".fsi", "F#"],
  [".fsx", "F#"],
  [".fcl", "FCL"],
  [".factor", "Factor"],
  [".fth", "Forth"],
  [".forth", "Forth"],
  [".f", "Fortran"],
  [".for", "Fortran"],
  [".f90", "Fortran"],
  [".f95", "Fortran"],
  [".f03", "Fortran"],
  [".f08", "Fortran"],
  [".s", "Gas"],
  [".S", "Gas"],
  [".feature", "Gherkin"],
  [".go", "Go"],
  [".groovy", "Groovy"],
  [".gvy", "Groovy"],
  [".gy", "Groovy"],
  [".gsh", "Groovy"],
  [".html", "HTML"],
  [".htm", "HTML"],
  [".http", "HTTP"],
  [".hxml", "HXML"],
  [".hs", "Haskell"],
  [".lhs", "Haskell"],
  [".hx", "Haxe"],
  [".idl", "IDL"],
  [".json", "JSON"],
  [".jsonld", "JSON-LD"],
  [".jsx", "JSX"],
  [".java", "Java"],
  [".js", "JavaScript"],
  [".mjs", "JavaScript"],
  [".cjs", "JavaScript"],
  [".j2", "Jinja"],
  [".jinja", "Jinja"],
  [".jinja2", "Jinja"],
  [".jl", "Julia"],
  [".kt", "Kotlin"],
  [".kts", "Kotlin"],
  [".less", "LESS"],
  [".tex", "LaTeX"],
  [".ltx", "LaTeX"],
  [".liquid", "Liquid"],
  [".ls", "LiveScript"],
  [".lua", "Lua"],
  [".sql", "SQL"],
  [".m", "Objective-C"],
  [".mum", "MUMPS"],
  [".md", "Markdown"],
  [".markdown", "Markdown"],
  [".nb", "Mathematica"],
  [".wl", "Mathematica"],
  [".mbox", "Mbox"],
  [".mo", "Modelica"],
  [".msgenny", "MsGenny"],
  [".mscgen", "MscGen"],
  [".msc", "MscGen"],
  [".nsi", "NSIS"],
  [".nsh", "NSIS"],
  [".nt", "NTriples"],
  [".ml", "OCaml"],
  [".mli", "OCaml"],
  [".mm", "Objective-C++"],
  [".oz", "Oz"],
  [".asc", "PGP"],
  [".pgp", "PGP"],
  [".php", "PHP"],
  [".phtml", "PHP"],
  [".pls", "PLSQL"],
  [".plsql", "PLSQL"],
  [".pck", "PLSQL"],
  [".pkb", "PLSQL"],
  [".pks", "PLSQL"],
  [".pas", "Pascal"],
  [".pp", "Puppet"],
  [".pl", "Perl"],
  [".pm", "Perl"],
  [".t", "Perl"],
  [".pig", "Pig"],
  [".ps1", "PowerShell"],
  [".psm1", "PowerShell"],
  [".psd1", "PowerShell"],
  [".properties", "Properties files"],
  [".proto", "ProtoBuf"],
  [".pug", "Pug"],
  [".py", "Python"],
  [".q", "Q"],
  [".r", "R"],
  [".R", "R"],
  [".changes", "RPM Changes"],
  [".spec", "RPM Spec"],
  [".rb", "Ruby"],
  [".rs", "Rust"],
  [".sas", "SAS"],
  [".scss", "SCSS"],
  [".sml", "SML"],
  [".sig", "SML"],
  [".fun", "SML"],
  [".rq", "SPARQL"],
  [".sparql", "SPARQL"],
  [".sass", "Sass"],
  [".scala", "Scala"],
  [".sc", "Scala"],
  [".scm", "Scheme"],
  [".ss", "Scheme"],
  [".sh", "Shell"],
  [".bash", "Shell"],
  [".zsh", "Shell"],
  [".siv", "Sieve"],
  [".sieve", "Sieve"],
  [".st", "Smalltalk"],
  [".solr", "Solr"],
  [".xls", "Spreadsheet"],
  [".xlsx", "Spreadsheet"],
  [".ods", "Spreadsheet"],
  [".csv", "Spreadsheet"],
  [".nut", "Squirrel"],
  [".styl", "Stylus"],
  [".swift", "Swift"],
  [".sv", "SystemVerilog"],
  [".svh", "SystemVerilog"],
  [".toml", "TOML"],
  [".tsx", "TSX"],
  [".ttcn", "TTCN"],
  [".ttcn3", "TTCN"],
  [".cfg", "TTCN_CFG"],
  [".tcl", "Tcl"],
  [".textile", "Textile"],
  [".tid", "TiddlyWiki"],
  [".wiki", "Tiki wiki"],
  [".troff", "Troff"],
  [".roff", "Troff"],
  [".man", "Troff"],
  [".ttl", "Turtle"],
  [".ts", "TypeScript"],
  [".vb", "VB.NET"],
  [".vbs", "VBScript"],
  [".vhd", "VHDL"],
  [".vhdl", "VHDL"],
  [".vm", "Velocity"],
  [".vtl", "Velocity"],
  [".v", "Verilog"],
  [".vh", "Verilog"],
  [".vue", "Vue"],
  [".webidl", "Web IDL"],
  [".wat", "WebAssembly"],
  [".wasm", "WebAssembly"],
  [".xml", "XML"],
  [".atom", "XML"],
  [".rss", "XML"],
  [".svg", "XML"],
  [".xq", "XQuery"],
  [".xquery", "XQuery"],
  [".xu", "Xù"],
  [".yml", "YAML"],
  [".yaml", "YAML"],
  [".ys", "Yacas"],
  [".z80", "Z80"],
  [".asm", "Z80"],
  [".diff", "diff"],
  [".patch", "diff"],
  [".edn", "edn"],
  [".mrc", "mIRC"],
]);

export function getLanguageCode(path: string, defaultValue = "HTML"): string {
  const ext = posix.extname(path).toLowerCase();
  return fileExtensions.get(ext) ?? defaultValue;
}
