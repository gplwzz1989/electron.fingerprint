export enum PageType {
  Markdown = 0,
  Otter = 1,
  Lark = 2,
}

export enum UpgradeStatus {
  None = 0,
  Processing = 1,
  Succeeded = 2,
  Failed = 3,
}

function isOtterStyleId(id: string): boolean {
  if (!id || id.length < 15) return false;

  return (
    id[0] >= "A" &&
    id[0] <= "Z" &&
    !id.startsWith("dox") &&
    id[4] === "f" &&
    id[9] === "d" &&
    id[14] === "c"
  );
}

export function isNewDocumentId(id: string): boolean {
  if (!id) return false;

  const looksLikeOtter = isOtterStyleId(id);
  const looksLikeMarkdown = id.length < 20;

  return !looksLikeOtter && !looksLikeMarkdown;
}
