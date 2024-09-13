import { TypescriptConfigOptions, TypeScriptModuleResolution } from 'projen/lib/javascript';
import { TsProject } from './TsProject';
import { javascript, JsonPatch, Project } from 'projen';

const ModernOptions: TypescriptConfigOptions = {
  compilerOptions: {
    rootDir: '.',
    outDir: 'dist',
    module: 'NodeNext',
    moduleResolution: TypeScriptModuleResolution.NODE_NEXT,
    target: 'ESNext',
    declaration: true,
    declarationDir: 'dist',
    baseUrl: '',
    noUnusedLocals: false,
    lib: ['esnext'],
  },
  include: ['bin/tsq.mts', 'src/**/*.mts'],
  exclude: [],
};

export interface TsModernProjectOptions {
  name: string;
  defaultReleaseBranch: string;
  parent?: Project;
  outdir?: string;
  deps?: string[];
  devDeps?: string[];
}
export class TsModernProject extends TsProject {
  constructor(options: TsModernProjectOptions) {
    super({
      name: options.name,
      defaultReleaseBranch: options.defaultReleaseBranch,
      parent: options.parent,
      outdir: options.outdir,
      deps: [...(options.deps ?? [])],
      devDeps: [
        ...(options.devDeps ?? []),
        'vitest',
        '@vitest/coverage-istanbul',
        '@vitest/ui',
        'istanbul-badges-readme',
      ],
      prettier: true,
      prettierOptions: {
        settings: {
          singleQuote: true,
        },
      },
      copyrightOwner: 'Johnathan Davis',
      license: 'MIT',
      packageManager: javascript.NodePackageManager.PNPM,
      tsconfig: ModernOptions,
      tsconfigEslint: {
        ...ModernOptions,
        include: [...(ModernOptions.include! ?? []), 'vitest.config.mts']
      }
    });
    this.gitignore.exclude('test-reports/');
    this.gitignore.exclude('coverage');
    this.package.file.patch(JsonPatch.add('/type', 'module'));

    const tt = this.testTask;
    tt.reset();
    tt.exec('vitest run || cat test-reports/*');
    tt.exec("pnpm dlx istanbul-badges-readme --readmeDir='../../'");
  }
}
