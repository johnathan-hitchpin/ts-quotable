import * as ts from 'typescript';
import { TsConfigJson } from 'type-fest';

export const toTsCompilerOps = (ops: TsConfigJson['compilerOptions']): ts.CompilerOptions => {
  return {
    ...ops,
    importsNotUsedAsValues: ops?.importsNotUsedAsValues ?
      getImportsNotUsedAsValues(ops.importsNotUsedAsValues) : undefined,
    jsx: ops?.jsx ? getJsx(ops.jsx) : undefined,
    module: ops?.module ? getModule(ops.module) : undefined,
    moduleResolution: ops?.moduleResolution ? getModuleResolution(ops.moduleResolution) : undefined,
    moduleDetection: ops?.moduleDetection ? getModuleDetection(ops.moduleDetection) : undefined,
    newLine: ops?.newLine ? getNewline(ops.newLine) : undefined,
    target: ops?.target ? getTarget(ops.target) : undefined,
  }
}

export const getTarget = (t: string): ts.ScriptTarget => {
  switch (t.toLocaleLowerCase()) {
    case 'es3':
      return ts.ScriptTarget.ES3;
    case 'es5':
      return ts.ScriptTarget.ES5;
    case 'es2015':
      return ts.ScriptTarget.ES2015;
    case 'es2016':
      return ts.ScriptTarget.ES2016;
    case 'es2017':
      return ts.ScriptTarget.ES2017;
    case 'es2018':
      return ts.ScriptTarget.ES2018;
    case 'es2019':
      return ts.ScriptTarget.ES2019;
    case 'es2020':
      return ts.ScriptTarget.ES2020;
    case 'es2021':
      return ts.ScriptTarget.ES2021;
    case 'es2022':
      return ts.ScriptTarget.ES2022;
    case 'es2023':
      return ts.ScriptTarget.ES2023;
    case 'esnext':
      return ts.ScriptTarget.ESNext;
    case 'json':
      return ts.ScriptTarget.JSON;
    case 'latest':
      return ts.ScriptTarget.Latest;
    default:
      throw new Error('Invalid target');
  }
};

export const getNewline = (n: 'CRLF' | 'LF' | 'crlf' | 'lf'): ts.NewLineKind => {
  switch (n.toLocaleLowerCase()) {
    case 'crlf':
      return ts.NewLineKind.CarriageReturnLineFeed;
    case 'lf':
      return ts.NewLineKind.LineFeed;
    default:
      throw new Error('Invalid newline');
  }
}

export const getModuleDetection = (m: string): ts.ModuleDetectionKind => {
  switch (m.toLocaleLowerCase()) {
    case 'legacy':
      return ts.ModuleDetectionKind.Legacy;
    case 'auto':
      return ts.ModuleDetectionKind.Auto;
    case 'force':
      return ts.ModuleDetectionKind.Force;
    default:
      throw new Error('Invalid module detection');
  }
}

export const getModuleResolution = (m: string): ts.ModuleResolutionKind => {
  switch (m.toLocaleLowerCase()) {
    case 'node':
      return ts.ModuleResolutionKind.NodeJs;
    case 'nodenext':
      return ts.ModuleResolutionKind.NodeNext;
    case 'classic':
      return ts.ModuleResolutionKind.Classic;
      case 'bundler':
        return ts.ModuleResolutionKind.Bundler;
    default:
      throw new Error('Invalid module resolution');
  }
}

export const getModule = (m: string): ts.ModuleKind => {
  switch (m.toLocaleLowerCase()) {
    case 'commonjs':
      return ts.ModuleKind.CommonJS;
    case 'amd':
      return ts.ModuleKind.AMD;
    case 'umd':
      return ts.ModuleKind.UMD;
    case 'system':
      return ts.ModuleKind.System;
    case 'es2015':
      return ts.ModuleKind.ES2015;
    case 'esnext':
      return ts.ModuleKind.ESNext;
    case 'node16':
      return ts.ModuleKind.Node16;
    case 'nodenext':
      return ts.ModuleKind.NodeNext;
    default:
      throw new Error('Invalid module');
  }
}

export const getJsx = (jsx: string): ts.JsxEmit => {
  switch (jsx.toLocaleLowerCase()) {
    case 'none':
      return ts.JsxEmit.None;
    case 'preserve':
      return ts.JsxEmit.Preserve;
    case 'react':
      return ts.JsxEmit.React;
    case 'react-jsx':
      return ts.JsxEmit.ReactJSX;
    case 'react-jsxdev':
      return ts.JsxEmit.ReactJSXDev;
      case 'react-native':
        return ts.JsxEmit.ReactNative;
    default:
      throw new Error('Invalid jsx');
  }
}
export const getImportsNotUsedAsValues = (importsNotUsedAsValues: string): ts.ImportsNotUsedAsValues => {
  switch (importsNotUsedAsValues) {
    case 'remove':
      return ts.ImportsNotUsedAsValues.Remove;
    case 'preserve':
      return ts.ImportsNotUsedAsValues.Preserve;
    case 'error':
      return ts.ImportsNotUsedAsValues.Error;
    default:
      throw new Error('Invalid importsNotUsedAsValues');
  }
}