import * as ts from 'typescript';
import vm, { SourceTextModule, SyntheticModule } from 'node:vm';
import transformerFactory from '../src/transformer.mjs';
import quoted from '../src/quoted.mjs';
import quotesOf from '../src/quotesOf.mjs';
import tmp from 'tmp';
import { writeFile, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { createSegmentsFromDeclaration as createSegs, SegmentKind, type Segment } from '../src/templates.mts';

const moduleFile = resolve(import.meta.dirname, '../src/index.mts');
const nodeTypesDir = resolve(import.meta.dirname, '../node_modules/@types/node/');

export const transformSource = async (src: string): Promise<string> => {
  const cleanup: string[] = [];
  try {
    const s = await writeSource(src);
    cleanup.push(s);
    const options: ts.CompilerOptions = {
      module: ts.ModuleKind.NodeNext,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      moduleDetection: ts.ModuleDetectionKind.Force,
      outDir: './'
    };
    const host = createCompilerHost(options);
    const program = ts.createProgram([s], options, host);

    const createdFiles: Map<string, string> = new Map<string, string>();
    const sf = program.getSourceFiles().find(sf => dirname(sf.fileName) === dirname(s))!;
    host.writeFile = (f, src) => createdFiles.set(f, src);
    program.emit(sf, undefined, undefined, undefined, {
      before: [transformerFactory],
      after: [],
    })

    const cfKey = Array.from(createdFiles.keys()).find(k => k.includes(dirname(s)))!;
    return createdFiles.get(cfKey)!;
  } finally {
    cleanup.forEach(f => rmSync(f));
  }
}

const writeSource = async (src: string): Promise<string> => {
  return await new Promise<string>((resolve, reject) => {
    tmp.file({
      template: 'tsq-vitest-XXXXXX.mts',
      tmpdir: tmpdir(),
      keep: true,
      tries: 1,
      prefix: 'tsq-vitest-',
      postfix: '.mts'
    } as any, function _tempFileCreated(err, path) {
      if (err) {
        reject(err);
      }
      writeFile(path, src, 'utf8', (err) => {
        if (!err) resolve(path);
        else reject(err);
      });
    });
  });
}

export const quotesOfExec = async (quotableSrc: string): Promise<any> => {
  const transformed = await transformSource(quotableSrc);

  let result: any;
  const globals = {
    setResult: (r) => result = r
  };
  const context = vm.createContext(globals);
  const quotedModule = new SourceTextModule(transformed, { context: context });

  const quotableLinker: vm.ModuleLinker = async (specifier, referencingModule): Promise<vm.Module> => {
    if (specifier === 'ts-quotable') {
      return new SyntheticModule(['quoted', 'quotesOf'], function () {
        this.setExport('quoted', quoted);
        this.setExport('quotesOf', quotesOf);
      }, {
        context: referencingModule.context
      });
    } else if (specifier === 'quoted') {
      return quotedModule;
    }
    throw new Error(`Unable to resolve dependency: ${specifier}`);
  }

  const evalModule = new SourceTextModule(
    `
    import q from 'quoted';
    import { quotesOf } from 'ts-quotable';
    setResult(quotesOf(q));
    `, { context: context })
  await evalModule.link(quotableLinker);
  await evalModule.evaluate();

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars



function createCompilerHost(options: ts.CompilerOptions): ts.CompilerHost {
  return {
    getSourceFile,
    getDefaultLibFileName: () => "lib.d.ts",
    writeFile: (fileName, content) => ts.sys.writeFile(fileName, content),
    getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
    getDirectories: path => ts.sys.getDirectories(path),
    getCanonicalFileName: fileName =>
      ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
    getNewLine: () => ts.sys.newLine,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    fileExists,
    readFile,
    resolveModuleNames
  };

  function fileExists(fileName: string): boolean {
    return ts.sys.fileExists(fileName);
  }

  function readFile(fileName: string): string | undefined {
    return ts.sys.readFile(fileName);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void) {
    const sourceText = ts.sys.readFile(fileName);
    return sourceText !== undefined
      ? ts.createSourceFile(fileName, sourceText, languageVersion)
      : undefined;
  }

  function resolveModuleNames(
    moduleNames: string[],
    containingFile: string
  ): ts.ResolvedModule[] {
    const resolvedModules: ts.ResolvedModule[] = [];
    for (const moduleName of moduleNames) {
      let rname = moduleName;
      if (rname.startsWith('node:')) {
        rname = rname.split(':').slice(1)[0];
      }
      if (rname.includes('/')) {
        rname = rname.split('/')[0];
      }
      if (moduleName === 'ts-quotable') {
        resolvedModules.push({ resolvedFileName: moduleFile })
      } else if (existsSync(join(nodeTypesDir, `${rname}.d.ts`))) {
        resolvedModules.push({ resolvedFileName: join(nodeTypesDir, `${rname}.d.ts`) });
      } else {
        const result = ts.resolveModuleName(moduleName, containingFile, options, {
          fileExists,
          readFile
        });
        if (result.resolvedModule) {
          resolvedModules.push(result.resolvedModule);
        } else {
          throw new Error(`Could not resolve module referenced in ${containingFile}: ${moduleName}`);
        }
      }
    }
    return resolvedModules;
  }
}

export const createSegments = (m: string, k: SegmentKind): Segment[] => {
  const sf = ts.createSourceFile('asdf.ts', m, ts.ScriptTarget.ESNext, true);
  const md = sf.statements[0] as ts.FunctionDeclaration;
  return createSegs(md, k);
}