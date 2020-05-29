<h1 align="center">Typescript Expect Plugin</h1>
<p align="center">
  <img  alt="npm" src="https://img.shields.io/npm/v/typescript-expect-plugin?color=blue" />
  <img  alt="mit license" src="https://img.shields.io/npm/l/typescript-expect-plugin?color=blue" />
  <img
    alt="CI"
    src="https://github.com/Idered/typescript-expect-plugin/workflows/CI/badge.svg?event=push"
  />
  <a href="https://twitter.com/intent/follow/?screen_name=Idered">
    <img alt="twitter" src="https://img.shields.io/twitter/follow/Idered?style=social" />
  </a>
</p>
<p align="center">Be lazy, write simple tests in comments.</p>

<p align="center">
  <img src="https://i.imgur.com/AhQK9Pl.gif" />
</p>

## Editor support

✅ VS Code - flawlessly works in `Problems` panel.

⏹ Sublime Text - could not get it to work but it might be possible.

❔ Atom - not tested.

⛔ `tsc` - plugins are disabled during build. It should work with webpack ts loader.

## Quick start

```sh
npm install typescript-expect-plugin
```

1.  Add plugin to `tsconfig.json`:
```ts
{
  "compilerOptions": {
    "plugins": [{ "name": "typescript-expect-plugin" }]
  },
}
```

2. Change VS Code typescript to workspace version:

![](https://i.imgur.com/kK9BlMi.gif)

## Usage

## WARNING

> ⚠Tests are executed after each file change - not save. Be careful if you're going to test functions that remove or change files in your local system

---

This plugin adds support for `@expect` JSDoc tag. It has the following usage pattern:

```tsx
/**
 * @expect [PARAMS] CONDITION CONDITION_PARAMETER
 */
```

- `[PARAMS]` - for example `[2, 4]` will spread two arguments to tested function.
- `CONDITION` - check function from jest expect library. Use `ctrl+.` to see autocomplete suggestions.
- `CONDITION_PARAMETER` - argument passed to `CONDITION` function.

## Examples

```tsx
/**
 * @expect [2, 4] toBe 6
 * @expect [2, 2] toBeGreaterThan 3
 * @expect [2, 2] toBeLessThan 3
 * @expect [2, 22] toEqual 24
 */
export function sum(a: number, b: number) {
  return a + b;
}

/**
 * @expect [[2, 4, 8], 4] toBeTruthy
 * @expect [[2, 4, 8], 12] toBeFalsy
 */
export function has(haystack: any[], needle: any) {
  return haystack.includes(needle);
}

/**
 * @expect [[2, 8], [9, 12]] toEqual [2, 8, 9, 12]
 */
export function join(arr1: any[], arr2: any[]) {
  return [...arr1, ...arr2];
}

/**
 * @expect [{"firstName": "John"}, "lastName", "Doe"] toHaveProperty "lastName", "Doe Doe"
 */
export function withProp(obj: Record<string, any>, key: string, value: any) {
  return {...obj, [key]: value}
}
```

> ### Test objects
![](https://i.imgur.com/ZplL1PV.gif)

> ### Test arrays

![](https://i.imgur.com/epox4Pu.gif)

## Author

Hey there, I'm Kasper. If you wish to get notified about more cool typescript or react projects/tips you can follow me on twitter.

<a href="https://twitter.com/intent/follow/?screen_name=Idered">
  <img alt="twitter" src="https://img.shields.io/twitter/follow/Idered?style=social" />
</a>
