import { javascript, JsonPatch, typescript } from 'projen';
import { PnpmWorkspace } from './pnpm';

export interface RootProjectOptions {
  name: string;
  versions: Record<string, string>;
  packageManager?: javascript.NodePackageManager;
  deps?: string[];
  devDeps?: string[];
}
export class RootProject extends typescript.TypeScriptProject {
  readonly versions: Record<string, string>;

  constructor(options: RootProjectOptions) {
    super({
      defaultReleaseBranch: 'main',
      name: options.name,
      packageManager:
        options.packageManager ?? javascript.NodePackageManager.PNPM,
      projenrcTs: true,
      projenDevDependency: false,
      deps: [
        ...[
          '@prettier/sync',
          'aws-cdk-lib',
          'case',
          'fast-glob',
          'prettier',
          'projen',
          'semver',
          'tslog',
          'typescript',
          'type-fest',
          'yaml',
        ],
        ...(options.deps ?? []),
      ],
      eslint: false,
      repository: 'github.com/johnathan-hitchpin/ts-quotable',
      copyrightOwner: 'Johnathan Davis',
      license: 'MIT',
      devDeps: [...['vitest', '@types/semver'], ...(options.devDeps ?? [])],
      peerDeps: ['constructs', 'projen'],
      prettier: true,
      prettierOptions: {
        settings: {
          singleQuote: true,
        },
      },
      jest: false,
    });
    this.versions = options.versions;

    this.npmrc.addConfig('node-linker', 'isolated');
    this.testTask.reset();
    this.testTask.exec('vitest run');
    this.package.file.patch(
      JsonPatch.add(
        '/packageManager',
        'pnpm@9.5.0+sha1.8c155dc114e1689d18937974f6571e0ceee66f1d',
      ),
    );
    this.gitignore.exclude('**/.idea');
    this.gitignore.exclude('**/.DS_Store');
  }

  preSynthesize(): void {
    new PnpmWorkspace({
      project: this,
      pinnedVersions: {
        constructs: this.versions.constructs,
        cdk: this.versions.cdk,
        projen: this.versions.projen,
        vitest: this.versions.vitest,
      },
    });
  }
}
