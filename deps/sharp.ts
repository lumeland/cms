import sharp from "npm:sharp@0.33.5";

export async function fromFile(file: File) {
  return sharp(new Uint8Array(await file.arrayBuffer()));
}
