// Motion notation is docs/CONTRACT.md §4.

const OBJECT_CHARS = String.raw`wWspt(){}\[\]<>"'\``;

const WORD = /^\d*[wWbBeE]$/;
const OPERATOR_WORD = new RegExp(String.raw`^[dcyv<>=]\d*[wWbBeE]$`);
const FIND = /^\d*[fFtT].?$/;
const OPERATOR_FIND = /^[dcyv<>=]\d*[fFtT].?$/;
const TEXT_OBJECT = new RegExp(String.raw`^[dcyv<>=]?\d*[ia][${OBJECT_CHARS}]$`);
const OPERATOR = /^\d*[dcy]/;
const OPERATOR_LINEWISE = /^[DCY]$/;
const SEARCH = /^[/?nN*#]$/;
const JUMP = /^(\d*[GH{}%]|gg|g_|\d+[jk]|\^|0|\$|<C-[dufboi]>|C-[dufboi]|zz|zt|zb|``|`.|'.)$/;
const INSERT_EDIT = /^[iIaAoOxrsR~]$/;
const VISUAL = /^(v|V|<C-v>|C-v|gv|o)$/;
const REPEAT = /^(u|<C-r>|C-r|\.|q|@|@@|@.)$/;

export function isWordMotion(motion: string): boolean {
  return WORD.test(motion) || OPERATOR_WORD.test(motion);
}

export function isFindMotion(motion: string): boolean {
  return FIND.test(motion) || OPERATOR_FIND.test(motion) || motion === ';' || motion === ',';
}

export function isTextObject(motion: string): boolean {
  return TEXT_OBJECT.test(motion);
}

export function isOperator(motion: string): boolean {
  return (
    OPERATOR.test(motion) || OPERATOR_LINEWISE.test(motion) || motion === 'p' || motion === 'P'
  );
}

export function isSearch(motion: string): boolean {
  return SEARCH.test(motion);
}

export function isJump(motion: string): boolean {
  return JUMP.test(motion) || motion === '`' || motion === 'm';
}

export function isInsertEdit(motion: string): boolean {
  return INSERT_EDIT.test(motion);
}

export function isVisual(motion: string): boolean {
  return VISUAL.test(motion);
}

export function isRepeat(motion: string): boolean {
  return REPEAT.test(motion);
}

// Lessons write both <C-v> and bare C-v, and motionKeys reads only the bracketed form as one key.
export function displayMotion(motion: string): string {
  return /^(?:C|M)-.+$/.test(motion) ? `<${motion}>` : motion;
}
