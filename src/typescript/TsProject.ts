import * as path from 'path';
import { Component, SampleDir, Task } from 'projen';
import {
  Eslint,
  NodeProject,
  Projenrc as NodeProjectProjenrc,
  TypeScriptCompilerOptions,
  TypescriptConfigOptions,
} from 'projen/lib/javascript';
import { TypeScriptProjectOptions } from 'projen/lib/typescript';
import { normalizePersistedPath } from 'projen/lib/util';
import * as semver from 'semver';
import { TsConfig } from './TsConfig';
import { TsProjenrc } from './TsProjenrc';
import { TsTypedocDocgen } from './TsTypedocDocgen';

/**
 * TypeScript project
 * @pjid typescript
 */
export class TsProject extends NodeProject {
  public static readonly DEFAULT_TS_JEST_TRANFORM_PATTERN = '^.+\\.[t]sx?$';

  public readonly docgen?: boolean;
  public readonly docsDirectory: string;
  public readonly eslint?: Eslint;
  public readonly tsconfigEslint?: TsConfig;
  public readonly tsconfig: TsConfig;

  /**
   * The directory in which the .ts sources reside.
   */
  public readonly srcdir: string;

  /**
   * The directory in which compiled .js files reside.
   */
  public readonly libdir: string;

  /**
   * The directory in which tests reside.
   */
  public readonly testdir: string;

  /**
   * The "watch" task.
   */
  public readonly watchTask: Task;

  constructor(options: TypeScriptProjectOptions) {
    super({
      ...options,

      // disable .projenrc.js if typescript is enabled
      projenrcJs: options.projenrcTs ? false : options.projenrcJs,

      jest: false,
      jestOptions: {
        ...options.jestOptions,
        jestConfig: {
          ...options.jestOptions?.jestConfig,
          testMatch: options.jestOptions?.jestConfig?.testMatch ?? [],
        },
      },
    });

    this.srcdir = options.srcdir ?? 'src';
    this.libdir = options.libdir ?? 'lib';

    this.docgen = options.docgen;
    this.docsDirectory = options.docsDirectory ?? 'docs/';

    const tsconfigFilename = options.tsconfig?.fileName;
    this.compileTask.exec(
      ['tsc', '--build', tsconfigFilename].filter(Boolean).join(' '),
    );

    this.watchTask = this.addTask('watch', {
      description: 'Watch & compile in the background',
      exec: ['tsc', '--build', '-w', tsconfigFilename]
        .filter(Boolean)
        .join(' '),
    });

    this.testdir = options.testdir ?? 'test';
    this.gitignore.include(`/${this.testdir}/`);
    this.npmignore?.exclude(`/${this.testdir}/`);

    if (options.entrypointTypes || this.entrypoint !== '') {
      const entrypointPath = path.join(
        path.dirname(this.entrypoint),
        path.basename(this.entrypoint, '.js'),
      );
      const normalizedPath = normalizePersistedPath(entrypointPath);
      const entrypointTypes =
        options.entrypointTypes ?? `${normalizedPath}.d.ts`;
      this.package.addField('types', entrypointTypes);
    }

    const compilerOptionDefaults: TypeScriptCompilerOptions = {
      alwaysStrict: true,
      declaration: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      inlineSourceMap: true,
      inlineSources: true,
      lib: ['es2019'],
      module: 'CommonJS',
      noEmitOnError: false,
      noFallthroughCasesInSwitch: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      resolveJsonModule: true,
      strict: true,
      strictNullChecks: true,
      strictPropertyInitialization: true,
      stripInternal: true,
      target: 'ES2019',
    };

    if (options.disableTsconfigDev && options.disableTsconfig) {
      throw new Error(
        "Cannot specify both 'disableTsconfigDev' and 'disableTsconfig' fields.",
      );
    }

    this.tsconfig = new TsConfig(
      this,
      mergeTsconfigOptions(
        {
          include: [`${this.srcdir}/**/*.ts`],
          // exclude: ['node_modules'], // TODO: shouldn't we exclude node_modules?
          compilerOptions: {
            rootDir: this.srcdir,
            outDir: this.libdir,
            ...compilerOptionDefaults,
          },
        },
        options.tsconfig,
      ),
    );

    this.gitignore.include(`/${this.srcdir}/`);
    this.npmignore?.exclude(`/${this.srcdir}/`);

    if (this.srcdir !== this.libdir) {
      // separated, can ignore the entire libdir
      this.gitignore.exclude(`/${this.libdir}`);
    } else {
      // collocated, can only ignore the compiled output
      this.gitignore.exclude(`/${this.libdir}/**/*.js`);
      this.gitignore.exclude(`/${this.libdir}/**/*.d.ts`);
      this.gitignore.exclude(`/${this.libdir}/**/*.d.ts.map`);
    }

    this.npmignore?.include(`/${this.libdir}/`);

    this.npmignore?.include(`/${this.libdir}/**/*.js`);
    this.npmignore?.include(`/${this.libdir}/**/*.d.ts`);

    this.gitignore.exclude('/dist/');
    this.npmignore?.exclude('dist'); // jsii-pacmak expects this to be "dist" and not "/dist". otherwise it will tamper with it

    this.npmignore?.exclude('/tsconfig.json');
    this.npmignore?.exclude('/.github/');
    this.npmignore?.exclude('/.vscode/');
    this.npmignore?.exclude('/.idea/');
    this.npmignore?.exclude('/.projenrc.js');
    this.npmignore?.exclude('tsconfig.tsbuildinfo');

    if (options.eslint ?? true) {
      this.eslint = new Eslint(this, {
        tsconfigPath: `./${this.tsconfig.fileName}`,
        dirs: [this.srcdir],
        devdirs: [this.testdir, 'build-tools'],
        fileExtensions: ['.ts', '.tsx'],
        lintProjenRc: false,
        ...options.eslintOptions,
      });

      this.tsconfigEslint = this.tsconfig;
    }

    // when this is a root project
    if (!this.parent) {
      if (options.projenrcTs) {
        new TsProjenrc(this, options.projenrcTsOptions);
      } else {
        // projenrc.js created in NodeProject needs to be added in tsconfigDev
        const projenrcJs = NodeProjectProjenrc.of(this);
        if (projenrcJs) {
          this.tsconfig.addInclude(projenrcJs.filePath);
        }
      }
    }

    const tsver = options.typescriptVersion
      ? `@${options.typescriptVersion}`
      : '';

    this.addDevDeps(
      `typescript${tsver}`,
      // @types/node versions numbers match the node runtime versions' major.minor, however, new
      // releases are only created when API changes are included in a node release... We might for
      // example have dependencies that require `node >= 12.22`, but as 12.21 and 12.22 did not
      // include API changes, `@types/node@12.20.x` is the "correct" version to use. As it is not
      // possible to easily determine the correct version to use, we pick up the latest version.
      //
      // Additionally, we default to tracking the 18.x line, as the current earliest LTS release of
      // node is 18.x, so this is what corresponds to the broadest compatibility with supported node
      // runtimes.
      `@types/node@^${semver.major(this.package.minNodeVersion ?? '18.0.0')}`,
    );

    // generate sample code in `src` and `lib` if these directories are empty or non-existent.
    if (options.sampleCode ?? true) {
      new SampleCode(this);
    }

    if (this.docgen) {
      new TsTypedocDocgen(this);
    }
  }
}

class SampleCode extends Component {
  constructor(project: TsProject) {
    super(project);
    const srcCode = [
      'export class Hello {',
      '  public sayHello() {',
      "    return 'hello, world!';",
      '  }',
      '}',
    ].join('\n');

    const testCode = [
      "import { Hello } from '../src';",
      '',
      "test('hello', () => {",
      "  expect(new Hello().sayHello()).toBe('hello, world!');",
      '});',
    ].join('\n');

    new SampleDir(project, project.srcdir, {
      files: {
        'index.ts': srcCode,
      },
    });

    if (project.jest) {
      new SampleDir(project, project.testdir, {
        files: {
          'hello.test.ts': testCode,
        },
      });
    }
  }
}

/**
 * TypeScript app.
 *
 * @pjid typescript-app
 */
export class TsAppProject extends TsProject {
  constructor(options: TypeScriptProjectOptions) {
    super({
      allowLibraryDependencies: false,
      releaseWorkflow: false,
      entrypoint: '', // "main" is not needed in typescript apps
      package: false,
      ...options,
    });
  }
}

/**
 * @internal
 */
export function mergeTsconfigOptions(
  ...options: (TypescriptConfigOptions | undefined)[]
): TypescriptConfigOptions {
  const definedOptions = options.filter(Boolean) as TypescriptConfigOptions[];
  return definedOptions.reduce<TypescriptConfigOptions>(
    (previous, current) => ({
      ...previous,
      ...current,
      include: [...(previous.include ?? []), ...(current.include ?? [])],
      exclude: [...(previous.exclude ?? []), ...(current.exclude ?? [])],
      compilerOptions: {
        ...previous.compilerOptions,
        ...current.compilerOptions,
      },
    }),
    { compilerOptions: {} },
  );
}
