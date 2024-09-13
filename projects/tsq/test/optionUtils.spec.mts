import { TsConfigJson } from 'type-fest';
import { getTarget, getNewline, getModuleDetection, getModuleResolution, getModule, getJsx, getImportsNotUsedAsValues, toTsCompilerOps } from '../src/optionUtils.mjs';
import * as ts from 'typescript';
import { describe, test, expect } from 'vitest';

describe('optionUtils', () => {

  test('converts entire options', () => {
    const co: TsConfigJson['compilerOptions'] = {
      target: 'ES2018',
      module: 'Node16',
      moduleDetection: 'force',
      moduleResolution: 'Bundler',
      newLine: 'LF',
      jsx: 'react-native',
      importsNotUsedAsValues: 'remove'
    };
    const converted = toTsCompilerOps(co);
    expect(converted.target).to.equal(ts.ScriptTarget.ES2018);
    expect(converted.module).to.equal(ts.ModuleKind.Node16);
    expect(converted.moduleDetection).to.equal(ts.ModuleDetectionKind.Force);
    expect(converted.moduleResolution).to.equal(ts.ModuleResolutionKind.Bundler);
    expect(converted.newLine).to.equal(ts.NewLineKind.LineFeed);
    expect(converted.jsx).to.equal(ts.JsxEmit.ReactNative);
    expect(converted.importsNotUsedAsValues).to.equal(ts.ImportsNotUsedAsValues.Remove);

    const co2 = {...co};
    delete co2.module;
    delete co2.moduleResolution;
    delete co2.target;
    const converted2 = toTsCompilerOps(co2);
    expect(converted2.module).toBeUndefined();
    expect(converted2.moduleResolution).toBeUndefined();
    expect(converted2.target).toBeUndefined();

  });

  test('converts target', () => {
    expect(getTarget('es3')).to.equal(ts.ScriptTarget.ES3);
    expect(getTarget('ES5')).to.equal(ts.ScriptTarget.ES5);
    expect(getTarget('es2015')).to.equal(ts.ScriptTarget.ES2015);
    expect(getTarget('ES2016')).to.equal(ts.ScriptTarget.ES2016);
    expect(getTarget('eS2017')).to.equal(ts.ScriptTarget.ES2017);
    expect(getTarget('Es2018')).to.equal(ts.ScriptTarget.ES2018);
    expect(getTarget('eS2019')).to.equal(ts.ScriptTarget.ES2019);
    expect(getTarget('eS2020')).to.equal(ts.ScriptTarget.ES2020);
    expect(getTarget('eS2021')).to.equal(ts.ScriptTarget.ES2021);
    expect(getTarget('eS2022')).to.equal(ts.ScriptTarget.ES2022);
    expect(getTarget('eS2023')).to.equal(ts.ScriptTarget.ES2023);
    expect(getTarget('ESNext')).to.equal(ts.ScriptTarget.ESNext);
    expect(getTarget('json')).to.equal(ts.ScriptTarget.JSON);
    expect(getTarget('latest')).to.equal(ts.ScriptTarget.Latest);
    expect(() => getTarget('other')).to.throw('Invalid target');
  });

  test('converts newline', () => {
    expect(getNewline('crlf')).to.equal(ts.NewLineKind.CarriageReturnLineFeed);
    expect(getNewline('CRLF')).to.equal(ts.NewLineKind.CarriageReturnLineFeed);
    expect(getNewline('lf')).to.equal(ts.NewLineKind.LineFeed);
    expect(getNewline('LF')).to.equal(ts.NewLineKind.LineFeed);
    expect(() => getNewline('other' as any)).to.throw('Invalid newline');
  });

  test('converts module detection', () => {
    expect(getModuleDetection('legacy')).to.equal(ts.ModuleDetectionKind.Legacy);
    expect(getModuleDetection('auto')).to.equal(ts.ModuleDetectionKind.Auto);
    expect(getModuleDetection('force')).to.equal(ts.ModuleDetectionKind.Force);
    expect(() => getModuleDetection('other')).to.throw('Invalid module detection');
  });

  test('converts module resolution', () => {
    expect(getModuleResolution('node')).to.equal(ts.ModuleResolutionKind.NodeJs);
    expect(getModuleResolution('nodenext')).to.equal(ts.ModuleResolutionKind.NodeNext);
    expect(getModuleResolution('classic')).to.equal(ts.ModuleResolutionKind.Classic);
    expect(() => getModuleResolution('other')).to.throw('Invalid module resolution');
  });

  test('converts module', () => {
    expect(getModule('commonjs')).to.equal(ts.ModuleKind.CommonJS);
    expect(getModule('amd')).to.equal(ts.ModuleKind.AMD);
    expect(getModule('umd')).to.equal(ts.ModuleKind.UMD);
    expect(getModule('system')).to.equal(ts.ModuleKind.System);
    expect(getModule('es2015')).to.equal(ts.ModuleKind.ES2015);
    expect(getModule('esnext')).to.equal(ts.ModuleKind.ESNext);
    expect(getModule('node16')).to.equal(ts.ModuleKind.Node16);
    expect(getModule('nodenext')).to.equal(ts.ModuleKind.NodeNext);
    expect(() => getModule('other')).to.throw('Invalid module');
  });

  test('converts jsx', () => {
    expect(getJsx('none')).to.equal(ts.JsxEmit.None);
    expect(getJsx('preserve')).to.equal(ts.JsxEmit.Preserve);
    expect(getJsx('react')).to.equal(ts.JsxEmit.React);
    expect(getJsx('react-jsx')).to.equal(ts.JsxEmit.ReactJSX);
    expect(getJsx('react-jsxdev')).to.equal(ts.JsxEmit.ReactJSXDev);
    expect(getJsx('react-native')).to.equal(ts.JsxEmit.ReactNative);
    expect(() => getJsx('other')).to.throw('Invalid jsx');
  });

  test('converts importsNotUsedAsValues', () => {
    expect(getImportsNotUsedAsValues('remove')).to.equal(ts.ImportsNotUsedAsValues.Remove);
    expect(getImportsNotUsedAsValues('preserve')).to.equal(ts.ImportsNotUsedAsValues.Preserve);
    expect(getImportsNotUsedAsValues('error')).to.equal(ts.ImportsNotUsedAsValues.Error);
    expect(() => getImportsNotUsedAsValues('other')).to.throw('Invalid importsNotUsedAsValues');
  });
});