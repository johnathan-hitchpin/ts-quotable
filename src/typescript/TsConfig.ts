import * as path from 'path';
import { Component, JsonFile, Project } from 'projen';
import {
  NodeProject,
  TypeScriptCompilerOptions,
  TypescriptConfig,
  TypescriptConfigExtends,
  TypescriptConfigOptions,
} from 'projen/lib/javascript';
import { normalizePersistedPath } from 'projen/lib/util';
import * as semver from 'semver';

export class TsConfig extends Component {
  private _extends: TypescriptConfigExtends;
  public readonly compilerOptions?: TypeScriptCompilerOptions;
  private readonly includeSet: Set<string>;
  private readonly excludeSet: Set<string>;
  public readonly fileName: string;
  public readonly file: JsonFile;

  constructor(project: Project, options: TypescriptConfigOptions) {
    super(project);
    const fileName = options.fileName ?? 'tsconfig.json';

    if (!options.extends && !options.compilerOptions) {
      throw new Error(
        'TypescriptConfig: Must provide either `extends` or `compilerOptions` (or both).',
      );
    }

    this._extends = options.extends ?? TypescriptConfigExtends.fromPaths([]);
    this.includeSet = options.include
      ? new Set(options.include)
      : new Set(['**/*.ts']);
    this.excludeSet = options.exclude
      ? new Set(options.exclude)
      : new Set(['node_modules']);
    this.fileName = fileName;

    this.compilerOptions = options.compilerOptions;

    this.file = new JsonFile(project, fileName, {
      allowComments: false,
      obj: {
        extends: () => this.renderExtends(),
        compilerOptions: this.compilerOptions,
        include: () => this.include,
        exclude: () => this.exclude,
      },
    });

    if (project instanceof NodeProject) {
      project.npmignore?.exclude(`/${fileName}`);
    }
  }

  public get include(): string[] {
    return [...this.includeSet];
  }

  public get exclude(): string[] {
    return [...this.excludeSet];
  }

  /**
   * Render appropriate value for `extends` field.
   * @private
   */
  private renderExtends(): string | string[] | undefined {
    if (this.extends.length <= 1) {
      // render string value when only one extension (TS<5.0);
      // omit if no extensions.
      return this.extends[0];
    }
    // render many extensions as array (TS>=5.0)
    return this.extends;
  }

  /**
   * Resolve valid TypeScript extends paths relative to this config.
   *
   * @remarks
   * This will only resolve the relative path from this config to another given
   * an absolute path as input. Any non-absolute path or other string will be returned as is.
   * This is to preserve manually specified relative paths as well as npm import paths.
   *
   * @param configPath Path to resolve against.
   */
  public resolveExtendsPath(configPath: string): string {
    // if not absolute assume user-defined path (or npm package).
    if (!path.isAbsolute(configPath)) return configPath;
    const relativeConfig = path.relative(
      path.dirname(this.file.absolutePath),
      configPath,
    );
    // ensure immediate sibling files are prefixed with './'
    // typescript figures this out, but some tools seemingly break without it (i.e, eslint).
    const { dir, ...pathParts } = path.parse(relativeConfig);
    const configDir = dir
      ? path.format({ dir: dir.startsWith('..') ? '' : '.', base: dir })
      : '.';

    const extendsPath = path.format({ ...pathParts, dir: configDir });

    return normalizePersistedPath(extendsPath);
  }

  /**
   * Validate usage of `extends` against current TypeScript version.
   * @private
   */
  private validateExtends() {
    const project = this.project;
    const hasOneOrNoneExtends = this.extends.length <= 1;
    const isNodeProject = project instanceof NodeProject;
    if (hasOneOrNoneExtends || !isNodeProject) {
      // always accept no extends or singular extends.
      return;
    }
    const tsVersion = semver.coerce(
      project.package.tryResolveDependencyVersion('typescript'),
      { loose: true },
    );
    if (tsVersion && tsVersion.major < 5) {
      this.project.logger.warn(
        'TypeScript < 5.0.0 can only extend from a single base config.',
        `TypeScript Version: ${tsVersion.format()}`,
        `File: ${this.file.absolutePath}`,
        `Extends: ${this.extends}`,
      );
    }
  }

  /**
   * Array of base `tsconfig.json` paths.
   * Any absolute paths are resolved relative to this instance,
   * while any relative paths are used as is.
   */
  public get extends(): string[] {
    return this._extends
      .toJSON()
      .map((value) => this.resolveExtendsPath(value));
  }

  /**
   * Extend from base `TypescriptConfig` instance.
   *
   * @remarks
   * TypeScript 5.0+ is required to extend from more than one base `TypescriptConfig`.
   *
   * @param value Base `TypescriptConfig` instance.
   */
  public addExtends(value: TypescriptConfig) {
    this._extends = TypescriptConfigExtends.fromPaths([
      ...this._extends.toJSON(),
      value.file.absolutePath,
    ]);
  }

  /**
   * Add an include pattern to the `include` array of the TSConfig.
   *
   * @see https://www.typescriptlang.org/tsconfig#include
   *
   * @param pattern The pattern to add.
   */
  public addInclude(pattern: string) {
    this.include.push(pattern);
    this.includeSet.add(pattern);
  }

  /**
   * Add an exclude pattern to the `exclude` array of the TSConfig.
   *
   * @see https://www.typescriptlang.org/tsconfig#exclude
   *
   * @param pattern The pattern to add.
   */
  public addExclude(pattern: string) {
    this.exclude.push(pattern);
    this.excludeSet.add(pattern);
  }

  /**
   * Remove an include pattern from the `include` array of the TSConfig.
   *
   * @see https://www.typescriptlang.org/tsconfig#include
   *
   * @param pattern The pattern to remove.
   */
  public removeInclude(pattern: string) {
    this.includeSet.delete(pattern);
  }

  /**
   * Remove an exclude pattern from the `exclude` array of the TSConfig.
   *
   * @see https://www.typescriptlang.org/tsconfig#exclude
   *
   * @param pattern The pattern to remove.
   */
  public removeExclude(pattern: string) {
    this.excludeSet.delete(pattern);
  }

  preSynthesize() {
    super.preSynthesize();
    this.validateExtends();
  }
}
