import * as ts from 'typescript';
import { createFilter } from '@rollup/pluginutils';
import { TsConfigJson } from 'type-fest';
import path, { join } from 'path';
import { readFileSync } from 'fs';
import { toTsCompilerOps } from './optionUtils.mjs';
import { globSync } from 'fs';
import transformerFactory from './transformer.mjs';

interface Options {
  tsconfigPath?: string;
}
type CompilePreviewResult = {
  tsconfigPath: string,
  rootDir: string,
  includedFiles: string[],
}
type CompileResult = {
  emittedFiles: Map<string, ts.EmitResult>,
  tsconfigPath: string,
  rootDir: string,
}

function compile(options: Options): CompileResult {
  const [preview, program] = setupCompilation(options);
  
  const emitResults = new Map<string, ts.EmitResult>();
  program.getSourceFiles().filter(sf => sf.fileName.endsWith('index.mts')).forEach(sf => {
    const r = program.emit(sf, undefined, undefined, undefined, {
      before: [transformerFactory],
      after: [],
    })
    emitResults.set(sf.fileName, r);
  });

  return {
    emittedFiles: emitResults,
    rootDir: preview.rootDir,
    tsconfigPath: preview.tsconfigPath,
  };
}
function setupCompilation(options: Options): [CompilePreviewResult, ts.Program] {

  const tsconfigPath = options.tsconfigPath ?? ts.findConfigFile(
    "./",
    ts.sys.fileExists,
    "tsconfig.json"
  );
  if (!tsconfigPath || !ts.sys.fileExists(tsconfigPath)) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  const tsconfUtf8 = readFileSync(tsconfigPath).toString('utf8');
  const tsconf = JSON.parse(tsconfUtf8) as {
    include?: string[];
    exclude?: string[];
    compilerOptions: TsConfigJson['compilerOptions'];
  };

  const root = path.dirname(path.resolve(tsconfigPath));
  const includes = tsconf.include ?? ['**/*.tsx', '**/*.ts', '**/*.mts'];
  const excludes = tsconf.exclude ?? ['node_modules/**'];
  const filter = createFilter(includes.map(i => join(root, i)), excludes);
  const files = includes
    .map(i => globSync(join(root, i)))
    .flatMap(f => f)
    .filter(f => filter(f));

  const compilerOptions = toTsCompilerOps(tsconf.compilerOptions);

  const host = ts.createCompilerHost(compilerOptions);
  host.getCurrentDirectory = () => root;

  const program = ts.createProgram(files, compilerOptions, host);
  
  const prev: CompilePreviewResult = {
    includedFiles: files,
    tsconfigPath: tsconfigPath,
    rootDir: root
  };
  return [prev, program];
}
function previewCompilation(options: Options): CompilePreviewResult {
  return setupCompilation(options)[0];
}

export default compile;
export { previewCompilation };