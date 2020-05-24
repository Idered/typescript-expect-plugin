import { Matchers } from "expect";

const exp = /^(\[.+\])\s{1}((not\.?)?(?:\w+))[\s{1}]?(.+)?/;

function parseComment(comment: string) {
  if (!comment) return;
  const match = comment.match(exp);
  if (!match) return;
  const [, params, method, , result] = match;
  const matcher = (method as unknown) as keyof Pick<Matchers<any>, "toEqual">;
  const isUndefined = result === undefined || result === "undefined";

  return {
    params: JSON.parse(params),
    matcher,
    result: isUndefined ? undefined : JSON.parse(result),
  };
}

export default parseComment;
